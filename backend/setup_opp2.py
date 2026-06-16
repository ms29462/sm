# Add API methods
with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  getAllSubscriptions: () => axios.get(`${API}/admin/subscriptions`, { headers: getAuthHeaders() }),",
    """  getAllSubscriptions: () => axios.get(`${API}/admin/subscriptions`, { headers: getAuthHeaders() }),
  getAdminOpportunities: () => axios.get(`${API}/admin/opportunities`, { headers: getAuthHeaders() }),
  updateAdminOpportunity: (id, data) => axios.put(`${API}/admin/opportunities/${id}`, data, { headers: getAuthHeaders() }),
  approveOpportunity: (id, data) => axios.post(`${API}/admin/opportunities/${id}/approve`, data, { headers: getAuthHeaders() }),
  rejectOpportunity: (id, data) => axios.post(`${API}/admin/opportunities/${id}/reject`, data, { headers: getAuthHeaders() }),
  requestOpportunityChanges: (id, data) => axios.post(`${API}/admin/opportunities/${id}/request-changes`, data, { headers: getAuthHeaders() }),"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "w", encoding="utf-8") as f:
    f.write(content)
print("API Done!")

# Add to AdminDashboard
with open(r"C:\Users\Lenovo\sm\frontend\src\pages\AdminDashboard.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import AdminSubscriptions from '@/components/admin/AdminSubscriptions';",
    "import AdminSubscriptions from '@/components/admin/AdminSubscriptions';\nimport AdminOpportunities from '@/components/admin/AdminOpportunities';"
)
content = content.replace(
    '<Route path="subscriptions" element={<AdminSubscriptions />} />',
    '<Route path="subscriptions" element={<AdminSubscriptions />} />\n        <Route path="opportunities" element={<AdminOpportunities />} />'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\AdminDashboard.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Dashboard Done!")

# Add to AdminLayout nav
with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminLayout.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<Link to="/admin/subscriptions">',
    '''<Link to="/admin/opportunities">
            <Button variant={isActive('/admin/opportunities') ? 'secondary' : 'ghost'} className="w-full justify-start">
              Opportunities
            </Button>
          </Link>
          <Link to="/admin/subscriptions">'''
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminLayout.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Layout Done!")