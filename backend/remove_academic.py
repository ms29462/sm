with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find and remove the academic section
start_marker = "            {/* Academic & Eligibility Section */}"
end_marker = "            <div>\n              <Label htmlFor=\"playing_level\""

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + "            <div>\n              <Label htmlFor=\"playing_level\""  + content[end_idx + len(end_marker):]
    print("Removed academic section!")
else:
    print(f"Markers not found: start={start_idx}, end={end_idx}")

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "w", encoding="utf-8") as f:
    f.write(content)