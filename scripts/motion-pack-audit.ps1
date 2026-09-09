[CmdletBinding()]
param(
  [string]$Root,
  [switch]$Extract,
  [switch]$Finalize
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }

$motionsRoot = Join-Path $Root 'src/motions'
$stagingRoot = Join-Path $motionsRoot '_import'
$auditRoot = Join-Path $Root 'docs/audit'
$inventoryPath = Join-Path $auditRoot 'MOTION_PACK_INVENTORY.md'
$installReportPath = Join-Path $auditRoot 'MOTION_PACK_INSTALL_REPORT.md'

function Read-ZipEntryText([System.IO.Compression.ZipArchiveEntry]$Entry) {
  $reader = [System.IO.StreamReader]::new($Entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Get-Sha256([string]$Path) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($Path))).Replace('-', '')).ToUpperInvariant() } finally { $sha.Dispose() }
}

function Test-UnsafeEntry([System.IO.Compression.ZipArchiveEntry]$Entry) {
  $name = $Entry.FullName.Replace('\', '/')
  if ($name.StartsWith('/') -or $name -match '^[A-Za-z]:/' -or $name -match '(^|/)\.\.(/|$)') { return 'path escape' }
  if (($Entry.ExternalAttributes -shr 16) -band 0xF000 -eq 0xA000) { return 'symlink entry' }
  if ($name -match '(?i)(^|/)postinstall($|\.)|\.(js|ps1|bat|cmd|exe|sh)$') { return 'executable or script entry' }
  return $null
}

function Expand-SafeZip([string]$ZipPath, [string]$Destination) {
  $archive = [IO.Compression.ZipFile]::OpenRead($ZipPath)
  try {
    foreach ($entry in $archive.Entries) {
      $unsafeReason = Test-UnsafeEntry $entry
      if ($unsafeReason) { throw "Unsafe ZIP entry '$($entry.FullName)': $unsafeReason" }
      $relative = $entry.FullName.Replace('/', [IO.Path]::DirectorySeparatorChar)
      $target = [IO.Path]::GetFullPath((Join-Path $Destination $relative))
      $rootWithSeparator = [IO.Path]::GetFullPath($Destination).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
      if (-not $target.StartsWith($rootWithSeparator, [StringComparison]::OrdinalIgnoreCase)) { throw "ZIP entry escapes destination: $($entry.FullName)" }
      if ([string]::IsNullOrEmpty($entry.Name)) {
        [IO.Directory]::CreateDirectory($target) | Out-Null
        continue
      }
      [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
      $input = $entry.Open()
      try {
        $output = [IO.File]::Open($target, [IO.FileMode]::Create, [IO.FileAccess]::Write, [IO.FileShare]::None)
        try { $input.CopyTo($output) } finally { $output.Dispose() }
      } finally { $input.Dispose() }
    }
  } finally { $archive.Dispose() }
}

function Get-PackCategory([string]$PackRoot, [string]$Version) {
  $index = Get-ChildItem -LiteralPath $PackRoot -Filter 'PACK_INDEX.json' -File -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($index) {
    $parsed = Get-Content -Raw -LiteralPath $index.FullName | ConvertFrom-Json
    return @($parsed.families.PSObject.Properties.Name -join ', ')
  }
  if ($Version -eq '0.1') { return @('Text', 'Number', 'List', 'MotionLayer') }
  return @('Unclassified')
}

$zips = @(Get-ChildItem -LiteralPath $motionsRoot -Recurse -Filter '*.zip' -File | Sort-Object Name)
if ($zips.Count -eq 0) { throw "No motion pack ZIP found under $motionsRoot" }
[IO.Directory]::CreateDirectory($auditRoot) | Out-Null

$records = foreach ($zip in $zips) {
  $hash = Get-Sha256 $zip.FullName
  $archive = [IO.Compression.ZipFile]::OpenRead($zip.FullName)
  try {
    $unsafe = @($archive.Entries | ForEach-Object { $reason = Test-UnsafeEntry $_; if ($reason) { [PSCustomObject]@{ Entry = $_.FullName; Reason = $reason } } })
    if ($unsafe.Count -gt 0) { throw "Unsafe entries in $($zip.Name): $($unsafe | ConvertTo-Json -Compress)" }
    $metadataEntry = $archive.Entries | Where-Object FullName -match '(^|/)SOURCE_METADATA\.json$' | Select-Object -First 1
    if (-not $metadataEntry) { throw "SOURCE_METADATA.json missing from $($zip.Name)" }
    $metadata = Read-ZipEntryText $metadataEntry | ConvertFrom-Json
    $version = [string]$metadata.version
    $packRoot = Join-Path $stagingRoot ($zip.BaseName)
    if ($Extract) {
      Expand-SafeZip -ZipPath $zip.FullName -Destination $stagingRoot
    }
    $sourceNames = @()
    if ($metadata.sources) { $sourceNames = @($metadata.sources | ForEach-Object { $_.name }) }
    if ($metadata.thirdPartyReferences) { $sourceNames = @($metadata.thirdPartyReferences | ForEach-Object { $_.name }) }
    $status = if ($Finalize -or $version -eq '0.1') { 'FORMALLY_INSTALLED' } else { 'AUDITED_STAGING' }
    [PSCustomObject]@{
      Pack = $zip.Name
      ZipPath = $zip.FullName.Substring($Root.Length + 1).Replace('\', '/')
      Size = $zip.Length
      SHA256 = $hash
      Source = (($sourceNames | Sort-Object -Unique) -join ', ')
      License = if ($version -eq '0.1') { 'MIT (selected upstream files)' } else { 'CueCut-original adapters; third-party references audited separately' }
      Categories = ((Get-PackCategory -PackRoot $packRoot -Version $version) -join ', ')
      Status = $status
      Version = $version
      EntryCount = $archive.Entries.Count
      UnsafeEntries = $unsafe.Count
    }
  } finally { $archive.Dispose() }
}

if ($Finalize) {
  $gatePath = Join-Path $auditRoot 'MOTION_RUNTIME_GATE.json'
  if (-not (Test-Path -LiteralPath $gatePath)) { throw "Runtime gate evidence is missing: $gatePath" }
  $gate = Get-Content -Raw -LiteralPath $gatePath | ConvertFrom-Json
  if ($gate.status -ne 'PASS' -or $gate.catalogCount -ne 87 -or $gate.formalMotionCount -ne 106 -or $gate.runtimeMismatchCount -ne 0 -or $gate.licenseGate -ne 'PASS') { throw 'Runtime/license gate evidence is not passing' }
}

$rows = $records | ForEach-Object {
  "| $($_.Pack) | $($_.ZipPath) | $($_.Size) | $($_.SHA256) | $($_.Source) | $($_.License) | $($_.Categories) | $($_.Status) |"
}
$header = @(
  '# Motion Pack Inventory',
  '',
  "> Generated by `scripts/motion-pack-audit.ps1` on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz').",
  '',
  '| Pack | ZIP Path | Size | SHA256 | Source | License | Categories | Status |',
  '|---|---|---:|---|---|---|---|---|'
)
Set-Content -LiteralPath $inventoryPath -Value ($header + $rows) -Encoding utf8

$report = @(
  '# Motion Pack Install Report',
  '',
  "- ZIPs discovered: $($records.Count)",
  "- ZIPs with unsafe entries: $(($records | Where-Object UnsafeEntries -gt 0).Count)",
  '- Staging root: src/motions/_import',
  '- Source-pack scripts were not executed.',
  '- Third-party reference folders remain provenance-only; formal runtime uses CueCut-local deterministic adapters.',
  '',
  '## Pack Results',
  ''
) + ($records | ForEach-Object { '- {0} - status={1}; {2} entries; SHA256={3}; categories: {4}.' -f $_.Pack, $_.Status, $_.EntryCount, $_.SHA256, $_.Categories })
Set-Content -LiteralPath $installReportPath -Value $report -Encoding utf8

$records | ConvertTo-Json -Depth 8 | Write-Output
