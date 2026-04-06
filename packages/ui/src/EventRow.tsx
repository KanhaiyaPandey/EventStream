import React from "react";
import { Badge } from "./Badge";
import type { EventDocument } from "@eventstream/config/types";

interface EventRowProps {
  event: EventDocument;
  isNew?: boolean;
}

function formatTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(ts: string): string {
  const date = new Date(ts);
  const today = new Date();
  const diff = today.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function EventRow({ event, isNew = false }: EventRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-zinc-50 last:border-0 transition-colors duration-300 ${
        isNew ? "bg-blue-50/60" : "hover:bg-zinc-50/60"
      }`}
    >
      {/* Live indicator dot */}
      {isNew && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {!isNew && <span className="flex-shrink-0 w-1.5 h-1.5" />}

      {/* Event type badge */}
      <div className="flex-shrink-0 w-32">
        <Badge label={event.eventType} eventType={event.eventType} />
      </div>

      {/* User */}
      <div className="flex-shrink-0 w-28 text-xs text-zinc-500 font-mono truncate">
        {event.userId || "anonymous"}
      </div>

      {/* Properties summary */}
      <div className="flex-1 text-xs text-zinc-400 truncate">
        {event.properties?.url
          ? event.properties.url
          : event.properties?.label
          ? event.properties.label
          : JSON.stringify(event.properties ?? {}).slice(0, 60)}
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-right">
        <div className="text-xs text-zinc-500 font-mono">{formatTime(event.timestamp)}</div>
        <div className="text-xs text-zinc-400">{formatDate(event.timestamp)}</div>
      </div>
    </div>
  );
}
