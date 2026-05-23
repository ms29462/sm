with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\PlayerDetailView.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

track_button = [
    '              <Button\n',
    '                onClick={handleTrackPlayer}\n',
    '                variant="outline"\n',
    '                className={`rounded-sm h-12 px-6 font-bold uppercase tracking-wide ${isTracked ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" : "border-white/20 text-white hover:bg-white/10"}`}\n',
    '              >\n',
    '                <Target className="w-4 h-4 mr-2" />\n',
    '                {isTracked ? "Tracked \u2713" : "Track Player"}\n',
    '              </Button>\n',
]

# Insert after line 140 (index 140)
lines = lines[:141] + track_button + lines[141:]

with open(r"C:\Users\Lenovo\sm\frontend\src\components\club\PlayerDetailView.js", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done!")