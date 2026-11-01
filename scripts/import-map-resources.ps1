param([Parameter(Mandatory=$true)][string]$Source, [string]$Destination = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $Destination) { $Destination = Join-Path $projectRoot 'outputs/HyruleSync/.data' }
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'assets/resources.json') -Raw | ConvertFrom-Json
foreach ($item in $manifest.files) {
    $inputPath = Join-Path $Source $item.source
    $sha = [Security.Cryptography.SHA256]::Create()
    $inputStream = [IO.File]::OpenRead($inputPath)
    try { $hash = [BitConverter]::ToString($sha.ComputeHash($inputStream)).Replace('-', '').ToLowerInvariant() }
    finally { $inputStream.Dispose(); $sha.Dispose() }
    if ($hash -ne $item.sha256) { throw "The resource does not match the pinned version: $inputPath" }
    $outputPath = Join-Path $Destination $item.path
    New-Item -ItemType Directory -Force (Split-Path $outputPath -Parent) | Out-Null
    Copy-Item -LiteralPath $inputPath -Destination $outputPath
}
Write-Host "Resources imported and verified: $Destination"
