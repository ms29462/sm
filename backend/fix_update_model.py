with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

old = """    transfermarkt_url: Optional[str] = None


# ============ MATCH ARCHIVE MODELS ============"""

new = """    transfermarkt_url: Optional[str] = None
    has_baccalaureate: Optional[bool] = None
    bac_year: Optional[int] = None
    bac_grade: Optional[str] = None
    english_level: Optional[int] = None
    has_postsecondary: Optional[bool] = None
    postsecondary_start_date: Optional[str] = None
    annual_budget: Optional[str] = None


# ============ MATCH ARCHIVE MODELS ============"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")