with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add admin version with different name
content = content.replace(
    "  updateClubApplication: (clubId, data) => axios.put(`${API}/admin/club-applications/${clubId}`, data, { headers: getAuthHeaders() }),",
    "  getAdminClubApplications: () => axios.get(`${API}/admin/club-applications`, { headers: getAuthHeaders() }),\n  updateClubApplication: (clubId, data) => axios.put(`${API}/admin/club-applications/${clubId}`, data, { headers: getAuthHeaders() }),"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")