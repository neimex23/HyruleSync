param([string]$OutputDirectory = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectRoot 'outputs/HyruleSync' }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force $OutputDirectory | Out-Null
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw '.NET Framework 4.x on Windows is required to build.' }
$arguments = @('/nologo', '/target:winexe', '/main:Program', '/optimize+', '/utf8output', "/out:$OutputDirectory/HyruleSync.exe", "/win32icon:$projectRoot/assets/hyrulesync.ico", '/reference:System.Web.Extensions.dll', '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll')
$arguments += "/resource:$projectRoot/assets/resources.json,hyrulesync/resources.json"
$arguments += "/resource:$projectRoot/assets/credits.json,hyrulesync/credits.json"
$arguments += "/resource:$projectRoot/LICENSE,hyrulesync/legal/app.txt"
$arguments += "/resource:$projectRoot/licenses/Leaflet.txt,hyrulesync/legal/leaflet.txt"
$arguments += "/resource:$projectRoot/THIRD_PARTY.md,hyrulesync/legal/third-party.en.md"
$arguments += "/resource:$projectRoot/docs/THIRD_PARTY.es.md,hyrulesync/legal/third-party.es.md"
foreach ($file in Get-ChildItem -LiteralPath (Join-Path $projectRoot 'web') -Recurse -File) {
    $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
    $arguments += "/resource:$($file.FullName),hyrulesync/$relative"
}
$arguments += @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'src') -Filter '*.cs' -File | ForEach-Object { $_.FullName })
& $compiler $arguments
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
& $compiler /nologo /target:winexe /main:StopProcesses /optimize+ "/out:$OutputDirectory/HyruleSync.Stop.exe" "/win32icon:$projectRoot/assets/hyrulesync.ico" /reference:System.Windows.Forms.dll (Join-Path $projectRoot 'src/Locale.cs') (Join-Path $projectRoot 'src/AssemblyInfo.cs') (Join-Path $projectRoot 'tools/StopProcesses.cs')
if ($LASTEXITCODE -ne 0) { throw 'Failed to build the HyruleSync process stopper.' }
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/USAGE.md') -Destination (Join-Path $OutputDirectory 'README.md')
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/USAR.md') -Destination (Join-Path $OutputDirectory 'LEEME.es.md')
Copy-Item -LiteralPath (Join-Path $projectRoot 'THIRD_PARTY.md') -Destination $OutputDirectory
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/THIRD_PARTY.es.md') -Destination $OutputDirectory
Copy-Item -LiteralPath (Join-Path $projectRoot 'LICENSE') -Destination $OutputDirectory
Copy-Item -LiteralPath (Join-Path $projectRoot 'licenses') -Destination $OutputDirectory -Recurse -Force
Write-Host "Built: $OutputDirectory/HyruleSync.exe and HyruleSync.Stop.exe"
& (Join-Path $PSScriptRoot 'package.ps1') -OutputDirectory $OutputDirectory
