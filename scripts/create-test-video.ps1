[CmdletBinding()]
param(
  [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'test-results/cuecut-fixture.mp4'),
  [string]$FfmpegPath = ''
)

$ErrorActionPreference = 'Stop'

# NOTE: every string in this file is intentionally ASCII-only. Windows PowerShell 5.1 reads
# .ps1 files using the ANSI code page unless the file starts with a UTF-8 BOM, so non-ASCII
# text here would be mis-decoded and can break parsing.

# Repair a truncated PATHEXT before doing any command discovery or native invocation.
#
# Verified on this machine: some shells/sandboxes expose PATHEXT=".CPL" only. Without ".EXE"
# in PATHEXT, Windows PowerShell 5.1 does not recognise *.exe as executable commands - it
# treats them as documents, so `Get-Command ffmpeg` returns nothing and `& $exePath` fails with
# "Cannot run a document in the middle of a pipeline" (CantActivateDocumentInPipeline).
$requiredExtensions = @('.COM', '.EXE', '.BAT', '.CMD')
$currentExtensions = @()
if ($env:PATHEXT) { $currentExtensions = @($env:PATHEXT -split ';' | Where-Object { $_ }) }
$missingExtensions = @($requiredExtensions | Where-Object { $currentExtensions -notcontains $_ })
if ($missingExtensions.Count -gt 0) {
  $env:PATHEXT = (@($currentExtensions + $requiredExtensions) | Select-Object -Unique) -join ';'
}

# Follow a reparse-point shim (symlink) to the real executable it points at.
#
# WinGet installs ffmpeg as a symbolic link inside "%LOCALAPPDATA%\Microsoft\WinGet\Links".
# Windows PowerShell 5.1 cannot invoke such a shim through the call operator - it fails with
# CantActivateDocumentInPipeline - so we have to resolve through to the real binary.
function Resolve-ExecutablePath {
  param([string]$Path)

  $item = Get-Item -LiteralPath $Path -ErrorAction SilentlyContinue
  if ($item -and $item.LinkType -and $item.Target) {
    $target = @($item.Target)[0]
    if ($target -and (Test-Path -LiteralPath $target)) {
      return (Resolve-Path -LiteralPath $target).Path
    }
  }
  return (Resolve-Path -LiteralPath $Path).Path
}

# Resolve ffmpeg robustly.
#
# Why we cannot just call `ffmpeg`: verified on this machine that `Get-Command ffmpeg` returns
# nothing in a fresh `powershell -NoProfile` session, even though the WinGet shim exists.
# Relying on a bare `ffmpeg` therefore fails with CommandNotFoundException.
function Resolve-Ffmpeg {
  param([string]$Explicit)

  if ($Explicit) {
    if (Test-Path -LiteralPath $Explicit) { return (Resolve-ExecutablePath -Path $Explicit) }
    $fromPath = Get-Command $Explicit -ErrorAction SilentlyContinue
    if ($fromPath) { return (Resolve-ExecutablePath -Path $fromPath.Source) }
    throw "FfmpegPath '$Explicit' is neither an existing file nor resolvable from PATH."
  }

  $fromPath = Get-Command 'ffmpeg' -ErrorAction SilentlyContinue
  if ($fromPath) { return (Resolve-ExecutablePath -Path $fromPath.Source) }

  # Build the probe list defensively: ${env:ProgramFiles(x86)} and friends can legitimately be
  # null, and Join-Path throws ParameterArgumentValidationErrorNullNotAllowed on a null parent.
  $candidates = New-Object System.Collections.Generic.List[string]
  if ($env:LOCALAPPDATA) { $candidates.Add("$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe") }
  if (${env:ProgramFiles}) { $candidates.Add("${env:ProgramFiles}\ffmpeg\bin\ffmpeg.exe") }
  if (${env:ProgramFiles(x86)}) { $candidates.Add("${env:ProgramFiles(x86)}\ffmpeg\bin\ffmpeg.exe") }
  $candidates.Add('C:\ffmpeg\bin\ffmpeg.exe')
  $candidates.Add('/usr/bin/ffmpeg')
  $candidates.Add('/usr/local/bin/ffmpeg')
  # Last resort: scan every directory on PATH (covers choco / scoop / custom installs).
  foreach ($dir in ($env:Path -split ';')) {
    if ($dir -and $dir.Trim() -ne '') { $candidates.Add(($dir.TrimEnd('\') + '\ffmpeg.exe')) }
  }

  $probes = @($candidates | Where-Object { $_ -and $_.Trim() -ne '' } | Select-Object -Unique)

  foreach ($candidate in $probes) {
    if (Test-Path -LiteralPath $candidate) { return (Resolve-ExecutablePath -Path $candidate) }
  }

  throw ("Cannot find ffmpeg; refusing to generate the test fixture. Probed: " + ($probes -join ' | ') +
    " . Add ffmpeg to PATH, or pass -FfmpegPath <path> / set CUECUT_FFMPEG_PATH.")
}

# Allow the test harness to hand the binary in through the environment as well.
if (-not $FfmpegPath -and $env:CUECUT_FFMPEG_PATH) { $FfmpegPath = $env:CUECUT_FFMPEG_PATH }
$ffmpeg = Resolve-Ffmpeg -Explicit $FfmpegPath

$parent = Split-Path -Parent $OutputPath
if ($parent -and -not (Test-Path -LiteralPath $parent)) {
  [IO.Directory]::CreateDirectory($parent) | Out-Null
}

$arguments = @(
  '-y',
  '-nostdin',
  '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'color=c=0x10141c:s=320x180:r=30:d=6',
  '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
  '-shortest',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  $OutputPath
)

# Windows PowerShell 5.1 turns a native command's stderr into an ErrorRecord, and with
# $ErrorActionPreference = 'Stop' that aborts the script even when ffmpeg exits 0 (ffmpeg
# always writes log output to stderr). Relax the preference around the call, capture the
# output for diagnostics, then read the exit code explicitly.
$ErrorActionPreference = 'Continue'
$ffmpegOutput = (& $ffmpeg @arguments 2>&1 | Out-String).Trim()
$exitCode = $LASTEXITCODE
$ErrorActionPreference = 'Stop'

if ($exitCode -ne 0) {
  throw "FFmpeg fixture generation failed with exit code $exitCode using '$ffmpeg'. Output: $ffmpegOutput"
}
if (-not (Test-Path -LiteralPath $OutputPath)) {
  throw "FFmpeg reported success but did not create $OutputPath. Output: $ffmpegOutput"
}
Write-Output $OutputPath
