with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find and remove ApprovedGate lines
new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if "<ApprovedGate" in line:
        skip_next = False
        continue
    if "</ApprovedGate>" in line:
        continue
    new_lines.append(line)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done! Removed", len(lines) - len(new_lines), "lines")