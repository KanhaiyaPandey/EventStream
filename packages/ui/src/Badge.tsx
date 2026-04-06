import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-700 border-zinc-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

const EVENT_TYPE_VARIANTS: Record<string, BadgeVariant> = {
  page_view: "info",
  click: "default",
  form_submit: "purple",
  sign_up: "success",
  login: "success",
  logout: "warning",
  purchase: "success",
  add_to_cart: "info",
  api_call: "default",
  error: "danger",
  feature_used: "purple",
  session_start: "info",
  session_end: "warning",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  eventType?: string;
  className?: string;
}

export function Badge({ label, variant, eventType, className = "" }: BadgeProps) {
  const resolvedVariant =
    variant ?? (eventType ? (EVENT_TYPE_VARIANTS[eventType] ?? "default") : "default");

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border font-mono ${variantStyles[resolvedVariant]} ${className}`}
    >
      {label}
    </span>
  );
}
