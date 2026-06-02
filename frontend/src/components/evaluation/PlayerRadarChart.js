import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const PlayerRadarChart = ({ evaluation }) => {
  const data = [
    { subject: 'Technique', value: evaluation.technical_score, fullMark: 10 },
    { subject: 'Tactique', value: evaluation.tactical_score, fullMark: 10 },
    { subject: 'Physique', value: evaluation.physical_score, fullMark: 10 },
    { subject: 'Mental', value: evaluation.mental_score, fullMark: 10 },
    { subject: 'Attaque', value: evaluation.attacking_score, fullMark: 10 },
    { subject: 'Défense', value: evaluation.defending_score, fullMark: 10 },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid 
            stroke="#3f3f46" 
            strokeDasharray="3 3"
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            stroke="#3f3f46"
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 10]} 
            tick={{ fill: '#71717a', fontSize: 10 }}
            stroke="#3f3f46"
            tickCount={6}
          />
          <Radar
            name="Scores"
            dataKey="value"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PlayerRadarChart;
