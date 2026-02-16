# Cleanup locked folders on E: drive
# DateApp (locked by process + nul file)
Get-ChildItem 'E:\DateApp' -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer -and $_.Name -ne 'nul' } |
    Remove-Item -Force -ErrorAction SilentlyContinue

Get-ChildItem 'E:\DateApp' -Directory -Recurse -Force -ErrorAction SilentlyContinue |
    Sort-Object { $_.FullName.Length } -Descending |
    Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

# Enigma (launchpad-os locked)
Get-ChildItem 'E:\Enigma' -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer -and $_.Name -ne 'nul' } |
    Remove-Item -Force -ErrorAction SilentlyContinue

Get-ChildItem 'E:\Enigma' -Directory -Recurse -Force -ErrorAction SilentlyContinue |
    Sort-Object { $_.FullName.Length } -Descending |
    Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

# Try removing the parent folders
Remove-Item 'E:\DateApp' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'E:\Enigma' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item 'E:\.claude' -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup done. Remaining:"
Get-ChildItem E:\ -Force | Select-Object Name, LastWriteTime
