with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i in range(5):
    print(f"Line {i+1}: {repr(lines[i])}")