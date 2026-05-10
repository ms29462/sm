with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

old = '    visibility: Optional[Literal["public", "agents_only", "clubs_only", "private"]] = None\n    games: Optional[int] = None'

new = '    visibility: Optional[Literal["public", "agents_only", "clubs_only", "private"]] = None\n    has_baccalaureate: Optional[bool] = None\n    bac_year: Optional[int] = None\n    bac_grade: Optional[str] = None\n    english_level: Optional[int] = None\n    has_postsecondary: Optional[bool] = None\n    postsecondary_start_date: Optional[str] = None\n    annual_budget: Optional[str] = None\n    games: Optional[int] = None'

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done PlayerUpdate!")