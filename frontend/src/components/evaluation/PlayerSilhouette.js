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
    return 0.3 + (score / 10) * 0.5;
  };

  // Map scores to body parts
  const headScore = (evaluation.mental_score + evaluation.tactical_score) / 2;
  const torsoScore = (evaluation.physical_score + evaluation.mental_score) / 2;
  const armsScore = evaluation.technical_score;
  const legsScore = (evaluation.physical_score + evaluation.technical_score) / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG Silhouette */}
      <svg viewBox="0 0 200 320" className="w-48 h-72">
        {/* Head - Mental/Tactical */}
        <ellipse
          cx="100"
          cy="35"
          rx="28"
          ry="32"
          fill={getColor(headScore)}
          fillOpacity={getOpacity(headScore)}
          stroke={getColor(headScore)}
          strokeWidth="2"
        />
        
        {/* Neck */}
        <rect
          x="90"
          y="65"
          width="20"
          height="15"
          fill={getColor(torsoScore)}
          fillOpacity={getOpacity(torsoScore)}
        />
        
        {/* Torso - Physical/Mental */}
        <path
          d="M60 80 L140 80 L150 180 L50 180 Z"
          fill={getColor(torsoScore)}
          fillOpacity={getOpacity(torsoScore)}
          stroke={getColor(torsoScore)}
          strokeWidth="2"
        />
        
        {/* Left Arm - Technical */}
        <path
          d="M60 85 L30 100 L15 160 L25 165 L45 115 L60 130"
          fill={getColor(armsScore)}
          fillOpacity={getOpacity(armsScore)}
          stroke={getColor(armsScore)}
          strokeWidth="2"
        />
        
        {/* Right Arm - Technical */}
        <path
          d="M140 85 L170 100 L185 160 L175 165 L155 115 L140 130"
          fill={getColor(armsScore)}
          fillOpacity={getOpacity(armsScore)}
          stroke={getColor(armsScore)}
          strokeWidth="2"
        />
        
        {/* Left Leg - Physical/Technical */}
        <path
          d="M55 180 L45 280 L35 310 L55 310 L65 285 L75 180"
          fill={getColor(legsScore)}
          fillOpacity={getOpacity(legsScore)}
          stroke={getColor(legsScore)}
          strokeWidth="2"
        />
        
        {/* Right Leg - Physical/Technical */}
        <path
          d="M125 180 L135 285 L145 310 L165 310 L155 280 L145 180"
          fill={getColor(legsScore)}
          fillOpacity={getOpacity(legsScore)}
          stroke={getColor(legsScore)}
          strokeWidth="2"
        />
        
        {/* Ball at feet */}
        <circle
          cx="100"
          cy="305"
          r="12"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
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
