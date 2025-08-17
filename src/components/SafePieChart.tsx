import React, { useState, useEffect, useMemo } from 'react';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface SafePieChartProps {
  data: PieChartData[];
  innerRadius?: number;
  outerRadius?: number;
  formatter?: (value: any, name: any) => [any, any];
  tooltipStyle?: React.CSSProperties;
}

// Fallback chart component
const FallbackChart: React.FC<{ data: PieChartData[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center relative">
      <div className="absolute inset-2 rounded-full border-4 border-gray-300 dark:border-gray-600">
        {data.length > 0 && (
          <div 
            className="absolute inset-0 rounded-full border-4"
            style={{
              borderColor: data[0].color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              transform: `rotate(${(data[0].value / total) * 360}deg)`
            }}
          />
        )}
      </div>
      <span className="text-gray-500 dark:text-gray-400 text-xs z-10">Chart</span>
    </div>
  );
};

const SafePieChart: React.FC<SafePieChartProps> = ({
  data,
  innerRadius = 35,
  outerRadius = 60,
  formatter,
  tooltipStyle
}) => {
  const [isClient, setIsClient] = useState(false);
  const [RechartsComponents, setRechartsComponents] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Try to load recharts dynamically
    const loadRecharts = async () => {
      try {
        const recharts = await import('recharts');
        setRechartsComponents(recharts);
      } catch (err) {
        console.warn('Failed to load recharts, using fallback:', err);
        setError(true);
      }
    };

    loadRecharts();
  }, []);

  const memoizedData = useMemo(() => data, [data]);

  // Show loading state
  if (!isClient) {
    return (
      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs">Loading...</span>
      </div>
    );
  }

  // Show fallback if recharts failed to load
  if (error || !RechartsComponents) {
    return <FallbackChart data={memoizedData} />;
  }

  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = RechartsComponents;

  try {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={memoizedData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {memoizedData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {formatter && tooltipStyle && (
            <Tooltip
              formatter={formatter}
              contentStyle={tooltipStyle}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  } catch (renderError) {
    console.warn('Chart render error:', renderError);
    return <FallbackChart data={memoizedData} />;
  }
};

export default SafePieChart;
