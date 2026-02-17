import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";
import type { GenerateVideoFromTemplateBody } from "../../utils/api";

export function useVideoModels() {
  return useQuery({
    queryKey: ["ai", "video-models"],
    queryFn: () => aiApiClient.getVideoModels(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVideoTemplates() {
  return useQuery({
    queryKey: ["ai", "video-templates"],
    queryFn: () => aiApiClient.getVideoTemplates(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVideoStatus(videoId: string) {
  return useQuery({
    queryKey: ["ai", "video-generation", videoId],
    queryFn: () => aiApiClient.getVideoStatus(videoId),
    enabled: !!videoId,
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000;
    },
  });
}

export function useVideoGenerateFromTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateVideoFromTemplateBody) =>
      aiApiClient.generateVideoFromTemplate(body),
    onSuccess: (data: { id?: string }) => {
      if (data?.id) {
        queryClient.setQueryData(["ai", "video-generation", data.id], data);
      }
    },
  });
}

export function useVideoGeneration() {
  const generateFromTemplate = useVideoGenerateFromTemplateMutation();
  return {
    generateFromTemplate,
    useVideoStatus,
  };
}
