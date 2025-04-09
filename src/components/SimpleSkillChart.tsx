
import React, { useEffect, useRef } from 'react';

interface SkillCategory {
  name: string;
  count: number;
}

interface SimpleSkillChartProps {
  data: SkillCategory[];
  height?: number;
}

const SimpleSkillChart: React.FC<SimpleSkillChartProps> = ({ 
  data,
  height = 200
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Clear previous chart
    chartRef.current.innerHTML = '';
    
    // Create chart
    const maxValue = Math.max(...data.map(item => item.count));
    const chartContainer = document.createElement('div');
    chartContainer.className = 'flex items-end justify-between h-full w-full';
    
    data.forEach((item, index) => {
      // Create column container
      const column = document.createElement('div');
      column.className = 'flex flex-col items-center';
      column.style.flex = '1';
      
      // Create bar
      const bar = document.createElement('div');
      const percentage = (item.count / maxValue) * 100;
      bar.style.height = `${percentage}%`;
      bar.style.width = '70%';
      bar.style.backgroundColor = 'var(--primary-color)';
      bar.style.borderRadius = '4px 4px 0 0';
      bar.style.transition = 'height 0.5s ease-out';
      
      // Add tooltip with value
      bar.title = `${item.name}: ${item.count}`;
      
      // Create label
      const label = document.createElement('div');
      label.className = 'text-xs text-muted mt-2 truncate';
      label.style.width = '100%';
      label.style.textAlign = 'center';
      label.textContent = item.name;
      
      // Add to DOM
      column.appendChild(bar);
      column.appendChild(label);
      chartContainer.appendChild(column);
    });
    
    chartRef.current.appendChild(chartContainer);
    
    // Animate bars
    setTimeout(() => {
      const bars = chartRef.current?.querySelectorAll('div > div > div:first-child');
      bars?.forEach(bar => {
        (bar as HTMLElement).style.height = `${parseInt((bar as HTMLElement).style.height)}%`;
      });
    }, 50);
  }, [data]);
  
  return (
    <div 
      ref={chartRef} 
      className="w-full" 
      style={{ height: `${height}px` }}
    ></div>
  );
};

export default SimpleSkillChart;
