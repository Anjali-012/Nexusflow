"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2, Plus, Key } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKey {
  _id: string;
  label: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data } = await api.get("/api-keys");
      return data.apiKeys as ApiKey[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/api-keys", {
        label,
        permissions: ["trigger", "read"],
      });
      return data;
    },
    onSuccess: (data) => {
      setNewKey(data.key);
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key created");
    },
    onError: () => toast.error("Failed to create API key"),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: () => toast.error("Failed to revoke API key"),
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">API Keys</h1>
        <p className="text-slate-500 text-sm mt-1">
          Create API keys to trigger workflows programmatically via the SDK.
        </p>
      </div>

      {/* Create new key */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Create New Key
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Key label e.g. Production App"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!label || createMutation.isPending}
          >
            <Plus size={14} className="mr-1.5" />
            Create
          </Button>
        </div>

        {/* Show newly created key once */}
        {newKey && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-2">
              Copy this key now — it won&apos;t be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-emerald-200 rounded px-3 py-2 font-mono truncate">
                {newKey}
              </code>
              <button
                onClick={() => copyKey(newKey)}
                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="text-xs text-emerald-600 hover:underline mt-2"
            >
              I&apos;ve saved it, dismiss
            </button>
          </div>
        )}
      </div>

      {/* Existing keys */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Active Keys</h2>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            Loading...
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Key size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.map((key) => (
              <div key={key._id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {key.label}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {key.keyPrefix}...
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {key.permissions.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 shrink-0">
                  {new Date(key.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={() => {
                    if (confirm("Revoke this API key?")) {
                      revokeMutation.mutate(key._id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
