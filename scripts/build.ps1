param([string]$OutputDirectory = '', [string]$Version = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$assemblySource = Join-Path $projectRoot 'src/AssemblyInfo.cs'
$assemblyText = Get-Content -LiteralPath $assemblySource -Raw
$versionAttributes = [regex]::Matches($assemblyText, '(?m)^\s*\[assembly\s*:\s*AssemblyVersion\s*\(\s*"([^"]+)"\s*\)\s*\]')
if ($versionAttributes.Count -ne 1) { throw 'Define exactly one AssemblyVersion in src/AssemblyInfo.cs.' }
$assemblyVersion = $versionAttributes[0].Groups[1].Value
if ($assemblyVersion -cnotmatch '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.0$') { throw 'Use a stable AssemblyVersion such as 0.6.0.0 (X.Y.Z.0) in src/AssemblyInfo.cs.' }
$parsedVersion = $null
if (-not [version]::TryParse($assemblyVersion, [ref]$parsedVersion) -or $parsedVersion.Major -gt 65534 -or $parsedVersion.Minor -gt 65534 -or $parsedVersion.Build -gt 65534) { throw 'Each version component must be at most 65534.' }
$sourceVersion = $parsedVersion.ToString(3)
# -Version validates a release tag; it never overrides the source version.
if ($Version -and ($Version -creplace '^v', '') -cne $sourceVersion) { throw "Version/tag '$Version' does not match AssemblyVersion '$assemblyVersion' in src/AssemblyInfo.cs. Expected v$sourceVersion." }
$Version = $sourceVersion
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Node.js 22.12+ and npm are required to build the React interface.' }
Push-Location $projectRoot
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Could not install the locked web dependencies.' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'React web build failed.' }
} finally { Pop-Location }
$webDirectory = Join-Path $projectRoot '.local/build/web'
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectRoot 'outputs/HyruleSync' }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
# Compile both executables before replacing the personal installation.
$buildDirectory = Join-Path $projectRoot '.local/build/app'
New-Item -ItemType Directory -Force $buildDirectory | Out-Null
$credits = Get-Content -LiteralPath (Join-Path $projectRoot 'assets/credits.json') -Raw | ConvertFrom-Json
$credits | Add-Member -MemberType NoteProperty -Name version -Value $Version -Force
$creditsPath = Join-Path $buildDirectory 'credits.json'
$credits | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $creditsPath -Encoding UTF8
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw '.NET Framework 4.x on Windows is required to build.' }
$arguments = @('/nologo', '/target:winexe', '/main:Program', '/optimize+', '/utf8output', "/out:$buildDirectory/HyruleSync.exe", "/win32icon:$projectRoot/assets/hyrulesync.ico", '/reference:System.Web.Extensions.dll', '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll')
$arguments += "/resource:$projectRoot/assets/resources.json,hyrulesync/resources.json"
$arguments += "/resource:$projectRoot/assets/towers.json,hyrulesync/towers.json"
$arguments += "/resource:$projectRoot/licenses/SavegameEditors.txt,hyrulesync/legal/savegame-editors.txt"
$arguments += "/resource:$creditsPath,hyrulesync/credits.json"
$arguments += "/resource:$projectRoot/LICENSE,hyrulesync/legal/app.txt"
$arguments += "/resource:$projectRoot/licenses/Leaflet.txt,hyrulesync/legal/leaflet.txt"
$arguments += "/resource:$projectRoot/licenses/React.txt,hyrulesync/legal/react.txt"
$arguments += "/resource:$projectRoot/THIRD_PARTY.md,hyrulesync/legal/third-party.en.md"
$arguments += "/resource:$projectRoot/docs/THIRD_PARTY.es.md,hyrulesync/legal/third-party.es.md"
foreach ($file in Get-ChildItem -LiteralPath $webDirectory -Recurse -File) {
    $relative = $file.FullName.Substring($webDirectory.Length + 1).Replace('\', '/')
    $arguments += "/resource:$($file.FullName),hyrulesync/web/$relative"
}
$arguments += @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'src') -Filter '*.cs' -File | ForEach-Object { $_.FullName })
& $compiler $arguments
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
& $compiler /nologo /target:winexe /main:StopProcesses /optimize+ "/out:$buildDirectory/HyruleSync.Stop.exe" "/win32icon:$projectRoot/assets/hyrulesync.ico" /reference:System.Windows.Forms.dll (Join-Path $projectRoot 'src/Locale.cs') $assemblySource (Join-Path $projectRoot 'tools/StopProcesses.cs')
if ($LASTEXITCODE -ne 0) { throw 'Failed to build the HyruleSync process stopper.' }
# Only replace app files, even for a rebuild of the same version. Never clean the
# output folder: .data, .state, saves and other personal files must stay intact.
New-Item -ItemType Directory -Force $OutputDirectory | Out-Null
foreach ($name in @('HyruleSync.exe', 'HyruleSync.Stop.exe')) {
    $destination = Join-Path $OutputDirectory $name
    if (Test-Path -LiteralPath $destination) {
        try {
            $stream = [IO.File]::Open($destination, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
            $stream.Dispose()
        } catch { throw "Cannot replace '$destination'. Close HyruleSync and HyruleSync.Stop running from this folder before rebuilding. $($_.Exception.Message)" }
    }
}
foreach ($name in @('HyruleSync.exe', 'HyruleSync.Stop.exe')) {
    Copy-Item -LiteralPath (Join-Path $buildDirectory $name) -Destination $OutputDirectory -Force
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/USAGE.md') -Destination (Join-Path $OutputDirectory 'README.md') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/USAR.md') -Destination (Join-Path $OutputDirectory 'LEEME.es.md') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'THIRD_PARTY.md') -Destination $OutputDirectory -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/THIRD_PARTY.es.md') -Destination $OutputDirectory -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'LICENSE') -Destination $OutputDirectory -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'licenses') -Destination $OutputDirectory -Recurse -Force
Write-Host "Built: $OutputDirectory/HyruleSync.exe and HyruleSync.Stop.exe"
& (Join-Path $PSScriptRoot 'package.ps1') -OutputDirectory $OutputDirectory -Version $Version
# The bundle is embedded in the executable and no longer needed after packaging.
$expectedWebDirectory = [IO.Path]::GetFullPath((Join-Path $projectRoot '.local/build/web'))
$resolvedWebDirectory = (Get-Item -LiteralPath $webDirectory).FullName
if ($resolvedWebDirectory -ne $expectedWebDirectory -or ((Get-Item -LiteralPath $webDirectory).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'Refusing to remove an unexpected intermediate web directory.'
}
Remove-Item -LiteralPath $resolvedWebDirectory -Recurse -Force
Write-Host 'Removed intermediate web files.'
