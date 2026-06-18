with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PremiumUpgrade.js", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find("/year")
print(repr(content[idx-100:idx+20]))