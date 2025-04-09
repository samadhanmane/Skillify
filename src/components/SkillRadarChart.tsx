import React from "react";
import { Skill } from "@/lib/types";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

interface SkillRadarChartProps {
  skills: Skill[];
  size?: number;
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills, size = 400 }) => {
  // Prevent rendering when no skills available
  if (!skills.length) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">
      No skills data available
    </div>;
  }

  // Prepare data for radar chart
  const data = skills.map(skill => ({
    subject: skill.name,
    A: skill.level,
    fullMark: 100,
  }));

  return (
    <div style={{ width: "100%", height: size }} className="animate-scale-in">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid strokeOpacity={0.3} />
          <PolarAngleAxis 
            dataKey="subject"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} tick={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadarChart;
