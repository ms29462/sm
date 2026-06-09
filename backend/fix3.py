with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Print lines 1875-1950 to find the full orphaned block
for i, line in enumerate(lines[1874:1950], start=1875):
    print(f"{i}: {repr(line)}")