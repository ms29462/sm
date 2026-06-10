import json, os

# Check if railpack-plan.json exists
path = r"C:\Users\Lenovo\sm\backend\railpack-plan.json"
if os.path.exists(path):
    with open(path, "r") as f:
        plan = json.load(f)
    print(json.dumps(plan, indent=2)[:500])
else:
    print("File not found")