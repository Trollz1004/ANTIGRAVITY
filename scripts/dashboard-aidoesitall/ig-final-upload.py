"""
Final upload: click Select from computer, handle the file dialog properly.
Uses Alt+N to focus the filename field in Windows Open dialog.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import pyautogui, time, ctypes, pyperclip
from ctypes import wintypes
from PIL import ImageGrab

user32 = ctypes.windll.user32
pyautogui.FAILSAFE = False

FILE_PATH = r"C:\Antigravity\assets\marketing\onlinerecycle_impact_shriners.png"

EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

def get_fg_title():
    fg = user32.GetForegroundWindow()
    length = user32.GetWindowTextLengthW(fg)
    buff = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(fg, buff, length + 1)
    return buff.value

def find_dialog_by_class():
    """Find #32770 dialog windows."""
    results = []
    def callback(hwnd, lParam):
        if user32.IsWindowVisible(hwnd):
            cls = ctypes.create_unicode_buffer(256)
            user32.GetClassNameW(hwnd, cls, 256)
            if cls.value == '#32770':
                length = user32.GetWindowTextLengthW(hwnd)
                tb = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, tb, length + 1)
                results.append((hwnd, tb.value))
        return True
    user32.EnumWindows(EnumWindowsProc(callback), 0)
    return results

# Step 1: Make sure Chrome/Instagram is foreground
title = get_fg_title()
print(f"Current foreground: {title[:50]}")

if 'Instagram' not in title and 'Chrome' not in title:
    print("Switching to Chrome...")
    pyautogui.hotkey('alt', 'tab')
    time.sleep(1)
    title = get_fg_title()
    print(f"Now: {title[:50]}")

# Step 2: Get Chrome window rect
chrome_hwnd = user32.GetForegroundWindow()
rect = wintypes.RECT()
user32.GetWindowRect(chrome_hwnd, ctypes.byref(rect))
print(f"Chrome rect: ({rect.left},{rect.top})-({rect.right},{rect.bottom})")

# Step 3: Calculate "Select from computer" button position
# MCP viewport was 952x923, button at approximately (340, 549)
# Chrome window has ~40px for tab bar at top
win_w = rect.right - rect.left
win_h = rect.bottom - rect.top
chrome_bar = 75  # title bar + tab bar + address bar

# Content area
content_w = win_w
content_h = win_h - chrome_bar

# Scale from MCP viewport (952x923) to content area
btn_x = rect.left + int(content_w * 340 / 952)
btn_y = rect.top + chrome_bar + int(content_h * 549 / 923)

print(f"Window size: {win_w}x{win_h}, content: {content_w}x{content_h}")
print(f"Button screen coords: ({btn_x}, {btn_y})")

# Step 4: Click the button
print(f"Clicking 'Select from computer'...")
pyautogui.click(btn_x, btn_y)
time.sleep(2)

# Step 5: Check for dialog
title2 = get_fg_title()
print(f"After click, foreground: {title2[:50]}")

# Look for any dialog
for i in range(20):
    dialogs = find_dialog_by_class()
    for hwnd, dtitle in dialogs:
        if dtitle:  # Any titled dialog
            print(f"  Dialog found: '{dtitle}'")
            if 'Open' in dtitle or dtitle == 'Open':
                user32.SetForegroundWindow(hwnd)
                time.sleep(0.5)

                # Use Alt+N to focus the File Name field
                print("Focusing filename field with Alt+N...")
                pyautogui.hotkey('alt', 'n')
                time.sleep(0.3)

                # Clear and paste path
                pyperclip.copy(FILE_PATH)
                pyautogui.hotkey('ctrl', 'a')
                time.sleep(0.1)
                pyautogui.hotkey('ctrl', 'v')
                time.sleep(0.5)

                # Press Enter
                print(f"Submitting: {FILE_PATH}")
                pyautogui.press('enter')
                time.sleep(2)

                final = get_fg_title()
                print(f"After submit: {final[:50]}")

                # Save debug screenshot
                ss = ImageGrab.grab(all_screens=True)
                ss.save(r"C:\Antigravity\data\after-upload.png")
                print("Done! Screenshot saved.")
                exit(0)
    time.sleep(0.5)

print("No file dialog found")
ss = ImageGrab.grab(all_screens=True)
ss.save(r"C:\Antigravity\data\no-dialog-debug.png")
