with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Remove duplicate lines 37-39 (0-indexed 36-38)
seen = set()
new_lines = []
for line in lines:
    stripped = line.strip()
    if "const [page, setPage]" in stripped or "const [hasMore, setHasMore]" in stripped:
        if stripped not in seen:
            seen.add(stripped)
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubPlayers.js", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Done! Removed", len(lines) - len(new_lines), "duplicate lines")