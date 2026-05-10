with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "r", encoding="utf-8") as f:
    content = f.read()

old = """      const response = await api.getPlayerProfile();
      setProfile(response.data);
      setFormData(response.data);"""

new = """      const response = await api.getPlayerProfile();
      setProfile(response.data);
      setFormData({
        ...response.data,
        has_baccalaureate: response.data.has_baccalaureate ?? null,
        bac_year: response.data.bac_year ?? "",
        bac_grade: response.data.bac_grade ?? "",
        english_level: response.data.english_level ?? "",
        has_postsecondary: response.data.has_postsecondary ?? null,
        postsecondary_start_date: response.data.postsecondary_start_date ?? "",
        annual_budget: response.data.annual_budget ?? "",
      });"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")