with open(r"C:\Users\Lenovo\sm\frontend\src\components\agent\AgentPlayers.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add useNavigate import
content = content.replace(
    "import { useState, useEffect } from 'react';",
    "import { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';"
)

# Add navigate hook
content = content.replace(
    "const AgentPlayers = () => {",
    "const AgentPlayers = () => {\n  const navigate = useNavigate();"
)

# Find the bottom of player card to add View Profile button
content = content.replace(
    "                </div>\n\n                <div className=\"space-y-2 text-sm text-muted-foreground mb-4\">",
    "                  <button onClick={() => navigate(`/agent/player/${player.user_id}`)} className=\"text-xs text-primary hover:underline\">View Profile</button>\n                </div>\n\n                <div className=\"space-y-2 text-sm text-muted-foreground mb-4\">"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\agent\AgentPlayers.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")