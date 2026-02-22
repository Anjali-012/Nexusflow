"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Workflow, Clock } from "lucide-react";

interface Workflow {
  _id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused" | "archived";
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data } = await api.get("/workflows");
      setWorkflows(data.workflows);
    } catch {
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    try {
      const { data } = await api.post("/workflows", {
        name: "Untitled Workflow",
        description: "",
        trigger: { type: "manual", config: {} },
      });
      router.push(`/designer/${data.workflow._id}`);
    } catch {
      toast.error("Failed to create workflow");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-slate-100 text-slate-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="text-slate-500 text-sm mt-1">
            Build and manage your automations
          </p>
        </div>
        <Button onClick={createWorkflow} className="flex items-center gap-2">
          <Plus size={16} />
          New Workflow
        </Button>
      </div>

      {/* Workflow list */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20">
          <Workflow size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">
            No workflows yet
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Create your first workflow to get started
          </p>
          <Button onClick={createWorkflow} className="mt-4">
            <Plus size={16} className="mr-2" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <Card
              key={workflow._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/designer/${workflow._id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold">
                    {workflow.name}
                  </CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(workflow.status)}`}
                  >
                    {workflow.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-3">
                  {workflow.description || "No description"}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(workflow.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
