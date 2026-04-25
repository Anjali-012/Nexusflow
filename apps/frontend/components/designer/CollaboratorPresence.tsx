"use client";

import { CollaboratorState } from "@/hooks/useCollaboration";

export default function CollaboratorPresence({
  collaborators,
  connected,
}: {
  collaborators: CollaboratorState[];
  connected: boolean;
}) {
  if (!connected) return null;

  return (
    <div className="flex items-center gap-2">
      {collaborators.length > 0 && (
        <div className="flex items-center gap-1">
          {collaborators.slice(0, 5).map((c) => (
            <div
              key={c.userId}
              title={c.name}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
              style={{ backgroundColor: c.color }}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {collaborators.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xs font-semibold border-2 border-white">
              +{collaborators.length - 5}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-slate-400">Live</span>
      </div>
    </div>
  );
}
