$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSCommandPath
Write-Host ''
Write-Host '=== CURSA quick start ===' -ForegroundColor Cyan

function Get-PythonInfo {
    $python = Get-Command python -ErrorAction SilentlyContinue
    $args = @()
    if (-not $python) {
        $python = Get-Command py -ErrorAction SilentlyContinue
        if ($python) {
            $args = @('-3')
        }
    }
    if (-not $python) {
        Write-Host 'Python 3 is required. Install it from https://www.python.org/downloads/' -ForegroundColor Red
        exit 1
    }
    return @{ Path = $python.Path; Args = $args }
}

function Ensure-Node {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host 'Node.js is required. Install it from https://nodejs.org/' -ForegroundColor Red
        exit 1
    }
}

function Ensure-GeminiKey {
    param(
        [string]$EnvPath
    )

    $existingKey = $null
    if (Test-Path $EnvPath) {
        foreach ($line in Get-Content -Path $EnvPath) {
            if ($line -match '^[ \t]*GEMINI_API_KEY[ \t]*=') {
                $existingKey = ($line -split '=', 2)[1].Trim()
                break
            }
        }
    }

    if ($existingKey) {
        Write-Host 'Gemini AI key detected. Продолжаем с включенным ИИ.' -ForegroundColor DarkGreen
        return
    }

    Write-Host ''
    Write-Host '⚡ Поддержка ИИ (Gemini 2.5 Flash)' -ForegroundColor Cyan
    Write-Host '   Помогает дополнять разделы, формировать выводы и проверять текст.'
    $choice = Read-Host 'Хотите подключить ИИ прямо сейчас? (Y/N)'

    if ($choice -notmatch '^(?i)(y|yes|д|да)$') {
        Write-Host 'ИИ отключен. Добавить ключ можно позже: откройте .env и установите GEMINI_API_KEY=...' -ForegroundColor DarkYellow
        return
    }

    Write-Host ''
    Write-Host 'Инструкция по получению ключа:' -ForegroundColor Yellow
    Write-Host '  1. Авторизуйтесь в Google аккаунте.'
    Write-Host '  2. Перейдите на страницу AI Studio.'
    Write-Host '  3. Создайте проект (если потребуется) и сгенерируйте API ключ Gemini.'
    Write-Host '  4. Скопируйте ключ — он выглядит примерно как AIxxxxxxxxxxxx.'

    $openPortal = Read-Host 'Открыть страницу https://aistudio.google.com/app/apikey сейчас? (Y/N)'
    if ($openPortal -match '^(?i)(y|yes|д|да)$') {
        Start-Process 'https://aistudio.google.com/app/apikey'
    }

    do {
        $enteredKey = Read-Host 'Вставьте сюда ваш Gemini API ключ'
        $enteredKey = $enteredKey.Trim()
        if (-not $enteredKey) {
            Write-Host 'Ключ не должен быть пустым. Попробуйте ещё раз.' -ForegroundColor Red
        }
    } while (-not $enteredKey)

    if (-not (Test-Path $EnvPath)) {
        New-Item -Path $EnvPath -ItemType File -Force | Out-Null
    }

    $rawContent = Get-Content -Path $EnvPath -Raw -ErrorAction SilentlyContinue
    if ($rawContent -and -not $rawContent.EndsWith("`n")) {
        Add-Content -Path $EnvPath -Value '' -Encoding UTF8
    }

    Add-Content -Path $EnvPath -Value "GEMINI_API_KEY=$enteredKey" -Encoding UTF8
    Write-Host 'Ключ сохранён в .env и будет доступен бэкенду при следующем запуске.' -ForegroundColor Green
}

$pythonInfo = Get-PythonInfo
Ensure-Node
$envPath = Join-Path $root '.env'
Ensure-GeminiKey -EnvPath $envPath

$venvPath = Join-Path $root '.venv'
$venvPython = Join-Path $venvPath 'Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
    Write-Host 'Creating virtual environment...' -ForegroundColor Yellow
    & $pythonInfo.Path @($pythonInfo.Args + @('-m','venv',$venvPath))
}

Write-Host 'Installing backend dependencies...' -ForegroundColor Yellow
& $venvPython -m pip install --upgrade pip --disable-pip-version-check 2>&1 | Out-Null
& $venvPython -m pip install --disable-pip-version-check -r (Join-Path $root 'backend\requirements.txt') 2>&1 | Out-Null

Write-Host 'Installing frontend dependencies...' -ForegroundColor Yellow
Push-Location (Join-Path $root 'frontend')
npm install --no-audit --no-fund 2>&1 | Out-Null
Pop-Location

$backendDir = Join-Path $root 'backend'
$frontendDir = Join-Path $root 'frontend'

Write-Host 'Launching backend and frontend...' -ForegroundColor Yellow

$backendProcess = Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$backendDir'; `$env:PYTHONIOENCODING='utf-8'; & '$venvPython' run.py" -PassThru
$frontendProcess = Start-Process powershell -ArgumentList '-NoExit','-Command',"Set-Location '$frontendDir'; npm start" -PassThru

Start-Sleep -Seconds 8
Start-Process 'http://localhost:3000/'

Write-Host ''
Write-Host 'Frontend:  http://localhost:3000' -ForegroundColor Green
Write-Host 'Backend:   http://localhost:5000' -ForegroundColor Green
Write-Host ''
Write-Host 'Close the two PowerShell windows to stop the services.' -ForegroundColor Yellow
Write-Host 'Keep this window open if you want to stop them from here.'
Write-Host ''

try {
    Wait-Process -Id $backendProcess.Id,$frontendProcess.Id
} finally {
    if ($backendProcess -and -not $backendProcess.HasExited) {
        $backendProcess | Stop-Process -Force
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        $frontendProcess | Stop-Process -Force
    }
}
