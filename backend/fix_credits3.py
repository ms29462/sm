with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerOpportunities.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find league_level display and add credit cost after it
new_lines = []
for line in lines:
    new_lines.append(line)
    if "opp.league_level" in line and "text-xs" in line:
        new_lines.append("                {opp.credit_cost && (\n")
        new_lines.append("                  <span className=\"text-xs font-bold text-primary\">⭐ {opp.credit_cost} credit{opp.credit_cost > 1 ? 's' : ''}</span>\n")
        new_lines.append("                )}\n")

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerOpportunities.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done!")