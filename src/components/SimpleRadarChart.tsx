
import React, { useEffect, useRef } from 'react';

interface SkillData {
  name: string;
  value: number; // 0 to 100
}

interface SimpleRadarChartProps {
  data: SkillData[];
  size?: number;
}

const SimpleRadarChart: React.FC<SimpleRadarChartProps> = ({
  data,
  size = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = size;
    canvas.height = size;
    
    // Calculate center and radius
    const center = size / 2;
    const radius = center * 0.8;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw background web
    drawWeb(ctx, center, radius, data.length);
    
    // Draw data
    drawData(ctx, center, radius, data);
    
    // Draw labels
    drawLabels(ctx, center, radius, data);
    
  }, [data, size]);
  
  // Function to draw the web background
  const drawWeb = (
    ctx: CanvasRenderingContext2D, 
    center: number, 
    radius: number, 
    sides: number
  ) => {
    // Draw multiple rings
    const steps = 5; // Number of concentric circles
    
    for (let i = 1; i <= steps; i++) {
      const stepRadius = (radius * i) / steps;
      
      // Draw the ring
      ctx.beginPath();
      
      for (let j = 0; j < sides; j++) {
        const angle = (Math.PI * 2 * j) / sides - Math.PI / 2;
        const x = center + stepRadius * Math.cos(angle);
        const y = center + stepRadius * Math.sin(angle);
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.stroke();
    }
    
    // Draw the lines from center to vertices
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.stroke();
    }
  };
  
  // Function to draw the data
  const drawData = (
    ctx: CanvasRenderingContext2D, 
    center: number, 
    radius: number, 
    data: SkillData[]
  ) => {
    const sides = data.length;
    
    // Draw data polygon
    ctx.beginPath();
    
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const value = data[i].value / 100; // Normalize to 0-1
      const pointRadius = radius * value;
      const x = center + pointRadius * Math.cos(angle);
      const y = center + pointRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'var(--primary-color)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw data points
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const value = data[i].value / 100; // Normalize to 0-1
      const pointRadius = radius * value;
      const x = center + pointRadius * Math.cos(angle);
      const y = center + pointRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--primary-color)';
      ctx.fill();
    }
  };
  
  // Function to draw labels
  const drawLabels = (
    ctx: CanvasRenderingContext2D, 
    center: number, 
    radius: number, 
    data: SkillData[]
  ) => {
    const sides = data.length;
    
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const labelRadius = radius + 20; // Position labels outside the chart
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);
      
      // Adjust text alignment based on position
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Further adjust positioning for better placement
      let adjustedX = x;
      let adjustedY = y;
      
      if (angle < -Math.PI / 4 && angle > -3 * Math.PI / 4) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
      } else if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
      } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
      } else {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
      }
      
      ctx.fillStyle = '#64748b'; // Muted text color
      ctx.font = '12px var(--font-sans)';
      ctx.fillText(data[i].name, adjustedX, adjustedY);
      
      // Draw value near the data point
      const valueRadius = radius * (data[i].value / 100) - 15;
      const valueX = center + valueRadius * Math.cos(angle);
      const valueY = center + valueRadius * Math.sin(angle);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px var(--font-sans)';
      ctx.fillText(`${data[i].value}%`, valueX, valueY);
    }
  };
  
  return (
    <div className="flex justify-center items-center">
      <canvas 
        ref={canvasRef} 
        width={size} 
        height={size} 
        className="max-w-full"
      />
    </div>
  );
};

export default SimpleRadarChart;
