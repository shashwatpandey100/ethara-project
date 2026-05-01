"use client";

import { useEffect, useState, useRef } from "react";
import { getStandups, confirmStandupTasks, deleteStandup } from "@/lib/api/standups";
import type { Standup, ExtractedTask } from "@/lib/api/standups";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mic, Loader2, CheckCircle2, XCircle, Clock, Trash2,
  ChevronDown, ChevronUp, Ellipsis,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/relative-time";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecordStandupDialog } from "./record-standup-dialog";

interface StandupsPanelProps {
  projectId: string;
  isAdmin: boolean;
  onTasksCreated: () => void;
}

export function StandupsPanel({ projectId, isAdmin, onTasksCreated }: StandupsPanelProps) {
  const [standups, setStandups] = useState<Standup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStandups = async () => {
    try {
      const res = await getStandups(projectId);
      setStandups(res.data);
    } catch {
      console.error("Failed to fetch standups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStandups();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [projectId]);

  useEffect(() => {
    const processing = standups.some((s) => s.status === "processing");
    if (processing) {
      pollRef.current = setInterval(fetchStandups, 5000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [standups]);

  const handleDelete = async (standupId: string) => {
    try {
      await deleteStandup(projectId, standupId);
      toast.success("Standup deleted");
      fetchStandups();
    } catch {
      toast.error("Failed to delete standup");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Record dialog ── */}
      {isAdmin && (
        <RecordStandupDialog
          open={recordDialogOpen}
          onOpenChange={setRecordDialogOpen}
          projectId={projectId}
          onSuccess={fetchStandups}
        />
      )}

      {/* ── History ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">
            Standup History
          </h2>
          {isAdmin && (
            <Button size="sm" onClick={() => setRecordDialogOpen(true)}>
              <Mic size={13} />
              Record Standup
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-gray-50 p-3.5">
                <Skeleton className="h-7 w-7 rounded-full bg-gray-200/70" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2 bg-gray-200/70" />
                  <Skeleton className="h-3 w-1/3 bg-gray-200/70" />
                </div>
                <Skeleton className="h-6 w-20 bg-gray-200/70" />
                <Skeleton className="h-7 w-7 bg-gray-200/70" />
              </div>
            ))}
          </div>
        ) : standups.length === 0 ? (
          <div className="rounded-lg bg-gray-100 px-12 py-32 text-center">
            <Mic size={28} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-[15px] font-semibold text-gray-700">No standups yet</h3>
            <p className="mt-1 text-sm text-gray-400">
              Record your first voice standup above to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate" style={{ borderSpacing: "0 2px" }}>
              <thead className="sr-only">
                <tr><th /><th /><th /><th /></tr>
              </thead>
              <tbody>
                {standups.map((standup) => {
                  const isExp = expanded === standup.id;
                  const extractedCount = standup.extractedTasks?.tasks?.length ?? 0;
                  return (
                    <>
                      <tr
                        key={standup.id}
                        onClick={() => setExpanded(isExp ? null : standup.id)}
                        className="group cursor-pointer"
                      >
                        {/* Status icon */}
                        <td className={`w-[1%] rounded-l-xl py-3 pl-4 align-middle ${isExp ? "bg-blue-50" : "bg-white group-hover:bg-gray-100"}`}>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                            {standup.status === "completed" && <CheckCircle2 size={15} className="text-green-500" />}
                            {standup.status === "processing" && <Clock size={15} className="text-yellow-500" />}
                            {standup.status === "failed" && <XCircle size={15} className="text-red-500" />}
                          </div>
                        </td>

                        {/* Title + date */}
                        <td className={`px-4 py-3 align-middle ${isExp ? "bg-blue-50" : "bg-white group-hover:bg-gray-100"}`}>
                          <div className="text-sm font-semibold text-[#141414]">{standup.title}</div>
                          <div className="text-xs text-gray-400" suppressHydrationWarning>
                            {formatRelativeTime(standup.createdAt)}
                            {standup.status === "processing" && " · Processing…"}
                          </div>
                        </td>

                        {/* Task badge */}
                        <td className={`px-4 py-3 align-middle whitespace-nowrap ${isExp ? "bg-blue-50" : "bg-white group-hover:bg-gray-100"}`}>
                          {standup.status === "completed" && extractedCount > 0 && (
                            <span className="rounded-md bg-gray-900 px-2 py-1 text-[12px] font-medium text-white">
                              {extractedCount} {extractedCount === 1 ? "Task" : "Tasks"}
                            </span>
                          )}
                        </td>

                        {/* Expand + actions */}
                        <td
                          className={`rounded-r-xl px-4 py-3 text-right align-middle whitespace-nowrap ${isExp ? "bg-blue-50" : "bg-white group-hover:bg-gray-100"}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setExpanded(isExp ? null : standup.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                              {isExp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-7 w-7">
                                    <Ellipsis className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-28">
                                  <DropdownMenuItem
                                    className="text-red-700 hover:bg-red-800! hover:text-white!"
                                    onClick={() => handleDelete(standup.id)}
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExp && standup.status === "completed" && (
                        <tr key={`${standup.id}-detail`}>
                          <td colSpan={4} className="px-4 pb-3">
                            <StandupDetail
                              standup={standup}
                              projectId={projectId}
                              isAdmin={isAdmin}
                              onTasksConfirmed={() => { onTasksCreated(); fetchStandups(); }}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StandupDetail({
  standup,
  projectId,
  isAdmin,
  onTasksConfirmed,
}: {
  standup: Standup;
  projectId: string;
  isAdmin: boolean;
  onTasksConfirmed: () => void;
}) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const extractedTasks = standup.extractedTasks?.tasks ?? [];

  const toggleTask = (i: number) =>
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleConfirm = async () => {
    const toCreate = Array.from(selectedTasks).map((i) => extractedTasks[i]);
    if (!toCreate.length) return;
    setConfirming(true);
    try {
      await confirmStandupTasks(projectId, standup.id, toCreate);
      toast.success(`${toCreate.length} task${toCreate.length !== 1 ? "s" : ""} created!`);
      setSelectedTasks(new Set());
      onTasksConfirmed();
    } catch {
      toast.error("Failed to create tasks");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="rounded-b-xl border border-t-0 bg-white overflow-hidden">
      {/* AI Summary */}
      {standup.summary && (
        <div className="px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            AI Summary
          </p>
          <div
            className="standup-summary text-[14px] text-gray-700"
            dangerouslySetInnerHTML={{ __html: standup.summary }}
          />
          <style>{`
            .standup-summary h2 { display: none; }
            .standup-summary h3 {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #6b7280;
              margin-top: 16px;
              margin-bottom: 6px;
            }
            .standup-summary h3:first-of-type { margin-top: 0; }
            .standup-summary ul {
              list-style: none;
              padding: 0;
              margin: 0;
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .standup-summary li {
              display: flex;
              align-items: flex-start;
              gap: 8px;
              font-size: 13px;
              color: #374151;
              line-height: 1.5;
            }
            .standup-summary li::before {
              content: '';
              display: inline-block;
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background: #9ca3af;
              margin-top: 7px;
              flex-shrink: 0;
            }
            .standup-summary p {
              font-size: 13px;
              color: #6b7280;
              font-style: italic;
              margin: 0;
            }
          `}</style>
        </div>
      )}

      {/* Extracted Tasks */}
      {extractedTasks.length > 0 && isAdmin && (
        <div className="border-t px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Extracted Tasks ({extractedTasks.length})
            </p>
            <Button
              size="sm"
              disabled={selectedTasks.size === 0 || confirming}
              onClick={handleConfirm}
            >
              {confirming && <Loader2 size={12} className="animate-spin" />}
              Create {selectedTasks.size > 0 ? selectedTasks.size : ""} Selected
            </Button>
          </div>
          <div className="space-y-2">
            {extractedTasks.map((task, i) => (
              <div
                key={i}
                onClick={() => toggleTask(i)}
                className="flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-3 hover:bg-gray-100"
              >
                <Checkbox
                  checked={selectedTasks.has(i)}
                  onCheckedChange={() => toggleTask(i)}
                  className="mt-0.5 bg-white shadow-none"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141414]">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-500">{task.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                      {task.priority}
                    </span>
                    {task.suggestedAssignee && (
                      <span className="text-xs text-gray-400">→ {task.suggestedAssignee}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {standup.transcript && (
        <div className="border-t px-4 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Transcript
          </p>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-gray-500">
            {standup.transcript}
          </pre>
        </div>
      )}
    </div>
  );
}
