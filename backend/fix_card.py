with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\OpportunityCard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if i == 107:  # After league_level line (0-indexed = 107)
        new_lines.append('          {opp.credit_cost && (\n')
        new_lines.append('            <div className="flex items-center justify-between">\n')
        new_lines.append('              <span className="text-muted-foreground">Application Cost:</span>\n')
        new_lines.append('              <span className="font-bold text-primary">⭐ {opp.credit_cost} credit{opp.credit_cost > 1 ? "s" : ""}</span>\n')
        new_lines.append('            </div>\n')
        new_lines.append('          )}\n')

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\OpportunityCard.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done!")