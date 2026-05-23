with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\PlayerDetailView.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the line with flex flex-col gap-3
for i, line in enumerate(lines):
    if 'flex flex-col gap-3' in line:
        print(f"Line {i+1}: {repr(line)}")
        print(f"Next: {repr(lines[i+1])}")
        print(f"Next+1: {repr(lines[i+2])}")
        break