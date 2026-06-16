with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the duplicate admin one
content = content.replace(
    "  getClubApplications: () => axios.get(`${API}/admin/club-applications`, { headers: getAuthHeaders() }),\n",
    ""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")