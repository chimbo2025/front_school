const TOKEN_KEY = 'schoolportal_access_token';
const REFRESH_KEY = 'schoolportal_refresh_token';
const USER_KEY = 'schoolportal_user';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const authService = {
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  async login(username: string, password: string): Promise<{ tokens: AuthTokens; user: User }> {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid credentials');
    }

    const tokens = await res.json();
    this.setTokens(tokens);

    // Fetch user profile
    const user = await this.fetchUserProfile(tokens.access);
    this.setUser(user);

    return { tokens, user };
  },

  async fetchUserProfile(accessToken: string): Promise<User> {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return res.json();
  },

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      this.clear();
      return null;
    }

    const { access } = await res.json();
    localStorage.setItem(TOKEN_KEY, access);
    return access;
  },

  getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  let accessToken = authService.getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let res = await fetch(fullUrl, { ...options, headers });

  if (res.status === 401) {
    const newToken = await authService.refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(fullUrl, { ...options, headers });
    } else {
      authService.clear();
      window.location.href = '/login';
    }
  }

  return res;
};