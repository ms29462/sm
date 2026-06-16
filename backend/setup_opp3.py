with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add status badge to opportunity cards
content = content.replace(
    '{opp.position}',
    '''{opp.position}
                  {opp.status && opp.status !== "published" && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ml-2 ${
                      opp.status === "pending_review" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
                      opp.status === "changes_requested" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" :
                      opp.status === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                      "text-gray-400 bg-gray-500/10 border-gray-500/20"
                    }`}>{opp.status.replace("_", " ")}</span>
                  )}''',
    1
)

# Add pending review message
content = content.replace(
    '{opp.league_level}',
    '''{opp.league_level}
                  {opp.status === "pending_review" && (
                    <p className="text-xs text-yellow-400 mt-1">⏳ Under review by Soccer Match</p>
                  )}
                  {opp.status === "changes_requested" && opp.public_feedback && (
                    <p className="text-xs text-orange-400 mt-1">📝 {opp.public_feedback}</p>
                  )}''',
    1
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\ClubOpportunities.js", "w", encoding="utf-8") as f:
    f.write(content)
print("ClubOpportunities Done!")