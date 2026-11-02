param([string]$OutputDirectory = '', [string]$Version = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectRoot 'outputs/HyruleSync' }
$builtVersion = [Diagnostics.FileVersionInfo]::GetVersionInfo((Join-Path $OutputDirectory 'HyruleSync.exe')).FileVersion
$actualVersion = ([version]$builtVersion).ToString(3)
if ($Version -and $Version -ne $actualVersion) { throw 'Package version does not match the built executable.' }
$Version = $actualVersion
$archiveName = "HyruleSync-v$version-windows.zip"
$archive = Join-Path $projectRoot "outputs/$archiveName"
New-Item -ItemType Directory -Force (Split-Path -Parent $archive) | Out-Null
$items = @('HyruleSync.exe', 'HyruleSync.Stop.exe', 'README.md', 'LEEME.es.md', 'THIRD_PARTY.md', 'THIRD_PARTY.es.md', 'LICENSE', 'licenses') | ForEach-Object { Join-Path $OutputDirectory $_ }
# Explicit allowlist: never package .data, .state, save files or local history.
Compress-Archive -LiteralPath $items -DestinationPath $archive -Force
$sha = [Security.Cryptography.SHA256]::Create()
$archiveStream = [IO.File]::OpenRead($archive)
try { $hash = [BitConverter]::ToString($sha.ComputeHash($archiveStream)).Replace('-', '').ToLowerInvariant() }
finally { $archiveStream.Dispose(); $sha.Dispose() }
Set-Content -LiteralPath ($archive + '.sha256') -Value "$hash  $archiveName" -Encoding ascii
# Keep only the current generated package after ZIP and checksum both succeed.
# Match files directly under outputs, leaving app folders and personal files alone.
Get-ChildItem -LiteralPath (Split-Path -Parent $archive) -File | Where-Object {
    $_.Name -cmatch '^HyruleSync-v[0-9]+\.[0-9]+\.[0-9]+-windows\.zip(?:\.sha256)?$' -and
    $_.Name -ne $archiveName -and $_.Name -ne ($archiveName + '.sha256')
} | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
Write-Host "Shareable package: $archive"
