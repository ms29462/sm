with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "highlight" in line.lower() or "case 2" in line or "case 3" in line or "case 4" in line:
        print(f"Line {i+1}: {repr(line)}")