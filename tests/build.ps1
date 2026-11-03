$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$fixture = Join-Path $projectRoot ('.local/tests/build-' + [guid]::NewGuid().ToString('N'))
foreach ($directory in @('scripts', 'src', 'tools', 'assets', 'licenses', 'docs', 'outputs/HyruleSync/.data/cache', 'outputs/HyruleSync/.state', 'outputs/HyruleSync/personal')) {
    New-Item -ItemType Directory -Path (Join-Path $fixture $directory) -Force | Out-Null
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'scripts/build.ps1'), (Join-Path $projectRoot 'scripts/package.ps1') -Destination (Join-Path $fixture 'scripts')
Copy-Item -LiteralPath (Join-Path $projectRoot 'assets/hyrulesync.ico') -Destination (Join-Path $fixture 'assets')
foreach ($name in @('assets/resources.json', 'assets/towers.json', 'assets/shrines.json', 'assets/credits.json')) {
    Set-Content -LiteralPath (Join-Path $fixture $name) -Value '{}' -Encoding UTF8
}
foreach ($name in @('LICENSE', 'THIRD_PARTY.md', 'docs/THIRD_PARTY.es.md', 'docs/USAGE.md', 'docs/USAR.md', 'licenses/Leaflet.txt', 'licenses/React.txt', 'licenses/SavegameEditors.txt')) {
    Set-Content -LiteralPath (Join-Path $fixture $name) -Value "Fixture: $name" -Encoding UTF8
}
Set-Content -LiteralPath (Join-Path $fixture 'src/Locale.cs') -Value 'public static class Locale {}'
$stopperSource = 'public static class StopProcesses { public static void Main() {} }'
Set-Content -LiteralPath (Join-Path $fixture 'tools/StopProcesses.cs') -Value $stopperSource

# Only the web dependency install/bundle is a fixture. Exercise the real Windows
# compiler, installation, ZIP creation and checksums without network access.
function npm.cmd {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    switch ($Arguments -join ' ') {
        'ci' {}
        'run build' {
            New-Item -ItemType Directory -Path '.local/build/web' -Force | Out-Null
            Set-Content -LiteralPath '.local/build/web/index.html' -Value '<html>Build fixture</html>'
        }
        default { throw "Unexpected npm command: $Arguments" }
    }
    $global:LASTEXITCODE = 0
}
function Assert($Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}
function Set-FixtureVersion([string]$Version, [string]$Revision) {
    Set-Content -LiteralPath (Join-Path $fixture 'src/AssemblyInfo.cs') -Value "using System.Reflection;`n[assembly: AssemblyVersion(`"$Version.0`")]"
    Set-Content -LiteralPath (Join-Path $fixture 'src/Program.cs') -Value "public static class Program { public const string Revision = `"$Revision`"; public static void Main() {} }"
}
$output = Join-Path $fixture 'outputs/HyruleSync'
$privateFiles = @('.data/cache/map.bin', '.state/settings.json', 'my-save.bin', 'personal/note.txt')
$privateHashes = @{}
foreach ($name in $privateFiles) {
    $path = Join-Path $output $name
    [IO.File]::WriteAllBytes($path, [byte[]](0, 128, 255, 13, 10))
    $privateHashes[$name] = (Get-FileHash -LiteralPath $path).Hash
}
$unrelatedPackages = @('personal.zip', 'HyruleSync-v99.0.0-windows.zip.notes.txt')
foreach ($name in $unrelatedPackages) {
    Set-Content -LiteralPath (Join-Path $fixture "outputs/$name") -Value 'Keep this personal file.'
}
function Assert-Installed([string]$Version, [string]$Directory = $output) {
    foreach ($name in @('HyruleSync.exe', 'HyruleSync.Stop.exe')) {
        Assert ([Diagnostics.FileVersionInfo]::GetVersionInfo((Join-Path $Directory $name)).FileVersion -eq "$Version.0") "Wrong installed version: $name"
    }
    foreach ($name in $privateFiles) {
        Assert ((Get-FileHash -LiteralPath (Join-Path $output $name)).Hash -eq $privateHashes[$name]) "Personal data changed: $name"
    }
    foreach ($name in $unrelatedPackages) {
        Assert ((Get-Content -LiteralPath (Join-Path $fixture "outputs/$name") -Raw).Trim() -eq 'Keep this personal file.') "Unrelated output changed: $name"
    }
    $archiveName = "HyruleSync-v$Version-windows.zip"
    $packages = @(Get-ChildItem -LiteralPath (Join-Path $fixture 'outputs') -File | Where-Object { $_.Name -match '\.zip(?:\.sha256)?$' -and $_.Name -ne 'personal.zip' })
    Assert ($packages.Count -eq 2) 'Old generated packages or checksums remain.'
    $archivePath = Join-Path $fixture "outputs/$archiveName"
    $expectedChecksum = (Get-FileHash -LiteralPath $archivePath).Hash.ToLowerInvariant() + "  $archiveName"
    Assert ((Get-Content -LiteralPath ($archivePath + '.sha256') -Raw).Trim() -eq $expectedChecksum) 'Package checksum mismatch.'
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        $entries = @($zip.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
        Assert ($entries -contains 'HyruleSync.exe' -and $entries -contains 'HyruleSync.Stop.exe') 'Executables missing from ZIP.'
        Assert (@($entries | Where-Object { $_ -match '(^|/)(\.data|\.state|\.build|personal)(/|$)|my-save\.bin' }).Count -eq 0) 'Personal or intermediate files included in ZIP.'
    } finally { $zip.Dispose() }
}
$build = Join-Path $fixture 'scripts/build.ps1'
Set-FixtureVersion '1.0.0' 'initial'
& $build
Assert-Installed '1.0.0'

