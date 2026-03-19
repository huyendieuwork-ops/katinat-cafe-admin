"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const CHART_COLORS = [
  "#4e6b53",
  "#6f8c73",
  "#8faa90",
  "#395241",
  "#b9c9ba",
  "#9bb09f",
];

export function RevenueLineChart({
  data,
}: {
  data: { date: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Doanh thu"
          stroke="#4e6b53"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UniversityBarChart({
  data,
}: {
  data: { university: string; count: number; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="university" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" name="Số lượt mua" fill="#4e6b53" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={105} label>
          {data.map((entry, index) => (
            <Cell
              key={`${entry.name}-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}