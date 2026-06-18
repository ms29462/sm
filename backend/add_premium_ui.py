# Add Premium section to PlayerCredits
with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerCredits.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add PremiumUpgrade import
content = content.replace(
    'import { Star, Check, Clock, ShoppingCart, History } from "lucide-react";',
    'import { Star, Check, Clock, ShoppingCart, History } from "lucide-react";\nimport PremiumUpgrade from "@/components/player/PremiumUpgrade";'
)

# Add premium state
content = content.replace(
    "  const [tab, setTab] = useState(\"overview\");",
    "  const [tab, setTab] = useState(\"overview\");\n  const [showPremium, setShowPremium] = useState(false);"
)

# Add Premium banner in overview tab
content = content.replace(
    "      {/* Earn Free Credits */}",
    """      {/* Premium Banner */}
      {tab === "overview" && !isPremium && (
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="font-bold text-primary flex items-center gap-2"><Star className="w-4 h-4 fill-primary" /> Player Premium</p>
            <p className="text-xs text-muted-foreground mt-1">Unlock unlimited messaging, College Fit, analytics + 20 credits/year</p>
          </div>
          <button onClick={() => setShowPremium(true)}
            className="flex-shrink-0 bg-primary text-black font-bold rounded-sm px-4 py-2 text-sm hover:bg-primary/90 transition-colors">
            Upgrade
          </button>
        </div>
      )}

      {/* Earn Free Credits */}"""
)

# Add isPremium from props/api
content = content.replace(
    "  const [claiming, setClaiming] = useState(null);",
    "  const [claiming, setClaiming] = useState(null);\n  const [isPremium, setIsPremium] = useState(false);"
)

content = content.replace(
    "    api.getMyCredits().then(res => {",
    """    api.getMyPermissions().then(res => setIsPremium(res.data.status === "premium")).catch(() => {});
    api.getMyCredits().then(res => {"""
)

# Add PremiumUpgrade modal
content = content.replace(
    "  );\n};\n\nexport default PlayerCredits;",
    """      {showPremium && <PremiumUpgrade onClose={() => setShowPremium(false)} />}
  );\n};\n\nexport default PlayerCredits;"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerCredits.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Credits Done!")

# Add Premium badge to player profile display
with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "r", encoding="utf-8") as f:
    content = f.read()

if "premium_player" not in content and "is_premium" not in content:
    content = content.replace(
        "{player.verified && (",
        """{player.is_premium && (
              <span className="px-2 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-sm flex items-center gap-1">
                ⭐ Premium Player
              </span>
            )}
            {player.verified && ("""
    )
    with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "w", encoding="utf-8") as f:
        f.write(content)
    print("Profile Badge Done!")
else:
    print("Profile badge already exists")