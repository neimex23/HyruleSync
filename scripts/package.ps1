param([string]$OutputDirectory = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectRoot 'outputs/HyruleSync' }
$version = (Get-Content -LiteralPath (Join-Path $projectRoot 'assets/credits.json') -Raw | ConvertFrom-Json).version
$archiveName = "HyruleSync-v$version-windows.zip"
$archive = Join-Path $projectRoot "outputs/$archiveName"
$items = @('HyruleSync.exe', 'HyruleSync.Stop.exe', 'README.md', 'LEEME.es.md', 'THIRD_PARTY.md', 'THIRD_PARTY.es.md', 'LICENSE', 'licenses') | ForEach-Object { Join-Path $OutputDirectory $_ }
# Explicit allowlist: never package .data, .state, save files or local history.
Compress-Archive -LiteralPath $items -DestinationPath $archive -Force
$sha = [Security.Cryptography.SHA256]::Create()
$archiveStream = [IO.File]::OpenRead($archive)
try { $hash = [BitConverter]::ToString($sha.ComputeHash($archiveStream)).Replace('-', '').ToLowerInvariant() }
finally { $archiveStream.Dispose(); $sha.Dispose() }
Set-Content -LiteralPath ($archive + '.sha256') -Value "$hash  $archiveName" -Encoding ascii
Write-Host "Shareable package: $archive"
