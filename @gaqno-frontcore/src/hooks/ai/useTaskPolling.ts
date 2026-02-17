import { useQuery } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";

const POLL_INTERVAL_MS = 2000;

export function useTaskStatus(taskId: string | null) {
  return useQuery({
    queryKey: ["ai", "task-status", taskId],
    queryFn: () => aiApiClient.getTaskStatus(taskId!),
    enabled: Boolean(taskId),
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      if (
        data?.status === "completed" ||
        data?.status === "failed" ||
        data?.status === "error"
      ) {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });
}

export function useTaskPolling(taskId: string | null) {
  const query = useTaskStatus(taskId);
  const data = query.data as
    | { status?: string; result?: unknown; error?: string }
    | undefined;
  const taskStatus = data?.status ?? "idle";
  const taskError = data?.error ?? query.error;
  return {
    ...query,
    status: taskStatus,
    result: data?.result,
    error: taskError,
    isPolling:
      Boolean(taskId) &&
      query.isSuccess &&
      data?.status !== "completed" &&
      data?.status !== "failed" &&
      data?.status !== "error",
  };
}
