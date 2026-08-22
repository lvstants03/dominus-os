# Stop all Dominus OS processes and release ports 8082, 3000 cleanly

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "                DOMINUS OS - STOP ALL PROCESSES (CLEAN)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Tim va dong tat ca tien trinh dang chiem cong 8082 va 3000
$ports = @(8082, 3000)
foreach ($port in $ports) {
    Write-Host "[*] Dang kiem tra cong $port..." -ForegroundColor Yellow
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -gt 0) {
                try {
                    Write-Host "[!] Dang tat cay tien trinh (PID: $procId) dang chiem cong $port..." -ForegroundColor Red
                    & taskkill.exe /F /T /PID $procId >$null 2>&1
                    Write-Host "[v] Da tat thanh cong PID: $procId" -ForegroundColor Green
                } catch {
                    Write-Host "[!] Khong the tat PID $($procId)" -ForegroundColor DarkRed
                }
            }
        }
    } else {
        Write-Host "[v] Cong $port dang hoan toan trong." -ForegroundColor Green
    }
}

# 1.1 Tat cac tien trinh python chay main.py
$pyProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*python*" -and ($_.CommandLine -like "*main.py*" -or $_.CommandLine -like "*multiprocessing*") }
if ($pyProcs) {
    foreach ($pp in $pyProcs) {
        & taskkill.exe /F /T /PID $pp.ProcessId >$null 2>&1
    }
}

# 2. Tat cac tien trinh app.exe va dominus-desktop.exe
Write-Host "[*] Dang tat ung dung Desktop Tauri (app.exe)..." -ForegroundColor Yellow
$tauriProcs = Get-Process -Name "app", "dominus-desktop" -ErrorAction SilentlyContinue
if ($tauriProcs) {
    foreach ($tp in $tauriProcs) {
        Write-Host "[!] Dang tat Tauri PID: $($tp.Id)..." -ForegroundColor Red
        Stop-Process -Id $tp.Id -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "[v] Khong co ung dung Tauri nao dang chay." -ForegroundColor Green
}

# 3. Don dep tien trinh Node/Next.js con ton dong
Write-Host "[*] Don dep tien trinh Node/Next.js con ton dong..." -ForegroundColor Yellow
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    foreach ($np in $nodeProcs) {
        try {
            $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($np.Id)").CommandLine
            if ($cmd -match "next|dominus") {
                Write-Host "[!] Tat tien trinh Next.js PID: $($np.Id)..." -ForegroundColor Red
                Stop-Process -Id $np.Id -Force -ErrorAction SilentlyContinue
            }
        } catch {}
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "[v] DA GIAI PHONG TOAN BO CONG VA TAT HET CAC TIEN TRINH CHAY NGAM!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
