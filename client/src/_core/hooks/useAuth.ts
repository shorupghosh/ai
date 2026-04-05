
type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  return {
    user: { name: 'Admin', role: 'admin', email: 'admin@local.dev' },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => {},
    logout: async () => {},
  };
}
