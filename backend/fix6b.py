with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  getTrialInvitations:",
    "  deleteTrialInvitation: (id) => axios.delete(`${API}/trial-invitations/${id}`, { headers: getAuthHeaders() }),\n  getTrialInvitations:"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")