"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true);
    });

    // If already hydrated (persist finished before this effect ran)
    if (useAuthStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setReady(true);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <a
          href="/dashboard"
          className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
        >
          NexusFlow
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Workflows
          </a>
          <a
            href="/history"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            History
          </a>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
