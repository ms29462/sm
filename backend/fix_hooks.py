with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the early returns - replace with conditional render
content = content.replace(
    """const CollegeFitPage = () => {
  const [isPremium, setIsPremium] = useState(null);

  useEffect(() => {
    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => setIsPremium(false));
  }, []);

  if (isPremium === null) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  if (!isPremium) return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <PremiumUpgrade compact={false} />
    </div>
  );

""",
    """const CollegeFitPage = () => {
  const [isPremium, setIsPremium] = useState(null);

  useEffect(() => {
    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => setIsPremium(false));
  }, []);

"""
)

# Find the main return statement and wrap content
# Add premium gate at the start of the return
content = content.replace(
    "export default CollegeFitPage;",
    """// Premium gate wrapper
const CollegeFitPageWrapper = () => {
  const [isPremium, setIsPremium] = useState(null);
  useEffect(() => {
    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => setIsPremium(false));
  }, []);
  if (isPremium === null) return <div className="p-8 text-primary font-heading">LOADING...</div>;
  if (!isPremium) return <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]"><PremiumUpgrade /></div>;
  return <CollegeFitPage />;
};

export default CollegeFitPageWrapper;"""
)

# Remove isPremium state from CollegeFitPage
content = content.replace(
    "  const [isPremium, setIsPremium] = useState(null);\n\n  useEffect(() => {\n    api.getMyPermissions().then(res => setIsPremium(res.data.status === \"premium\")).catch(() => setIsPremium(false));\n  }, []);\n\n",
    ""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")