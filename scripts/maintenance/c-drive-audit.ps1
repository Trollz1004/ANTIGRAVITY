# Audit C: drive for cleanup — skip system folders
$skip = @('Windows', 'Program Files', 'Program Files (x86)', 'ProgramData', 'Recovery', 'PerfLogs', '$Recycle.Bin', 'System Volume Information', 'Config.Msi', 'Documents and Settings', 'MSOCache', '$WinREAgent', '$SysReset', 'Intel', 'AMD')

Write-Host "=== C:\ ROOT FOLDERS ==="
Get-ChildItem C:\ -Directory -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notin $skip } |
    ForEach-Object {
        $s = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Write-Host ('{0,8:N0} MB - {1}' -f ($s/1MB), $_.Name)
    }

Write-Host "`n=== C:\Users\joshl KEY FOLDERS ==="
$userSkip = @('.', '..', 'ntuser.dat.LOG1', 'ntuser.dat.LOG2')
Get-ChildItem 'C:\Users\joshl' -Directory -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notin @('AppData', 'ntuser.dat') } |
    ForEach-Object {
        $s = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Write-Host ('{0,8:N0} MB - {1}' -f ($s/1MB), $_.Name)
    }

Write-Host "`n=== LOOSE FILES ON C:\ ==="
Get-ChildItem C:\ -File -Force -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host ('{0,8:N0} KB - {1}' -f ($_.Length/1KB), $_.Name)
    }
