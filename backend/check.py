with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the main component
for i, line in enumerate(lines):
    if "const KatoPage" in line or "const CollegeFit" in line:
        print(f"Line {i+1}: {repr(line)}")