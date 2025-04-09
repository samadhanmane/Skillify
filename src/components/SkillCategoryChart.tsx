import React from "react";
import { Skill } from "@/lib/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface SkillCategoryChartProps {
  skills: Skill[];
  size?: number;
}

const SkillCategoryChart: React.FC<SkillCategoryChartProps> = ({ skills, size = 300 }) => {
  // Prevent rendering when no skills available
  if (!skills.length) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">
      No skills data available
    </div>;
  }

  // Count skills by category
  const categoryCount: Record<string, number> = {};
  skills.forEach(skill => {
    const category = skill.category || 'Uncategorized';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  // Prepare data for pie chart
  const data = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  // Generate colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];

  return (
    <div style={{ width: "100%", height: size }} className="animate-scale-in">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} skills`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillCategoryChart;
