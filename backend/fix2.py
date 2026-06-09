with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Print lines around 1877
for i, line in enumerate(lines[1870:1890], start=1871):
    print(f"{i}: {repr(line)}")