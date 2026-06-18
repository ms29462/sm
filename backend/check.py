with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i in range(205, 235):
    print(f"Line {i+1}: {repr(lines[i])}")