/**
 * Hook to get current user information
 * Fetches user data from /api/auth/me endpoint
 */

import { useEffect, useState } from 'react';
import { getUserMe } from '@/lib/api/authService';
import type { UserMeApiResponse } from '@/types/auth';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
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
        
        if ((response.isSuccess || response.success) && response.data) {
          setUser(response.data);
        } else {
          setError(response.message || 'Failed to fetch user info');
        }
      } catch (err: any) {
        console.error('Error fetching current user:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isLoading, error };
}
