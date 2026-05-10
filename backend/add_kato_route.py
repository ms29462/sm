with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerDashboard.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import MatchScores from '@/components/player/MatchScores';",
    "import MatchScores from '@/components/player/MatchScores';\nimport KatoPage from '@/components/player/KatoPage';"
)

content = content.replace(
    "        <Route path=\"match-scores\" element={<MatchScores />} />",
    "        <Route path=\"kato\" element={<KatoPage />} />\n        <Route path=\"match-scores\" element={<MatchScores />} />"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\PlayerDashboard.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")