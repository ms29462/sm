with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerCredits.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "      {showPremium && <PremiumUpgrade onClose={() => setShowPremium(false)} />}\n  );\n};",
    "      {showPremium && <PremiumUpgrade onClose={() => setShowPremium(false)} />}\n    </div>\n  );\n};"
)

# Remove duplicate closing div
content = content.replace(
    "    </div>\n      {showPremium && <PremiumUpgrade onClose={() => setShowPremium(false)} />}\n    </div>\n  );",
    "      {showPremium && <PremiumUpgrade onClose={() => setShowPremium(false)} />}\n    </div>\n  );"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerCredits.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")