with open(r"C:\Users\Lenovo\sm\frontend\src\App.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import ClubPendingLogin from '@/pages/ClubPendingLogin';",
    "import ClubPendingLogin from '@/pages/ClubPendingLogin';\nimport CollegeRegister from '@/pages/CollegeRegister';"
)

content = content.replace(
    '<Route path="/club-pending-review" element={<ClubPendingLogin />} />',
    '<Route path="/club-pending-review" element={<ClubPendingLogin />} />\n        <Route path="/college-register" element={<CollegeRegister />} />\n        <Route path="/college-pending" element={<ClubPending />} />'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\App.js", "w", encoding="utf-8") as f:
    f.write(content)
print("App Done!")