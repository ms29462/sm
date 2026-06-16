with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminClubApplications.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "api.getClubApplications()",
    "api.getAdminClubApplications()"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminClubApplications.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")