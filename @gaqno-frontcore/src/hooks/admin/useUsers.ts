import { useApiQuery } from "../useApiQuery";
import { ssoAxiosClient } from "../../utils/api/sso-client";

export interface IUserListItem {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  tenantId?: string | null;
}

export function useUsers(_tenantId?: string | null, _search?: string | null) {
  const { data: users = [], isLoading } = useApiQuery<IUserListItem[]>(
    ssoAxiosClient,
    ["users", _tenantId ?? "", _search ?? ""],
    async () => {
      const params: Record<string, string> = {};
      if (_tenantId) params.orgId = _tenantId;
      if (_search) params.search = _search;
      const response = await ssoAxiosClient.get<IUserListItem[]>("/users", {
        params,
      });
      const raw = (response.data ?? []) as unknown as Record<string, unknown>[];
      return raw.map((u) => ({
        id: String(u.id),
        email: u.email != null ? String(u.email) : undefined,
        firstName:
          (u.firstName ?? u.first_name) != null
            ? String(u.firstName ?? u.first_name)
            : null,
        lastName:
          (u.lastName ?? u.last_name) != null
            ? String(u.lastName ?? u.last_name)
            : null,
        tenantId:
          (u.tenantId ?? u.tenant_id) != null
            ? String(u.tenantId ?? u.tenant_id)
            : null,
      }));
    },
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  return { users, isLoading };
}
