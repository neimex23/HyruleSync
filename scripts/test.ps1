$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$testDirectory = Join-Path $projectRoot '.local/tests'
New-Item -ItemType Directory -Force $testDirectory | Out-Null
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$sources = @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'src') -Filter '*.cs' -File | ForEach-Object { $_.FullName })
$sources += Join-Path $projectRoot 'tests/ReaderTests.cs'
$sources += Join-Path $projectRoot 'tests/SaveSyncTests.cs'
$testResources = @("/resource:$projectRoot/assets/shrines.json,hyrulesync/shrines.json")
$testResources += @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'web/public') -Filter '*.json' -File | ForEach-Object { "/resource:$($_.FullName),hyrulesync/web/$($_.Name)" })
& $compiler /nologo /target:exe /main:ReaderTests "/out:$testDirectory/ReaderTests.exe" /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll $testResources $sources
if ($LASTEXITCODE -ne 0) { throw 'Test compilation failed.' }
& (Join-Path $testDirectory 'ReaderTests.exe')
if ($LASTEXITCODE -ne 0) { throw 'Save reader tests failed.' }
& (Join-Path $projectRoot 'tests/build.ps1')