Set-FixtureVersion '2.0.0' 'upgrade'
& $build
Assert-Installed '2.0.0'
$previousHash = (Get-FileHash -LiteralPath (Join-Path $output 'HyruleSync.exe')).Hash
Set-Content -LiteralPath (Join-Path $output 'README.md') -Value 'Outdated guide'
Set-FixtureVersion '2.0.0' 'same version, new code'
& $build
Assert-Installed '2.0.0'
Assert ((Get-FileHash -LiteralPath (Join-Path $output 'HyruleSync.exe')).Hash -ne $previousHash) 'Same-version build did not replace the executable.'
Assert ((Get-Content -LiteralPath (Join-Path $output 'README.md') -Raw).Trim() -eq 'Fixture: docs/USAGE.md') 'Guide was not refreshed.'

Set-FixtureVersion '1.0.0' 'downgrade'
& $build
Assert-Installed '1.0.0'
$installedHashes = @{}
foreach ($name in @('HyruleSync.exe', 'HyruleSync.Stop.exe')) {
    $installedHashes[$name] = (Get-FileHash -LiteralPath (Join-Path $output $name)).Hash
}
# Failure in the second compilation must leave both installed EXEs unchanged.
Set-FixtureVersion '3.0.0' 'failed build'
Set-Content -LiteralPath (Join-Path $fixture 'tools/StopProcesses.cs') -Value 'invalid C# source'
$failed = $false
try { & $build } catch { $failed = $true }
Assert $failed 'Invalid source unexpectedly compiled.'
Assert-Installed '1.0.0'
foreach ($name in $installedHashes.Keys) {
    Assert ((Get-FileHash -LiteralPath (Join-Path $output $name)).Hash -eq $installedHashes[$name]) "Failed build replaced $name"
}

Set-Content -LiteralPath (Join-Path $fixture 'tools/StopProcesses.cs') -Value $stopperSource
$lock = [IO.File]::Open((Join-Path $output 'HyruleSync.Stop.exe'), [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
$failed = $false
try { & $build } catch { $failed = $true } finally { $lock.Dispose() }
Assert $failed 'Build unexpectedly replaced a locked executable.'
Assert-Installed '1.0.0'
foreach ($name in $installedHashes.Keys) {
    Assert ((Get-FileHash -LiteralPath (Join-Path $output $name)).Hash -eq $installedHashes[$name]) "Locked installation partially replaced $name"
}

$customOutput = Join-Path $fixture 'personal app'
& $build -OutputDirectory $customOutput
Assert-Installed '3.0.0' $customOutput
Write-Host 'Build replacement, version changes, personal data, package cleanup, failed compilation, locked files and custom output checks passed.'
