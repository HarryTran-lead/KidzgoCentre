/**
 * Hook to get current user information
 * Fetches user data from /api/auth/me endpoint
 */

import { useEffect, useState } from 'react';
import { getUserMe } from '@/lib/api/authService';
import type { UserMeApiResponse, UserProfile } from '@/types/auth';

export const CURRENT_USER_UPDATED_EVENT = 'kidzgo:current-user-updated';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  userName?: string;
  phoneNumber?: string;
  role: string;
  branchId?: string;
  branchName?: string;
  avatarUrl?: string;
  isActive: boolean;
  profiles?: UserProfile[];
  selectedProfile?: UserProfile;
}

const normalizeCurrentUserPayload = (payload: any): CurrentUser | null => {
  if (!payload || typeof payload !== 'object' || !('id' in payload)) {
    return null;
  }

  return {
    ...(payload as CurrentUser),
    fullName: payload.fullName ?? payload.displayName ?? payload.name ?? '',
    avatarUrl: payload.avatarUrl ?? payload.avatar ?? undefined,
  };
};

export function emitCurrentUserUpdated(payload: Partial<CurrentUser>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CURRENT_USER_UPDATED_EVENT, { detail: payload }));
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response: UserMeApiResponse = await getUserMe();

        if (response?.isSuccess === false || response?.success === false) {
          setError(response?.message || 'Failed to fetch user info');
          return;
        }

        const payload = (response as any)?.data?.data ?? (response as any)?.data ?? response;
        const normalizedUser = normalizeCurrentUserPayload(payload);
        if (normalizedUser) {
          setUser(normalizedUser);
        } else {
          setError(response?.message || 'Failed to fetch user info');
        }
      } catch (err: any) {
        console.error('Error fetching current user:', err);
        const detail = err?.response?.data?.detail ?? err?.response?.data?.message;
        setError(detail || err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const onUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<CurrentUser>>;
      const next = customEvent?.detail;
      if (!next || typeof next !== 'object') return;

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...next,
          fullName: next.fullName ?? prev.fullName,
          avatarUrl: next.avatarUrl ?? prev.avatarUrl,
        };
      });
    };

    window.addEventListener(CURRENT_USER_UPDATED_EVENT, onUserUpdated as EventListener);

    return () => {
      window.removeEventListener(CURRENT_USER_UPDATED_EVENT, onUserUpdated as EventListener);
    };
  }, []);

  return { user, isLoading, error };
}
