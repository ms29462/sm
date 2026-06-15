with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the broken JSX - remove the malformed closing
content = content.replace(
    "  );\n    </ApprovedGate>\n  );",
    "    </ApprovedGate>\n  );"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")