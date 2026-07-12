with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\RecruitmentPipeline.js", "r", encoding="utf-8") as f:
    content = f.read()

# Change from 2 rows of 5 to rows of 4-3-3
content = content.replace(
    "[STAGES.slice(0, 5), STAGES.slice(5, 10)].map((row, rowIdx) => (",
    "[STAGES.slice(0, 4), STAGES.slice(4, 7), STAGES.slice(7, 10)].map((row, rowIdx) => ("
)

content = content.replace(
    'const stageNum = rowIdx * 5 + colIdx + 1;',
    'const stageNum = [0,4,7][rowIdx] + colIdx + 1;'
)

content = content.replace(
    '<div key={rowIdx} className="grid grid-cols-5 gap-3">',
    '<div key={rowIdx} className={`grid gap-3 ${rowIdx === 0 ? "grid-cols-4" : "grid-cols-3"}`}>'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\RecruitmentPipeline.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")