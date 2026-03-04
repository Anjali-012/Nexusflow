"use client";

import { useState } from "react";

export default function JsonViewer({ data }: { data: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const str = JSON.stringify(data, null, 2);
  const preview = str.length > 120 ? str.slice(0, 120) + "..." : str;

  return (
    <div className="mt-1">
      <pre
        className="bg-slate-900 text-slate-100 text-[11px] rounded-md p-3 overflow-auto max-h-48 font-mono leading-relaxed cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? str : preview}
      </pre>
      {str.length > 120 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[11px] text-blue-500 hover:underline mt-1"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
