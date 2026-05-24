with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '      <div className="flex items-center justify-between mb-8">',
    '      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")