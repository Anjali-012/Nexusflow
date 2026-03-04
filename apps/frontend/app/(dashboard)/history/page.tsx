"use client";

import { useState } from "react";
import RunFeed, { ExecutionRun } from "@/components/history/RunFeed";
import RunInspector from "@/components/history/RunInspector";

export default function HistoryPage() {
  const [selectedRun, setSelectedRun] = useState<ExecutionRun | null>(null);

  return (
    <div>
      {!selectedRun && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Execution History
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View all workflow runs and inspect each step
          </p>
        </div>
      )}

      {selectedRun ? (
        <RunInspector run={selectedRun} onBack={() => setSelectedRun(null)} />
      ) : (
        <RunFeed onSelect={setSelectedRun} />
      )}
    </div>
  );
}
