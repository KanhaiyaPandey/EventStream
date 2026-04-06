import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  accent?: "blue" | "green" | "purple" | "orange";
}

const accentStyles = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
};

export function StatCard({ title, value, subtitle, icon, trend, accent = "blue" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">{title}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentStyles[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-zinc-900 tabular-nums">{value}</div>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {trend && (
        <div className={`text-xs font-medium ${trend.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}
