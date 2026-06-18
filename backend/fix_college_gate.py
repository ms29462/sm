with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
content = content.replace(
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";\nimport { api } from "@/lib/api";\nimport PremiumUpgrade from "@/components/player/PremiumUpgrade";'
)

# Add premium check in component
content = content.replace(
    "const CollegeFitPage = () => {\n",
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

"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\KatoPage.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")