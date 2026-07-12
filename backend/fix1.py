with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "getOpportunities: (page = 1) => axios.get(`${API}/opportunities?page=${page}&limit=12`",
    "getOpportunities: (page = 1) => axios.get(`${API}/opportunities?page=${page}&limit=5`"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")