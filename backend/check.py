with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()
import re
matches = re.findall(r"getClub\w+.*", content)
for m in matches[:5]:
    print(m)