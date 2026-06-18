with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the early return for premium check from inside CollegeFitPage
content = content.replace(
    '  if (!isPremium) return (\n    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">\n      <PremiumUpgrade compact={false} />\n    </div>\n  );\n\n  const [division',
    '  const [division'
)

# Remove isPremium state and useEffect from CollegeFitPage
content = content.replace(
    '  const [isPremium, setIsPremium] = useState(null);\n\n  useEffect(() => {\n    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => setIsPremium(false));\n  }, []);\n\n  const [division',
    '  const [division'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")