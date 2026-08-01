with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find("hasMore")
while idx >= 0:
    snippet = content[idx:idx+100]
    if "button" in snippet.lower() or "Button" in snippet:
        print(repr(content[idx-50:idx+200]))
        print("===")
        break
    idx = content.find("hasMore", idx+1)