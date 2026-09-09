[CmdletBinding()]
param([string]$Root)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
$importRoot = Join-Path $Root 'src/motions/_import'
$outputPath = Join-Path $Root 'src/motions/packCatalog.json'

function Title-FromSlug([string]$Slug) {
  (($Slug -replace '^cuecut-', '') -split '-' | ForEach-Object { if ($_.Length -eq 0) { return }; $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }) -join ' '
}

function Get-VisualTags([string]$Id) {
  $tags = New-Object System.Collections.Generic.List[string]
  if ($Id -match 'chart|graph|metric|progress|ring|bars|heatmap|funnel|kpi|trend|goal|milestone') { $tags.Add('Chart'); $tags.Add('Metric') }
  if ($Id -match 'caption|quote|definition|term|alert|callout|name-plate|lower-third|product|tool|price|date|key-point') { $tags.Add('Text'); $tags.Add('Card') }
  if ($Id -match 'pointer|arrow|cursor|focus|marker|highlight|underline|spotlight|reticle|keyword') { $tags.Add('Pointer'); $tags.Add('Highlight') }
  if ($Id -match 'list|steps|flow|timeline|checklist|ranking|versus|comparison|pros-cons|before-after') { $tags.Add('List'); $tags.Add('Steps') }
  if ($Id -match 'icon|badge|social|notification|status|loading|spark|emoji|reaction|keyboard|clipboard|transfer|link') { $tags.Add('Badge'); $tags.Add('Icon') }
  if ($Id -match 'window|terminal|command|code|device|laptop|camera|screen-recording|ui-callout') { $tags.Add('Card'); $tags.Add('MotionLayer') }
  if ($tags.Count -eq 0) { $tags.Add('Card') }
  return @($tags | Select-Object -Unique)
}

function Get-MotionCategory([string]$Id) {
  if ($Id -match 'chart|metric|progress|ring|bars|heatmap|funnel|kpi|trend|goal|milestone') { return 'Scale' }
  if ($Id -match 'caption|quote|definition|term|alert|callout|name-plate|lower-third|product|tool|price|date|key-point') { return 'Pop' }
  if ($Id -match 'window|terminal|command|code|device|laptop|camera|screen-recording') { return 'Slide' }
  if ($Id -match 'loading|transfer|ticker|social|notification') { return 'Ticker' }
  if ($Id -match 'list|steps|flow|timeline|checklist|ranking|versus|comparison|pros-cons|before-after') { return 'ListStagger' }
  return 'Fade'
}

$entries = foreach ($descriptor in Get-ChildItem -LiteralPath $importRoot -Recurse -Filter 'cuecut-*.json' -File | Sort-Object FullName) {
  $descriptorData = Get-Content -Raw -LiteralPath $descriptor.FullName | ConvertFrom-Json
  $packDirectory = Split-Path -Parent (Split-Path -Parent $descriptor.FullName)
  $packName = Split-Path -Leaf $packDirectory
  if ($packName -notmatch '_v(?<version>[0-9.]+)$') { continue }
  $version = $Matches.version
  if ($version -eq '0.1') { continue }
  $relativeDescriptor = $descriptor.FullName.Substring($Root.Length + 1).Replace('\', '/')
  $id = [string]$descriptorData.id
  $duration = if ($descriptorData.recommendedDurationSec) { @([double]$descriptorData.recommendedDurationSec[0], [double]$descriptorData.recommendedDurationSec[1]) } else { @(0.4, 2.0) }
  $semantic = @(([string]$descriptorData.family).ToLowerInvariant()) + @($id.Replace('cuecut-', '').Split('-') | Where-Object { $_.Length -gt 1 })
  [PSCustomObject]@{
    id = $id
    displayName = Title-FromSlug $id
    packId = $packName
    packVersion = $version
    family = [string]$descriptorData.family
    effectFamilyId = ('pack-' + $version.Replace('.', '-') + '-' + ([string]$descriptorData.family).ToLowerInvariant().Replace(' ', '-'))
    semanticTags = @($semantic | Select-Object -Unique)
    visualTags = @(Get-VisualTags $id)
    motionCategory = Get-MotionCategory $id
    adapterId = 'pack:' + $id
    supportedAspectRatios = @('16:9', '9:16', '1:1')
    durationRangeSec = $duration
    useCases = @($descriptorData.useCases)
    avoidCases = @($descriptorData.avoidCases)
    source = 'CueCut original pack adapter'
    sourceRef = $relativeDescriptor
    license = 'PROJECT-LOCAL'
    licenseRef = 'docs/audit/MOTION_PACK_INSTALL_REPORT.md'
  }
}

if ($entries.Count -ne 87) { throw "Expected 87 descriptors from v0.2-v0.7, found $($entries.Count)" }
[IO.Directory]::CreateDirectory((Split-Path -Parent $outputPath)) | Out-Null
$catalogJson = $entries | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($outputPath, $catalogJson, [Text.UTF8Encoding]::new($false))
$catalogJson | Write-Output
