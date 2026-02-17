import { useMutation } from "@tanstack/react-query";
import { aiApiClient } from "../../utils/api";
import type { BuildProductProfileRequest } from "../../utils/api";

export function useProductProfile() {
  return useMutation({
    mutationFn: (request: BuildProductProfileRequest) =>
      aiApiClient.buildProductProfile(request),
  });
}
