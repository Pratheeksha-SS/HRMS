import os

path = r'c:\Internship Project\backend\hrms_backend\hrms\views.py'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Duplication starts at line 546 (index 545) and ends at line 589 (index 588)
# We want to remove lines from index 545 to 587 (inclusive)
# This keeps the second "# ================= LEAVE ================= #" at index 588
new_lines = lines[:545] + lines[588:]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Fixed {path}. Removed lines 546 to 588.")
