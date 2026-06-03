const PlayerSilhouette = ({ evaluation }) => {
  // Calculate zone colors based on scores
  const getColor = (score) => {
    if (score >= 8) return '#10b981'; // emerald
    if (score >= 6.5) return '#22c55e'; // green
    if (score >= 5) return '#eab308'; // yellow
    if (score >= 3.5) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getOpacity = (score) => {
    return 0.4 + (score / 10) * 0.5;
  };

  // Map scores to body parts
  const headScore = (evaluation.mental_score + evaluation.tactical_score) / 2;
  const torsoScore = (evaluation.physical_score + evaluation.mental_score) / 2;
  const armsScore = evaluation.technical_score;
  const legsScore = (evaluation.physical_score + evaluation.technical_score) / 2;

  // Generate polygon fragments for low-poly effect
  const generateFragments = (baseColor, opacity, seed) => {
    const fragments = [];
    const variation = 0.15;
    for (let i = 0; i < 3; i++) {
      const lighterColor = baseColor;
      fragments.push({
        color: lighterColor,
        opacity: opacity - (i * 0.1)
      });
    }
    return fragments;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Low-Poly Player SVG - Dynamic Kicking Pose */}
      <svg viewBox="0 0 280 320" className="w-56 h-80">
        <defs>
          {/* Gradients for depth effect */}
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor(headScore)} stopOpacity={getOpacity(headScore) + 0.2} />
            <stop offset="100%" stopColor={getColor(headScore)} stopOpacity={getOpacity(headScore) - 0.1} />
          </linearGradient>
          <linearGradient id="torsoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor(torsoScore)} stopOpacity={getOpacity(torsoScore) + 0.2} />
            <stop offset="100%" stopColor={getColor(torsoScore)} stopOpacity={getOpacity(torsoScore) - 0.1} />
          </linearGradient>
          <linearGradient id="armsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor(armsScore)} stopOpacity={getOpacity(armsScore) + 0.2} />
            <stop offset="100%" stopColor={getColor(armsScore)} stopOpacity={getOpacity(armsScore) - 0.1} />
          </linearGradient>
          <linearGradient id="legsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={getColor(legsScore)} stopOpacity={getOpacity(legsScore) + 0.2} />
            <stop offset="100%" stopColor={getColor(legsScore)} stopOpacity={getOpacity(legsScore) - 0.1} />
          </linearGradient>
        </defs>

        {/* === HEAD - Low-Poly Fragments === */}
        <g className="head-zone">
          {/* Main head shape */}
          <polygon 
            points="125,15 145,25 150,45 145,60 130,65 115,60 110,45 115,25"
            fill={getColor(headScore)}
            fillOpacity={getOpacity(headScore)}
            stroke={getColor(headScore)}
            strokeWidth="1"
          />
          {/* Fragment 1 */}
          <polygon 
            points="125,15 145,25 135,40 120,35"
            fill={getColor(headScore)}
            fillOpacity={getOpacity(headScore) + 0.15}
            stroke={getColor(headScore)}
            strokeWidth="0.5"
          />
          {/* Fragment 2 */}
          <polygon 
            points="135,40 150,45 145,60 130,50"
            fill={getColor(headScore)}
            fillOpacity={getOpacity(headScore) - 0.1}
            stroke={getColor(headScore)}
            strokeWidth="0.5"
          />
          {/* Hair fragments */}
          <polygon 
            points="120,12 130,8 140,12 145,25 125,15 115,25"
            fill={getColor(headScore)}
            fillOpacity={getOpacity(headScore) - 0.2}
            stroke={getColor(headScore)}
            strokeWidth="0.5"
          />
        </g>

        {/* === TORSO - Dynamic Twisted Pose === */}
        <g className="torso-zone">
          {/* Upper torso - turned */}
          <polygon 
            points="110,65 150,70 165,85 160,120 140,125 115,120 95,115 90,85"
            fill={getColor(torsoScore)}
            fillOpacity={getOpacity(torsoScore)}
            stroke={getColor(torsoScore)}
            strokeWidth="1"
          />
          {/* Torso fragment 1 */}
          <polygon 
            points="110,65 130,68 125,95 100,90"
            fill={getColor(torsoScore)}
            fillOpacity={getOpacity(torsoScore) + 0.15}
            stroke={getColor(torsoScore)}
            strokeWidth="0.5"
          />
          {/* Torso fragment 2 */}
          <polygon 
            points="130,68 150,70 155,100 125,95"
            fill={getColor(torsoScore)}
            fillOpacity={getOpacity(torsoScore) - 0.05}
            stroke={getColor(torsoScore)}
            strokeWidth="0.5"
          />
          {/* Lower torso */}
          <polygon 
            points="95,115 160,120 155,145 145,160 110,155 100,140"
            fill={getColor(torsoScore)}
            fillOpacity={getOpacity(torsoScore) - 0.1}
            stroke={getColor(torsoScore)}
            strokeWidth="1"
          />
          {/* Hip fragment */}
          <polygon 
            points="100,140 145,145 140,160 105,155"
            fill={getColor(torsoScore)}
            fillOpacity={getOpacity(torsoScore) - 0.15}
            stroke={getColor(torsoScore)}
            strokeWidth="0.5"
          />
        </g>

        {/* === LEFT ARM - Extended Back for Balance === */}
        <g className="left-arm-zone">
          {/* Upper arm */}
          <polygon 
            points="90,85 75,75 50,85 55,100 80,105 95,100"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore)}
            stroke={getColor(armsScore)}
            strokeWidth="1"
          />
          {/* Arm fragment */}
          <polygon 
            points="75,75 60,80 65,95 80,90"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore) + 0.1}
            stroke={getColor(armsScore)}
            strokeWidth="0.5"
          />
          {/* Forearm */}
          <polygon 
            points="50,85 30,70 20,75 25,90 45,100 55,100"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore) - 0.1}
            stroke={getColor(armsScore)}
            strokeWidth="1"
          />
          {/* Hand */}
          <polygon 
            points="20,75 10,70 5,78 15,85 25,82"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore)}
            stroke={getColor(armsScore)}
            strokeWidth="0.5"
          />
        </g>

        {/* === RIGHT ARM - Forward Motion === */}
        <g className="right-arm-zone">
          {/* Upper arm */}
          <polygon 
            points="165,85 175,80 195,95 190,115 170,120 160,110"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore)}
            stroke={getColor(armsScore)}
            strokeWidth="1"
          />
          {/* Arm fragment */}
          <polygon 
            points="175,80 190,90 185,105 170,95"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore) + 0.1}
            stroke={getColor(armsScore)}
            strokeWidth="0.5"
          />
          {/* Forearm bent */}
          <polygon 
            points="190,115 205,120 215,110 210,95 195,95"
            fill={getColor(armsScore)}
            fillOpacity={getOpacity(armsScore) - 0.1}
            stroke={getColor(armsScore)}
            strokeWidth="1"
          />
        </g>

        {/* === LEFT LEG - Support Leg === */}
        <g className="left-leg-zone">
          {/* Thigh */}
          <polygon 
            points="100,155 115,160 120,200 115,220 95,225 85,210 90,175"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore)}
            stroke={getColor(legsScore)}
            strokeWidth="1"
          />
          {/* Thigh fragment */}
          <polygon 
            points="100,165 115,170 110,195 95,190"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore) + 0.1}
            stroke={getColor(legsScore)}
            strokeWidth="0.5"
          />
          {/* Lower leg */}
          <polygon 
            points="85,225 100,230 105,275 95,295 75,290 70,270 75,240"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore) - 0.1}
            stroke={getColor(legsScore)}
            strokeWidth="1"
          />
          {/* Shin fragment */}
          <polygon 
            points="85,235 98,240 95,270 80,265"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore)}
            stroke={getColor(legsScore)}
            strokeWidth="0.5"
          />
          {/* Foot/Boot */}
          <polygon 
            points="70,290 95,295 100,305 95,310 65,305 60,295"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore) + 0.05}
            stroke={getColor(legsScore)}
            strokeWidth="1"
          />
        </g>

        {/* === RIGHT LEG - Kicking Motion === */}
        <g className="right-leg-zone">
          {/* Thigh - angled for kick */}
          <polygon 
            points="140,155 155,160 185,180 195,200 180,210 155,195 135,175"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore)}
            stroke={getColor(legsScore)}
            strokeWidth="1"
          />
          {/* Thigh fragment */}
          <polygon 
            points="150,165 175,180 170,195 145,180"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore) + 0.1}
            stroke={getColor(legsScore)}
            strokeWidth="0.5"
          />
          {/* Lower leg - extended */}
          <polygon 
            points="180,210 200,205 235,230 245,250 230,260 200,245 185,225"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore) - 0.1}
            stroke={getColor(legsScore)}
            strokeWidth="1"
          />
          {/* Shin fragment */}
          <polygon 
            points="195,215 225,235 220,250 190,235"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore)}
            stroke={getColor(legsScore)}
            strokeWidth="0.5"
          />
          {/* Foot/Boot - about to strike */}
          <polygon 
            points="230,260 250,255 265,265 260,280 240,280 225,270"
            fill={getColor(legsScore)}
            fillOpacity={getOpacity(legsScore) + 0.05}
            stroke={getColor(legsScore)}
            strokeWidth="1"
          />
        </g>

        {/* === BALL === */}
        <g className="ball">
          {/* Ball with geometric pattern */}
          <circle 
            cx="270" 
            cy="285" 
            r="15" 
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          {/* Pentagon pattern */}
          <polygon 
            points="270,273 278,280 275,290 265,290 262,280"
            fill="none"
            stroke="#fff"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
        </g>

        {/* === MOTION FRAGMENTS - Scattered pieces for dynamic effect === */}
        <g className="motion-fragments" opacity="0.4">
          {/* Fragments behind player suggesting motion */}
          <polygon points="40,90 50,85 55,95 45,100" fill={getColor(armsScore)} fillOpacity="0.3" />
          <polygon points="25,80 35,75 38,85 28,88" fill={getColor(armsScore)} fillOpacity="0.2" />
          <polygon points="60,160 70,155 75,165 65,170" fill={getColor(torsoScore)} fillOpacity="0.2" />
          <polygon points="200,170 210,165 215,175 205,180" fill={getColor(legsScore)} fillOpacity="0.25" />
          <polygon points="220,200 230,195 235,205 225,210" fill={getColor(legsScore)} fillOpacity="0.2" />
          <polygon points="250,240 260,235 263,245 253,248" fill={getColor(legsScore)} fillOpacity="0.15" />
        </g>
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded" style={{ backgroundColor: getColor(headScore), opacity: getOpacity(headScore) }} />
          <span className="text-muted-foreground">Head: {headScore.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded" style={{ backgroundColor: getColor(torsoScore), opacity: getOpacity(torsoScore) }} />
          <span className="text-muted-foreground">Torso: {torsoScore.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded" style={{ backgroundColor: getColor(armsScore), opacity: getOpacity(armsScore) }} />
          <span className="text-muted-foreground">Arms: {armsScore.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded" style={{ backgroundColor: getColor(legsScore), opacity: getOpacity(legsScore) }} />
          <span className="text-muted-foreground">Legs: {legsScore.toFixed(1)}</span>
        </div>
      </div>

      {/* Color Scale */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs text-muted-foreground mr-2">Low</span>
        <div className="w-4 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
        <div className="w-4 h-3 rounded" style={{ backgroundColor: '#f97316' }} />
        <div className="w-4 h-3 rounded" style={{ backgroundColor: '#eab308' }} />
        <div className="w-4 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
        <div className="w-4 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
        <span className="text-xs text-muted-foreground ml-2">High</span>
      </div>
    </div>
  );
};

export default PlayerSilhouette;
