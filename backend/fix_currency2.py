with open(r"C:\Users\Lenovo\sm\backend\credits.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"currency": "EUR"', '"currency": "USD"')
content = content.replace("4.99", "4.99")
content = content.replace("9.99", "9.99")

with open(r"C:\Users\Lenovo\sm\backend\credits.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")