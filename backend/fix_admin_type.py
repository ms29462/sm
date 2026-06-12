with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminClubApplications.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "              <p className=\"text-xs text-muted-foreground\">{app.country} — {app.league}</p>\n              <p className=\"text-xs text-muted-foreground\">{app.playing_level} • {app.created_at?.slice(0,10)}</p>",
    """              <p className="text-xs text-muted-foreground">{app.country} — {app.league || app.competition_level}</p>
              <div className="flex items-center gap-2">
                {app.institution_type && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-sm">{app.institution_type}</span>}
                <p className="text-xs text-muted-foreground">{app.playing_level || app.competition_level} • {app.created_at?.slice(0,10)}</p>
              </div>"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminClubApplications.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Frontend Done!")