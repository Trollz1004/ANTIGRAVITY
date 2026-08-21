@echo off
REM Sync canonical 9020 skills to every agent platform. Run after any skill change.
REM Canon: C:\node-workloads\9020\marketing-node\skills  (payments + revenue-model deliberately EXCLUDED)
set SRC=C:\node-workloads\9020\marketing-node\skills
for %%T in ("%USERPROFILE%\.claude\skills" "%USERPROFILE%\.agents\skills" "%USERPROFILE%\.config\opencode\skills" "%USERPROFILE%\.openclaw\workspace\skills") do (
  if not exist %%T mkdir %%T
  for /d %%S in ("%SRC%\*") do robocopy "%%S" "%%T\%%~nxS" /MIR /NFL /NDL /NJH /NJS /NP >nul
  echo synced to %%T
)
echo done
