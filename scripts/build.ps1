param([string]$OutputDirectory = '', [string]$Version = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectRoot 'outputs/HyruleSync' }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
if (-not $Version) { $Version = (Get-Content -LiteralPath (Join-Path $projectRoot 'assets/credits.json') -Raw | ConvertFrom-Json).version }
$Version = $Version -creplace '^v', ''
if ($Version -cnotmatch '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$') { throw 'Use a stable version/tag such as v0.4.0 (X.Y.Z).' }
$parsedVersion = [version]$Version
if ($parsedVersion.Major -gt 65534 -or $parsedVersion.Minor -gt 65534 -or $parsedVersion.Build -gt 65534) { throw 'Each version component must be at most 65534.' }
New-Item -ItemType Directory -Force $OutputDirectory | Out-Null
$buildDirectory = Join-Path $OutputDirectory '.build'
New-Item -ItemType Directory -Force $buildDirectory | Out-Null
$assemblySource = Join-Path $buildDirectory 'AssemblyInfo.cs'
$assemblyText = Get-Content -LiteralPath (Join-Path $projectRoot 'src/AssemblyInfo.cs') -Raw
$assemblyText = $assemblyText -replace '(Assembly(?:File)?Version\(")[^"]+("\))', ('${1}' + $Version + '.0${2}')
Set-Content -LiteralPath $assemblySource -Value $assemblyText -Encoding UTF8
$credits = Get-Content -LiteralPath (Join-Path $projectRoot 'assets/credits.json') -Raw | ConvertFrom-Json
$credits.version = $Version
$creditsPath = Join-Path $buildDirectory 'credits.json'
$credits | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $creditsPath -Encoding UTF8
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw '.NET Framework 4.x on Windows is required to build.' }
$arguments = @('/nologo', '/target:winexe', '/main:Program', '/optimize+', '/utf8output', "/out:$OutputDirectory/HyruleSync.exe", "/win32icon:$projectRoot/assets/hyrulesync.ico", '/reference:System.Web.Extensions.dll', '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll')
$arguments += "/resource:$projectRoot/assets/resources.json,hyrulesync/resources.json"
$arguments += "/resource:$projectRoot/assets/towers.json,hyrulesync/towers.json"
$arguments += "/resource:$projectRoot/licenses/SavegameEditors.txt,hyrulesync/legal/savegame-editors.txt"
$arguments += "/resource:$creditsPath,hyrulesync/credits.json"
$arguments += "/resource:$projectRoot/LICENSE,hyrulesync/legal/app.txt"
$arguments += "/resource:$projectRoot/licenses/Leaflet.txt,hyrulesync/legal/leaflet.txt"
$arguments += "/resource:$projectRoot/THIRD_PARTY.md,hyrulesync/legal/third-party.en.md"
$arguments += "/resource:$projectRoot/docs/THIRD_PARTY.es.md,hyrulesync/legal/third-party.es.md"
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $projectRoot 'web') -Recurse -File) {
    $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
    $arguments += "/resource:$($file.FullName),hyrulesync/$relative"
}
$arguments += @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'src') -Filter '*.cs' -File | Where-Object { $_.Name -ne 'AssemblyInfo.cs' } | ForEach-Object { $_.FullName })
$arguments += $assemblySource
& $compiler $arguments
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
& $compiler /nologo /target:winexe /main:StopProcesses /optimize+ "/out:$OutputDirectory/HyruleSync.Stop.exe" "/win32icon:$projectRoot/assets/hyrulesync.ico" /reference:System.Windows.Forms.dll (Join-Path $projectRoot 'src/Locale.cs') $assemblySource (Join-Path $projectRoot 'tools/StopProcesses.cs')
if ($LASTEXITCODE -ne 0) { throw 'Failed to build the HyruleSync process stopper.' }
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/USAGE.md') -Destination (Join-Path $OutputDirectory 'README.md')
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/USAR.md') -Destination (Join-Path $OutputDirectory 'LEEME.es.md')
Copy-Item -LiteralPath (Join-Path $projectRoot 'THIRD_PARTY.md') -Destination $OutputDirectory
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/THIRD_PARTY.es.md') -Destination $OutputDirectory
Copy-Item -LiteralPath (Join-Path $projectRoot 'LICENSE') -Destination $OutputDirectory
Copy-Item -LiteralPath (Join-Path $projectRoot 'licenses') -Destination $OutputDirectory -Recurse -Force
Write-Host "Built: $OutputDirectory/HyruleSync.exe and HyruleSync.Stop.exe"
& (Join-Path $PSScriptRoot 'package.ps1') -OutputDirectory $OutputDirectory -Version $Version
