with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerCredits.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("4.99€", "$4.99")
content = content.replace("9.99€", "$9.99")
content = content.replace("24.99€", "$24.99")
content = content.replace("59.99€", "$59.99")

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerCredits.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")