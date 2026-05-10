with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerLayout.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add Trophy import if not there
if "GraduationCap" not in content:
    content = content.replace(
        "import {",
        "import { GraduationCap,",
        1
    )

# Add Kato link after match-scores
old = '          <Link to="/player/match-scores">'
new = '''          <Link to="/player/kato">
            <Button
              data-testid="nav-kato-btn"
              variant={isActive("/player/kato") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <GraduationCap className="w-4 h-4 mr-3" />
              Kato
            </Button>
          </Link>
          <Link to="/player/match-scores">'''

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerLayout.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")