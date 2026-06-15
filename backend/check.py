with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()

print("ApprovedGate import:", "ApprovedGate" in content[:500])
print("Import line:", "PermissionGate" in content)