with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminSubscriptions.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add players state
content = content.replace(
    "  const [subscriptions, setSubscriptions] = useState([]);",
    "  const [subscriptions, setSubscriptions] = useState([]);\n  const [players, setPlayers] = useState([]);\n  const [playerSearch, setPlayerSearch] = useState(\"\");"
)

# Load players
content = content.replace(
    "      const [subRes, playersRes, clubsRes] = await Promise.all([",
    "      const [subRes, playersRes, clubsRes] = await Promise.all(["
)

# Replace user_id input with player search
content = content.replace(
    """              <div>
                <p className="text-xs text-muted-foreground mb-1">User ID *</p>
                <input value={form.user_id} onChange={e => setForm(f => ({...f, user_id: e.target.value}))}
                  placeholder="Paste user_id here..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary" />
              </div>""",
    """              <div>
                <p className="text-xs text-muted-foreground mb-1">Search Player *</p>
                <input value={playerSearch} onChange={e => setPlayerSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary mb-2" />
                {playerSearch && (
                  <div className="max-h-32 overflow-y-auto border border-white/10 rounded-sm">
                    {players.filter(p => 
                      p.name?.toLowerCase().includes(playerSearch.toLowerCase()) ||
                      p.email?.toLowerCase().includes(playerSearch.toLowerCase())
                    ).slice(0, 5).map(p => (
                      <button key={p.user_id} onClick={() => { setForm(f => ({...f, user_id: p.user_id})); setPlayerSearch(p.name + " — " + p.email); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors border-b border-white/5">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {form.user_id && <p className="text-xs text-primary mt-1">✓ Player selected</p>}
              </div>"""
)

# Load players in loadData
content = content.replace(
    "      const [subRes, playersRes, clubsRes] = await Promise.all([\n        api.getAllSubscriptions(),\n        api.getAllPlayers(),\n        api.getAllClubs(),\n      ]);\n      setSubscriptions(subRes.data);\n      setUsers([\n        ...(playersRes.data || []).map(p => ({ ...p, role: \"player\" })),\n        ...(clubsRes.data || []).map(c => ({ ...c, role: \"club\" })),\n      ]);",
    "      const [subRes, playersRes, clubsRes] = await Promise.all([\n        api.getAllSubscriptions(),\n        api.getAllPlayers(),\n        api.getAllClubs(),\n      ]);\n      setSubscriptions(subRes.data);\n      setPlayers(playersRes.data || []);\n      setUsers([\n        ...(playersRes.data || []).map(p => ({ ...p, role: \"player\" })),\n        ...(clubsRes.data || []).map(c => ({ ...c, role: \"club\" })),\n      ]);"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\admin\AdminSubscriptions.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")