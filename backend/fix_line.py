with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Fix line 736 (index 735) - the player update_data line
for i, line in enumerate(lines):
    if i >= 732 and i <= 738 and "update_data = {k: v for k, v in update.model_dump().items() if v is not None}" in line:
        lines[i] = line.replace(
            "update_data = {k: v for k, v in update.model_dump().items() if v is not None}",
            "update_data = {k: v for k, v in update.model_dump().items() if v is not None or isinstance(v, bool)}"
        )
        print(f"Fixed line {i+1}")
        break

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done!")