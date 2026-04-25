"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export interface CollaboratorState {
  userId: string;
  name: string;
  color: string;
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function getColor(userId: string): string {
  let hash = 0;

  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return COLORS[Math.abs(hash) % COLORS.length];
}

export function useCollaboration(workflowId: string | null) {
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  const [collaborators, setCollaborators] = useState<CollaboratorState[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!workflowId) return;

    const token = localStorage.getItem("auth-storage");
    const parsed = token ? JSON.parse(token) : null;
    const jwtToken = parsed?.state?.token;

    if (!jwtToken) return;

    const doc = new Y.Doc();

    const hocuspocus = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:1234",
      name: `workflow:${workflowId}`,
      document: doc,
      token: jwtToken,

      onConnect() {
        setConnected(true);
      },

      onDisconnect() {
        setConnected(false);
      },

      onAwarenessChange({ states }) {
        const collabs: CollaboratorState[] = states
          .filter((s) => s.clientId !== doc.clientID)
          .map((s) => ({
            userId: s.state?.userId || "unknown",
            name: s.state?.name || "Anonymous",
            color: getColor(s.state?.userId || ""),
          }));

        setCollaborators(collabs);
      },
    });

    providerRef.current = hocuspocus;
    ydocRef.current = doc;

    const rawUser = localStorage.getItem("auth-storage");
    const user = rawUser ? JSON.parse(rawUser)?.state?.user : null;

    hocuspocus.setAwarenessField("userId", user?.id || "unknown");
    hocuspocus.setAwarenessField("name", user?.name || "Anonymous");

    return () => {
      hocuspocus.destroy();
      doc.destroy();

      providerRef.current = null;
      ydocRef.current = null;

      setConnected(false);
      setCollaborators([]);
    };
  }, [workflowId]);

  return {
    providerRef,
    ydocRef,
    collaborators,
    connected,
  };
}
