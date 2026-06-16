import os, glob

# Fix OpportunityDetail page - show credit cost
with open(r"C:\Users\Lenovo\sm\frontend\src\pages\OpportunityDetail.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add credit cost display before apply button
content = content.replace(
    '{/* Apply Button */}',
    '''{/* Credit Cost */}
            {opportunity.credit_cost && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm mb-4">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Application Cost</p>
                <p className="text-2xl font-heading font-bold text-primary">{opportunity.credit_cost} credit{opportunity.credit_cost > 1 ? "s" : ""}</p>
                <p className="text-xs text-muted-foreground mt-1">Credits will be deducted when you apply</p>
              </div>
            )}
            {/* Apply Button */}'''
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\OpportunityDetail.js", "w", encoding="utf-8") as f:
    f.write(content)
print("OpportunityDetail Done!")

# Fix player opportunities list - show credit cost on cards
files_to_check = [
    r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerOpportunities.js",
    r"C:\Users\Lenovo\sm\frontend\src\pages\OpportunityDetail.js",
]

for f in files_to_check:
    if not os.path.exists(f): continue
    with open(f, encoding="utf-8") as fh:
        content = fh.read()
    print(f"{f.split(chr(92))[-1]}: credit_cost mentioned:", "credit_cost" in content)