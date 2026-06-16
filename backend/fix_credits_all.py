# Fix OpportunityCard - main card shown to players
with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\OpportunityCard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if ("league_level" in line or "playing_level" in line) and "text-xs" in line and "opp" in line.lower():
        new_lines.append("        {opportunity.credit_cost && (\n")
        new_lines.append("          <div className=\"flex items-center gap-1 mt-1\">\n")
        new_lines.append("            <span className=\"text-xs font-bold text-primary\">⭐ {opportunity.credit_cost} credit{opportunity.credit_cost > 1 ? 's' : ''} to apply</span>\n")
        new_lines.append("          </div>\n")
        new_lines.append("        )}\n")

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\OpportunityCard.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("OpportunityCard Done!")

# Fix PlayerApplications
with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerApplications.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "{app.league_level}",
    """{app.league_level}
                {app.credit_cost && (
                  <span className="text-xs font-bold text-primary ml-2">⭐ {app.credit_cost} cr.</span>
                )}"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerApplications.js", "w", encoding="utf-8") as f:
    f.write(content)
print("PlayerApplications Done!")

# Fix PlayerHome - opportunity recommendations
with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerHome.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "{opp.league_level}",
    """{opp.league_level}
                  {opp.credit_cost && (
                    <span className="text-xs font-bold text-primary">⭐ {opp.credit_cost} cr.</span>
                  )}"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerHome.js", "w", encoding="utf-8") as f:
    f.write(content)
print("PlayerHome Done!")

# Fix ClubApplications - show credit cost on applications
with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubApplications.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "{app.position}",
    """{app.position}
              {app.credit_cost && (
                <span className="text-xs font-bold text-primary ml-1">⭐ {app.credit_cost} cr.</span>
              )}"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubApplications.js", "w", encoding="utf-8") as f:
    f.write(content)
print("ClubApplications Done!")

# Fix ClubOpportunities - show credit cost on org opportunity cards
with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "{opp.league_level}",
    """{opp.league_level}
                {opp.credit_cost && (
                  <span className="text-xs font-bold text-primary">⭐ {opp.credit_cost} credit{opp.credit_cost > 1 ? "s" : ""}</span>
                )}"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "w", encoding="utf-8") as f:
    f.write(content)
print("ClubOpportunities Done!")