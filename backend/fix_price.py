with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PremiumUpgrade.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<span className="text-4xl font-heading font-bold">—</span>',
    '<span className="text-4xl font-heading font-bold text-primary">$49.99</span>'
)
content = content.replace(
    '<span className="text-3xl font-bold text-primary">$</span>',
    ''
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PremiumUpgrade.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")