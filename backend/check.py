with open(r"C:\Users\Lenovo\sm\frontend\src\pages\Login.js", "r", encoding="utf-8") as f:
    content = f.read()
import re
matches = re.findall(r'.{20}[Rr]egister.{30}', content)
for m in matches:
    print(repr(m))