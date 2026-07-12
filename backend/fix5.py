with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\RecruitmentPipeline.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add search state
content = content.replace(
    "  const [showAddPlayer, setShowAddPlayer] = useState(false);",
    "  const [showAddPlayer, setShowAddPlayer] = useState(false);\n  const [playerSearchQuery, setPlayerSearchQuery] = useState('');\n  const [playerSearchResults, setPlayerSearchResults] = useState([]);\n  const [searchingPlayers, setSearchingPlayers] = useState(false);"
)

# Add search handler
content = content.replace(
    "  const handleAddPlayer = async (playerId, opportunityId) => {",
    """  const handleSearchPlayers = async () => {
    if (!playerSearchQuery.trim()) return;
    setSearchingPlayers(true);
    try {
      const res = await api.getPlayers({ name: playerSearchQuery, limit: 10 });
      setPlayerSearchResults(res.data || []);
    } catch (e) { toast.error("Search failed"); }
    finally { setSearchingPlayers(false); }
  };

  const handleAddPlayer = async (playerId, opportunityId) => {"""
)

# Add search UI before the tracked players section
content = content.replace(
    '            <div>\n              <label className={labelClass}>Select from Tracked Players</label>',
    '''            <div>
              <label className={labelClass}>Search Player by Name</label>
              <div className="flex gap-2 mt-1">
                <input value={playerSearchQuery} onChange={e => setPlayerSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearchPlayers()}
                  placeholder="Type player name..."
                  className={inputClass} />
                <Button onClick={handleSearchPlayers} disabled={searchingPlayers} size="sm" className="bg-primary text-black font-bold">
                  {searchingPlayers ? "..." : "Search"}
                </Button>
              </div>
              {playerSearchResults.length > 0 && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {playerSearchResults.filter(p => !pipeline.find(pp => pp.player_id === p.user_id)).map(player => (
                    <div key={player.user_id} onClick={() => { handleAddPlayer(player.user_id, null); setPlayerSearchResults([]); setPlayerSearchQuery(""); }}
                      className="flex items-center gap-3 p-3 bg-background border border-border/50 rounded-sm hover:border-primary cursor-pointer transition-colors">
                      <div>
                        <p className="font-bold text-sm">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.position} · {player.nationality}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Or Select from Tracked Players</label>'''
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\RecruitmentPipeline.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")