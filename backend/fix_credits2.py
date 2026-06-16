with open(r"C:\Users\Lenovo\sm\frontend\src\pages\OpportunityDetail.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find line with "APPLY NOW" and insert credit cost before it
new_lines = []
for i, line in enumerate(lines):
    if "APPLY NOW" in line:
        # Insert credit cost display before the apply button
        new_lines.append("            {opportunity.credit_cost && (\n")
        new_lines.append("              <div className=\"p-3 bg-primary/5 border border-primary/20 rounded-sm mb-3 flex items-center justify-between\">\n")
        new_lines.append("                <div>\n")
        new_lines.append("                  <p className=\"text-xs font-bold text-primary uppercase tracking-widest\">Application Cost</p>\n")
        new_lines.append("                  <p className=\"text-xs text-muted-foreground mt-0.5\">Credits deducted on apply</p>\n")
        new_lines.append("                </div>\n")
        new_lines.append("                <p className=\"text-2xl font-heading font-bold text-primary\">{opportunity.credit_cost} cr.</p>\n")
        new_lines.append("              </div>\n")
        new_lines.append("            )}\n")
    new_lines.append(line)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\OpportunityDetail.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done!")