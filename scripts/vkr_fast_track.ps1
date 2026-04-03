$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$reportDir = Join-Path $root ".artifacts/vkr_ready/$timestamp"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$smokeStdout = Join-Path $reportDir "backend_smoke_stdout.log"
$smokeStderr = Join-Path $reportDir "backend_smoke_stderr.log"

function Write-Section($text) {
    Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Run-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "[RUN] $Name" -ForegroundColor Yellow
    try {
        $null = & $Action
        Write-Host "[OK ] $Name" -ForegroundColor Green
        return [PSCustomObject]@{ name = $Name; status = 'PASS'; details = '' }
    }
    catch {
        Write-Host "[ERR] $Name :: $($_.Exception.Message)" -ForegroundColor Red
        return [PSCustomObject]@{ name = $Name; status = 'FAIL'; details = $_.Exception.Message }
    }
}

$results = @()

Write-Section "Environment checks"
$results += Run-Step "Python installed" {
    $null = & python --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "python not found" }
}

$results += Run-Step "Node installed" {
    $null = & node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "node not found" }
}

$results += Run-Step "NPM installed" {
    $null = & npm --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "npm not found" }
}

Write-Section "Project structure checks"
$validatorsPath = Join-Path $root "backend/app/services/validators"
$validators = Get-ChildItem -Path $validatorsPath -File -Filter "*_validator.py" -ErrorAction Stop
$validatorCount = @($validators).Count

$tests = Get-ChildItem -Path (Join-Path $root "backend/tests") -Recurse -File -ErrorAction Stop |
    Where-Object { $_.Name -match '^test_.*\.py$|.*_test\.py$' }
$testCount = @($tests).Count

$pagesPath = Join-Path $root "frontend/src/pages"
$pages = Get-ChildItem -Path $pagesPath -File -ErrorAction Stop
$requiredPages = @('Upload', 'Report', 'Profiles', 'Preview', 'Pricing', 'Profile', 'Settings', 'Billing', 'APIKeys')
$pageStatus = foreach ($page in $requiredPages) {
    $present = $pages | Where-Object {
        $_.BaseName -eq $page -or
        $_.BaseName -eq "${page}Page" -or
        $_.BaseName -like "${page}*"
    }
    [PSCustomObject]@{
        page = $page
        present = [bool]$present
        files = (@($present | Select-Object -ExpandProperty Name) -join ', ')
    }
}

$composePath = Join-Path $root 'docker-compose.yml'
$composeText = Get-Content -Path $composePath -Raw
$requiredServices = @('backend', 'frontend', 'postgres', 'redis', 'prometheus', 'grafana')
$serviceStatus = foreach ($svc in $requiredServices) {
    $pattern = "(?m)^\s{2}${svc}:\s*$"
    [PSCustomObject]@{
        service = $svc
        present = [bool]([regex]::IsMatch($composeText, $pattern))
    }
}

$results += Run-Step "Validators >= 15" {
    if ($validatorCount -lt 15) { throw "validator count is $validatorCount" }
}

$results += Run-Step "Tests >= 30 files" {
    if ($testCount -lt 30) { throw "test file count is $testCount" }
}

$results += Run-Step "Critical services in docker-compose" {
    $missing = $serviceStatus | Where-Object { -not $_.present }
    if ($missing) { throw "missing services: $($missing.service -join ', ')" }
}

Write-Section "Backend test tooling checks"
$venvPath = Join-Path $root "backend/.venv"
$venvPython = Join-Path $venvPath "Scripts/python.exe"

$results += Run-Step "Create backend venv if needed" {
    if (-not (Test-Path $venvPython)) {
        & python -m venv $venvPath
        if ($LASTEXITCODE -ne 0) { throw "venv creation failed" }
    }
}

$results += Run-Step "Install backend requirements" {
    & $venvPython -m pip install --upgrade pip setuptools wheel
    if ($LASTEXITCODE -ne 0) { throw "pip bootstrap failed" }

    & $venvPython -m pip install -r (Join-Path $root "backend/requirements.txt")
    if ($LASTEXITCODE -ne 0) { throw "requirements install failed" }

    & $venvPython -m pip install pytest pytest-cov
    if ($LASTEXITCODE -ne 0) { throw "pytest install failed" }
}

$results += Run-Step "Backend smoke test" {
    Push-Location (Join-Path $root "backend")
    try {
        & $venvPython -m pytest tests/unit -q --maxfail=1 --disable-warnings 1> $smokeStdout 2> $smokeStderr

        if ($LASTEXITCODE -ne 0) {
            throw "pytest returned $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

Write-Section "Generate report"
$passCount = (@($results | Where-Object { $_.status -eq 'PASS' })).Count
$failCount = (@($results | Where-Object { $_.status -eq 'FAIL' })).Count
$pageMissing = $pageStatus | Where-Object { -not $_.present }

$overall = if ($failCount -eq 0 -and @($pageMissing).Count -eq 0) { 'VKR_READY_100' } else { 'VKR_READY_PARTIAL' }

$report = @()
$report += "# VKR Fast-Track Report"
$report += ""
$report += "- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$report += "- Overall status: $overall"
$report += "- Checks passed: $passCount"
$report += "- Checks failed: $failCount"
$report += ""
$report += "## Core Metrics"
$report += "- Validator files: $validatorCount"
$report += "- Test files: $testCount"
$report += ""
$report += "## Pages Status"
foreach ($p in $pageStatus) {
    $state = if ($p.present) { 'PASS' } else { 'MISSING' }
    $report += "- $($p.page): $state $($p.files)"
}
$report += ""
$report += "## Service Status"
foreach ($s in $serviceStatus) {
    $state = if ($s.present) { 'PASS' } else { 'MISSING' }
    $report += "- $($s.service): $state"
}
$report += ""
$report += "## Step Results"
foreach ($r in $results) {
    if ($r.status -eq 'PASS') {
        $report += "- PASS: $($r.name)"
    }
    else {
        $report += "- FAIL: $($r.name) :: $($r.details)"
    }
}
$report += ""
$report += "## Test Logs"
$report += "- Smoke stdout: $smokeStdout"
$report += "- Smoke stderr: $smokeStderr"

$reportPath = Join-Path $reportDir "VKR_FAST_TRACK_REPORT.md"
$report | Set-Content -Path $reportPath -Encoding UTF8

$jsonPath = Join-Path $reportDir "vkr_fast_track_report.json"
[PSCustomObject]@{
    generated = (Get-Date)
    overall = $overall
    validatorCount = $validatorCount
    testFileCount = $testCount
    pages = $pageStatus
    services = $serviceStatus
    steps = $results
} | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8

Write-Host "`nReport saved:" -ForegroundColor Cyan
Write-Host "- $reportPath"
Write-Host "- $jsonPath"

if ($overall -ne 'VKR_READY_100') {
    exit 2
}

