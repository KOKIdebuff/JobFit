import { useQuery } from "@tanstack/react-query";

import { authService } from "@/lib/auth/service";

export const authQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: authService.me,
    retry: false,
    staleTime: 30_000,
  });

  return {
    ...query,
    user: query.data?.user ?? null,
    authenticated: Boolean(query.data?.user),
  };
}
