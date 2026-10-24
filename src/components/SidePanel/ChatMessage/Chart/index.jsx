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
import { useTranslation } from "react-i18next";
import { isLightMode } from "@/utils/theme";

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

/**
 * Recharts takes colours as props, so the theme is read on each render.
 * @returns {{grid: string, treemapStroke: string, tooltip: object}}
 */
function themeColors() {
  const light = isLightMode();
  const grid = light ? "#e2e8f0" : "#3f3f46";
  return {
    grid,
    treemapStroke: light ? "#ffffff" : "#18181b",
    tooltip: {
      cursor: { fill: "rgba(113, 113, 122, 0.2)" },
      contentStyle: {
        background: light ? "#ffffff" : "#27272a",
        border: `1px solid ${grid}`,
        borderRadius: 8,
        fontSize: 12,
        color: light ? "#0f172a" : "#ffffff",
      },
    },
  };
}

/**
 * Renders the chart an agent produced with the rechart tool.
 * @param {Object} props
 * @param {{type: string, title?: string, dataset: object[]|string}} props.chart
 */
export default function Chart({ chart }) {
  const { t } = useTranslation();
  const data = parseDataset(chart.dataset);
  if (data.length === 0) return null;
  const keys = Object.keys(data[0]);
  const value = keys[1] ?? "value";

  return (
    <div className="bg-zinc-800 light:bg-slate-100 rounded-xl p-4 flex flex-col gap-y-2">
      {!!chart.title && (
        <h3 className="text-sm font-medium text-white light:text-slate-900">
          {chart.title}
        </h3>
      )}
      <div className="h-[240px] w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(
            chart.type?.toLowerCase(),
            data,
            value,
            keys,
            themeColors(),
            t
          )}
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

function renderChart(
  type,
  data,
  value,
  keys,
  { grid, treemapStroke, tooltip },
  t
) {
  if (type === "area")
    return (
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...tooltip} />
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
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis type="number" {...AXIS} />
        <YAxis type="category" dataKey="name" width={60} {...AXIS} />
        <Tooltip {...tooltip} />
        <Bar dataKey={value} fill={COLORS[0]} radius={4} />
      </BarChart>
    );
  if (type === "line")
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...tooltip} />
        <Line dataKey={value} stroke={COLORS[0]} dot={false} />
      </LineChart>
    );
  if (type === "composed")
    return (
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="name" {...AXIS} />
        <YAxis {...AXIS} />
        <Tooltip {...tooltip} />
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
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey={keys[0]} {...AXIS} />
        <YAxis dataKey={value} {...AXIS} />
        <Tooltip {...tooltip} />
        <Scatter data={data} fill={COLORS[0]} />
      </ScatterChart>
    );
  if (type === "pie")
    return (
      <PieChart>
        <Tooltip {...tooltip} />
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
        <PolarGrid stroke={grid} />
        <PolarAngleAxis dataKey="name" {...AXIS} />
        <PolarRadiusAxis {...AXIS} />
        <Tooltip {...tooltip} />
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
        <Tooltip {...tooltip} />
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
        stroke={treemapStroke}
        fill={COLORS[0]}
      />
    );
  if (type === "funnel")
    return (
      <FunnelChart>
        <Tooltip {...tooltip} />
        <Funnel data={data} dataKey={value} nameKey="name">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    );
  return (
    <p className="text-xs text-zinc-400 light:text-slate-500">
      {t("chat.unsupportedChart")}
    </p>
  );
}
