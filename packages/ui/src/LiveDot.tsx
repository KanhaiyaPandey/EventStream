import React from "react";

interface LiveDotProps {
  connected?: boolean;
  label?: string;
}

export function LiveDot({ connected = true, label }: LiveDotProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            connected ? "bg-emerald-500" : "bg-zinc-300"
          }`}
        />
      </span>
      {label && (
        <span className={`text-xs font-medium ${connected ? "text-emerald-600" : "text-zinc-400"}`}>
          {label}
        </span>
      )}
    </div>
  );
}
