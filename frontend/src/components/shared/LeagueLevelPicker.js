import { useState, useEffect } from "react";

const LEAGUE_STRUCTURE = {
  "National Team": ["Senior", "U23", "U21", "U20", "U19", "U18", "U17", "U16", "U15", "Other"],
  "Professional": ["1st Tier", "2nd Tier", "3rd Tier", "4th Tier", "5th Tier", "6th Tier", "7th Tier", "8th Tier", "Other"],
  "Semi-Professional": ["1st Tier", "2nd Tier", "3rd Tier", "4th Tier", "5th Tier", "6th Tier", "7th Tier", "8th Tier", "Other"],
  "Amateur": ["1st Tier", "2nd Tier", "3rd Tier", "4th Tier", "5th Tier", "6th Tier", "7th Tier", "8th Tier", "Other"],
  "College / University": ["NCAA Division I", "NCAA Division II", "NCAA Division III", "NAIA", "NJCAA", "U SPORTS", "CCAA", "BUCS Premier", "BUCS Championship", "EUSA", "Other"],
};

const LEVELS = Object.keys(LEAGUE_STRUCTURE);

const LeagueLevelPicker = ({ value, onChange, country = "" }) => {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [customTier, setCustomTier] = useState("");

  useEffect(() => {
    if (value && value.includes(" / ")) {
      const parts = value.split(" / ");
      if (parts.length >= 2) {
        setSelectedLevel(parts[0]);
        const tier = parts[1] || "";
        const knownTiers = LEAGUE_STRUCTURE[parts[0]] || [];
        if (knownTiers.includes(tier)) {
          setSelectedTier(tier);
        } else if (tier) {
          setSelectedTier("Other");
          setCustomTier(tier);
        }
      }
    }
  }, []);

  const buildValue = (level, tier, custom) => {
    const finalTier = tier === "Other" ? custom : tier;
    if (level && finalTier) onChange(`${level} / ${finalTier}`);
    else if (level) onChange(level);
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setSelectedTier("");
    setCustomTier("");
    onChange(level);
  };

  const handleTierChange = (tier) => {
    setSelectedTier(tier);
    if (tier !== "Other") {
      buildValue(selectedLevel, tier, "");
    }
  };

  const handleCustomTierChange = (val) => {
    setCustomTier(val);
    buildValue(selectedLevel, "Other", val);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Level</p>
        <div className="grid grid-cols-2 gap-2">
          {LEVELS.map(level => (
            <button key={level} type="button"
              onClick={() => handleLevelChange(level)}
              className={`text-left px-3 py-2 text-sm rounded-sm border-2 transition-all ${
                selectedLevel === level
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/30"
              }`}>
              {level}
            </button>
          ))}
        </div>
      </div>

      {selectedLevel && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Tier</p>
          <div className="grid grid-cols-3 gap-2">
            {LEAGUE_STRUCTURE[selectedLevel].map(tier => (
              <button key={tier} type="button"
                onClick={() => handleTierChange(tier)}
                className={`text-left px-3 py-2 text-sm rounded-sm border-2 transition-all ${
                  selectedTier === tier
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/30"
                }`}>
                {tier}
              </button>
            ))}
          </div>

          {selectedTier === "Other" && (
            <input
              type="text"
              value={customTier}
              onChange={e => handleCustomTierChange(e.target.value)}
              placeholder="Specify your league/tier..."
              className="mt-2 w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary"
            />
          )}
        </div>
      )}

      {selectedLevel && (selectedTier && selectedTier !== "Other" || (selectedTier === "Other" && customTier)) && (
        <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-sm px-3 py-2">
          Selected: <span className="text-primary font-bold">
            {selectedLevel} / {selectedTier === "Other" ? customTier : selectedTier}
          </span>
        </div>
      )}
    </div>
  );
};

export default LeagueLevelPicker;