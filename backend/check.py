with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerRegister.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
# Find highlight_video input line and nearby step info
for i, line in enumerate(lines):
    if "highlight_video" in line and "input" in line.lower():
        print(f"Line {i+1}: {repr(line)}")
        # Print surrounding context
        for j in range(max(0,i-20), i):
            if "step" in lines[j].lower() or "case" in lines[j].lower() or "Step" in lines[j]:
                print(f"  Context Line {j+1}: {repr(lines[j])}")