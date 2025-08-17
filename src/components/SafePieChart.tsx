import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Dynamic import function for recharts to handle context issues
const loadRecharts = () => {
  try {
    // Ensure React is available in the global context for recharts
    if (typeof window !== 'undefined' && React) {
      (window as any).React = React;
    }
    return import('recharts');
  } catch (error) {
    console.warn('Failed to load recharts:', error);
    return Promise.reject(error);
  }
};

// Create a wrapper component that handles recharts loading
const RechartsPieChart = React.memo(({
  data,
  innerRadius = 35,
  outerRadius = 60,
  formatter,
  tooltipStyle
}: any) => {
  const [recharts, setRecharts] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadRecharts()
      .then((module) => {
        if (mounted) {
          setRecharts(module);
        }
      })
      .catch((err) => {
        console.warn('Recharts loading error:', err);
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error || !recharts) {
    return (
      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {error ? 'Chart Error' : 'Loading...'}
        </span>
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } = recharts;

  try {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
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
    return (
      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs">Chart Error</span>
      </div>
    );
  }
});

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

const SafePieChart: React.FC<SafePieChartProps> = ({
  data,
  innerRadius = 35,
  outerRadius = 60,
  formatter,
  tooltipStyle
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const memoizedData = useMemo(() => data, [data]);

  if (!isClient) {
    return (
      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <RechartsPieChart
      data={memoizedData}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      formatter={formatter}
      tooltipStyle={tooltipStyle}
    />
  );
};

export default SafePieChart;
