import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";

// Same palette as the main app's chart helpers.
const COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#ec4899",
];
const AXIS = { stroke: "#71717a", fontSize: 11 };
const TOOLTIP = {
  contentStyle: {
    background: "#27272a",
    border: "1px solid #3f3f46",
    borderRadius: 8,
    fontSize: 12,
  },
};

/**
 * Renders the chart an agent produced with the rechart tool.
 * @param {Object} props
 * @param {{type: string, title?: string, dataset: object[]|string}} props.chart
 */
export default function Chart({ chart }) {
  const data = parseDataset(chart.dataset);
  if (data.length === 0) return null;
  const keys = Object.keys(data[0]);
  const value = keys[1] ?? "value";

  return (
    <div className="bg-zinc-800 light:bg-white light:border light:border-slate-300 rounded-xl p-4 flex flex-col gap-y-2">
      {!!chart.title && (
        <h3 className="text-sm font-medium text-white light:text-slate-900">
          {chart.title}
        </h3>
      )}
      <div className="h-[240px] w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chart.type?.toLowerCase(), data, value, keys)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function parseDataset(dataset) {
  if (Array.isArray(dataset)) return dataset;
  try {
    const parsed = JSON.parse(dataset);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderChart(type, data, value, keys) {
  if (type === "area")
    return (
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Area
          dataKey={value}
          stroke={COLORS[0]}
          fill={COLORS[0]}
          fillOpacity={0.3}
        />
      </AreaChart>
    );
  if (type === "bar")
    return (
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis type="number" {...AXIS} />
        <YAxis type="category" dataKey="name" width={90} {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Bar dataKey={value} fill={COLORS[0]} radius={4} />
      </BarChart>
    );
  if (type === "line")
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Line dataKey={value} stroke={COLORS[0]} dot={false} />
      </LineChart>
    );
  if (type === "composed")
    return (
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Legend />
        {keys
          .slice(1)
          .map((key, i) =>
            i % 2 === 0 ? (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
            ) : (
              <Line
                key={key}
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
              />
            )
          )}
      </ComposedChart>
    );
  if (type === "scatter")
    return (
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey={keys[0]} {...AXIS} />
        <YAxis dataKey={value} {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Scatter data={data} fill={COLORS[0]} />
      </ScatterChart>
    );
  if (type === "pie")
    return (
      <PieChart>
        <Tooltip {...TOOLTIP} />
        <Legend />
        <Pie data={data} dataKey={value} nameKey="name" innerRadius="50%">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    );
  if (type === "radar")
    return (
      <RadarChart data={data}>
        <PolarGrid stroke="#3f3f46" />
        <PolarAngleAxis dataKey="name" {...AXIS} />
        <PolarRadiusAxis {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Radar
          dataKey={value}
          stroke={COLORS[0]}
          fill={COLORS[0]}
          fillOpacity={0.4}
        />
      </RadarChart>
    );
  if (type === "radialbar")
    return (
      <RadialBarChart data={data} innerRadius="20%" outerRadius="90%">
        <Tooltip {...TOOLTIP} />
        <Legend />
        <RadialBar dataKey={value} background>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </RadialBar>
      </RadialBarChart>
    );
  if (type === "treemap")
    return (
      <Treemap
        data={data}
        dataKey={value}
        nameKey="name"
        stroke="#18181b"
        fill={COLORS[0]}
      />
    );
  if (type === "funnel")
    return (
      <FunnelChart>
        <Tooltip {...TOOLTIP} />
        <Funnel data={data} dataKey={value} nameKey="name">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    );
  return (
    <p className="text-xs text-zinc-400 light:text-slate-500">
      Unsupported chart type.
    </p>
  );
}
