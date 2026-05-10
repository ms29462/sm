with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "r", encoding="utf-8") as f:
    content = f.read()

old = '''  <p className="text-xs text-muted-foreground mt-1">Control who can see your profile</p>
</div>
            <div>
              <Label htmlFor="playing_level"'''

new = '''  <p className="text-xs text-muted-foreground mt-1">Control who can see your profile</p>
</div>

            {/* Academic & Eligibility Section */}
            <div className="col-span-2 border-t border-border pt-6 mt-2">
              <h3 className="text-lg font-heading font-bold uppercase mb-4 text-primary">Academic & Eligibility</h3>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Baccalauréat / A-Level</Label>
              <select
                value={formData.has_baccalaureate === true ? "yes" : formData.has_baccalaureate === false ? "no" : ""}
                onChange={(e) => handleChange("has_baccalaureate", e.target.value === "yes" ? true : e.target.value === "no" ? false : null)}
                className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                <option value="yes">Yes - obtained or in progress</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Bac Year</Label>
              <Input
                type="number"
                value={formData.bac_year || ""}
                onChange={(e) => handleChange("bac_year", parseInt(e.target.value))}
                placeholder="e.g. 2023"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Bac Grade / Average</Label>
              <Input
                type="text"
                value={formData.bac_grade || ""}
                onChange={(e) => handleChange("bac_grade", e.target.value)}
                placeholder="e.g. 14/20 or B+"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">English Level (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.english_level || ""}
                onChange={(e) => handleChange("english_level", parseInt(e.target.value))}
                placeholder="1 = basic, 10 = fluent"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Post-Secondary Studies</Label>
              <select
                value={formData.has_postsecondary === true ? "yes" : formData.has_postsecondary === false ? "no" : ""}
                onChange={(e) => handleChange("has_postsecondary", e.target.value === "yes" ? true : e.target.value === "no" ? false : null)}
                className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                <option value="yes">Yes (Cégep, University, BTS, etc.)</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Post-Secondary Start Date</Label>
              <Input
                type="month"
                value={formData.postsecondary_start_date || ""}
                onChange={(e) => handleChange("postsecondary_start_date", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Annual Budget (USD)</Label>
              <Input
                type="text"
                value={formData.annual_budget || ""}
                onChange={(e) => handleChange("annual_budget", e.target.value)}
                placeholder="e.g. $5,000 - $15,000"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
              <p className="text-xs text-muted-foreground mt-1">Amount you can contribute annually to tuition and personal expenses</p>
            </div>

            <div>
              <Label htmlFor="playing_level"'''

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\player\PlayerProfile.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")