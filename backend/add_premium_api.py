with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  createCheckout: (pack_id) => axios.post(`${API}/stripe/create-checkout`, { pack_id }, { headers: getAuthHeaders() }),",
    """  createCheckout: (pack_id) => axios.post(`${API}/stripe/create-checkout`, { pack_id }, { headers: getAuthHeaders() }),
  createPremiumCheckout: () => axios.post(`${API}/stripe/create-premium-checkout`, {}, { headers: getAuthHeaders() }),"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\lib\api.js", "w", encoding="utf-8") as f:
    f.write(content)
print("API Done!")