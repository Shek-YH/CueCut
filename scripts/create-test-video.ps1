[CmdletBinding()]
param(
  [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'test-results/cuecut-fixture.mp4'),
  [string]$FfmpegPath = 'ffmpeg'
)

$ErrorActionPreference = 'Stop'
$parent = Split-Path -Parent $OutputPath
[IO.Directory]::CreateDirectory($parent) | Out-Null
$arguments = @(
  '-y',
  '-f', 'lavfi', '-i', 'color=c=0x10141c:s=320x180:r=30:d=6',
  '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
  '-shortest',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  $OutputPath
)
& $FfmpegPath @arguments
if ($LASTEXITCODE -ne 0) { throw "FFmpeg fixture generation failed with exit code $LASTEXITCODE" }
Write-Output $OutputPath
