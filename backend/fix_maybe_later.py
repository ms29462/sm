with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "  if (!isPremium) return <div className=\"p-4 md:p-8 flex items-center justify-center min-h-[60vh]\"><PremiumUpgrade /></div>;",
    """  if (!isPremium) return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
      <PremiumUpgrade onClose={() => window.history.back()} />
    </div>
  );"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")