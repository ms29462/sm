with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

old = """class PlayerUpdate(BaseModel):
    name: Optional[str] = None"""

new = """class PlayerUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")