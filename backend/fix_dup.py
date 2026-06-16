with open(r"C:\Users\Lenovo\sm\frontend\src\pages\AdminDashboard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

seen = set()
new_lines = []
for line in lines:
    if "import Admin" in line:
        if line.strip() not in seen:
            seen.add(line.strip())
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\AdminDashboard.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done! Removed", len(lines) - len(new_lines), "duplicate imports")