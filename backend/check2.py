with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()
print("credit_cost in PlayerOpportunities:", "credit_cost" in content)
# Find how opportunities are displayed
import re
matches = re.findall(r'.{0,50}opp\..{0,50}', content)
for m in matches[:8]:
    print(repr(m))