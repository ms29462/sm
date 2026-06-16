with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = [line for line in lines if "<ApprovedGate" not in line and "</ApprovedGate>" not in line]

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done! Removed", len(lines) - len(new_lines), "lines")