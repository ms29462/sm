import json

with open(r"C:\Users\Lenovo\sm\frontend\public\manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

# Remove screenshots - they don't exist and block PWA install
manifest.pop("screenshots", None)

with open(r"C:\Users\Lenovo\sm\frontend\public\manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
print("Done!")