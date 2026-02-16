@echo off
echo ================================================
echo SSH KEY FIX - Run this ONCE to never type passwords again
echo ================================================
echo.
echo This will copy 9020's SSH key to Sabretooth and T5500.
echo You'll type your password ONE LAST TIME for each node.
echo.
echo Step 1: Copying key to SABRETOOTH (192.168.0.8)...
ssh-copy-id -i C:\Users\joshl\.ssh\id_ed25519.pub joshl@192.168.0.8
echo.
echo Step 2: Copying key to T5500 (192.168.0.15)...
ssh-copy-id -i C:\Users\joshl\.ssh\id_ed25519.pub aicol@192.168.0.15
echo.
echo ================================================
echo DONE! Testing connections...
echo ================================================
echo.
echo Testing Sabretooth...
ssh joshl@192.168.0.8 "echo SABRETOOTH: OK"
echo.
echo Testing T5500...
ssh aicol@192.168.0.15 "echo T5500: OK"
echo.
echo If you see "OK" for both, SSH is fixed forever!
pause
