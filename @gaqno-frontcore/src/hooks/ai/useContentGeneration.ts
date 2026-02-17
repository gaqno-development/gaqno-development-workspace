import { useMutation } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";
import type { GenerateContentRequest } from "../../utils/api";

export function useContentGeneration() {
  return useMutation({
    mutationFn: (request: GenerateContentRequest) =>
      aiApiClient.generateProductContent(request),
  });
}
