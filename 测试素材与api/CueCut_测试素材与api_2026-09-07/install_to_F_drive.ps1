param(
  [string]$Target = "F:\CCPJ\CueCut\测试素材与api"
)
$Source = Split-Path -Parent $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Force -Path $Target | Out-Null
Get-ChildItem -LiteralPath $Source -Force | Where-Object { $_.Name -ne "install_to_F_drive.ps1" } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $Target -Recurse -Force
}
Write-Host "已复制到: $Target"
