with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    content = f.read()

# Fix: move all hooks before the early return
old = """const CollegeFitPage = () => {
  const [isPremium, setIsPremium] = useState(null);

  useEffect(() => {
    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => setIsPremium(false));
  }, []);

  if (isPremium === null) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  const [division, setDivision] = useState("");
  const [form, setForm] = useState({
    country: "", age: "", playing_level: "",
    has_bac: "", bac_year: "", gpa: "", sat_score: "",
    english_level: "", has_postsecondary: "",
    semesters_enrolled: "", seasons_used: "",
    signed_pro: "", received_payment: "",
    annual_budget: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);"""

new = """const CollegeFitPage = () => {
  const [isPremium, setIsPremium] = useState(null);
  const [division, setDivision] = useState("");
  const [form, setForm] = useState({
    country: "", age: "", playing_level: "",
    has_bac: "", bac_year: "", gpa: "", sat_score: "",
    english_level: "", has_postsecondary: "",
    semesters_enrolled: "", seasons_used: "",
    signed_pro: "", received_payment: "",
    annual_budget: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => setIsPremium(false));
  }, []);

  if (isPremium === null) return <div className="p-8 text-primary font-heading">LOADING...</div>;
  if (!isPremium) return <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]"><PremiumUpgrade /></div>;"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")