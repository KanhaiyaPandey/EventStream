"use client";

import { useState } from "react";
import { Copy, Check, BookOpen } from "lucide-react";
import { Card, CardHeader, CardContent } from "@eventstream/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const SNIPPETS = {
  curl: `curl -X POST ${API_URL}/api/track \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventType": "page_view",
    "userId": "user_123",
    "properties": {
      "url": "/pricing",
      "referrer": "/home"
    }
  }'`,
  js: `// Browser / Node.js
await fetch("${API_URL}/api/track", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    eventType: "purchase",
    userId: "user_123",
    properties: { value: 49.99, currency: "USD" }
  })
});`,
  python: `import requests

requests.post("${API_URL}/api/track", json={
    "eventType": "sign_up",
    "userId": "user_123",
    "properties": {"plan": "pro"}
})`,
};

type Lang = keyof typeof SNIPPETS;

export function ApiDocs() {
  const [lang, setLang] = useState<Lang>("curl");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SNIPPETS[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-500" />
          <h2 className="font-display font-700 text-sm text-zinc-900 uppercase tracking-wide">
            Quick Start
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          Integrate in seconds — just send a POST request
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {/* Language tabs */}
          <div className="flex gap-1 border-b border-zinc-100 pb-2">
            {(Object.keys(SNIPPETS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  lang === l
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="bg-zinc-950 text-zinc-200 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
              {SNIPPETS[lang]}
            </pre>
            <button
              onClick={copy}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
              title="Copy code"
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                : <Copy className="w-3.5 h-3.5 text-zinc-400" />
              }
            </button>
          </div>

          {/* Endpoint reference */}
          <div className="grid grid-cols-1 gap-2">
            {[
              { method: "POST", path: "/api/track",               desc: "Ingest an event" },
              { method: "GET",  path: "/api/events",               desc: "List events (paginated)" },
              { method: "GET",  path: "/api/analytics/summary",    desc: "Dashboard stats" },
              { method: "GET",  path: "/api/analytics/timeseries", desc: "Time-series data" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-2.5 py-1.5 border-b border-zinc-50 last:border-0">
                <span className={`text-xs font-mono font-bold w-10 ${
                  ep.method === "POST" ? "text-emerald-600" : "text-blue-600"
                }`}>
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-zinc-700 flex-1">{ep.path}</code>
                <span className="text-xs text-zinc-400 hidden sm:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
