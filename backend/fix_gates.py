# Fix ClubOpportunities
with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()

if "ApprovedGate" not in content:
    # Just remove the ApprovedGate wrapper entirely - it causes more problems than it solves
    content = content.replace(
        "<ApprovedGate message=\"Opportunity management is only available to approved organizations.\">\n    ",
        ""
    )
    content = content.replace(
        "\n    </ApprovedGate>",
        ""
    )

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "w", encoding="utf-8") as f:
    f.write(content)
print("ClubOpportunities Done!")

# Fix ClubPlayers
with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "r", encoding="utf-8") as f:
    content = f.read()

if "import { ApprovedGate }" not in content and "ApprovedGate" in content:
    content = content.replace(
        "<ApprovedGate message=\"Player search is only available to approved organizations.\">\n    ",
        ""
    )
    content = content.replace(
        "\n  </ApprovedGate>",
        ""
    )

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "w", encoding="utf-8") as f:
    f.write(content)
print("ClubPlayers Done!")