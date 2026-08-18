"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService, type UserSyncPayload } from "@/services/auth-service";

/**
 * Custom hook to synchronize the Clerk authenticated user with the local DB.
 * Runs automatically when Clerk load completes and a user signs in.
 */
export function useUserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isSynced, setIsSynced] = useState(false);
  const syncAttemptedRef = useRef(false);

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (payload: UserSyncPayload) =>
      authService.syncUser(payload, getToken),
    onSuccess: (data) => {
      // Invalidate queries that might depend on current user
      queryClient.setQueryData(["currentUserProfile"], data);
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      setIsSynced(true);
    },
    onError: (error) => {
      console.error("User synchronization failed:", error);
      toast.error("Failed to sync user profile with server.");
    },
  });

  // Query to fetch profile (once synced)
  const profileQuery = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: () => authService.getMe(getToken),
    enabled: Boolean(isSignedIn && isLoaded && isSynced),
    retry: 1,
  });

  useEffect(() => {
    // Only sync if Clerk is loaded, user is signed in, and we haven't initiated sync in this component lifecycle
    if (isLoaded && isSignedIn && user && !syncAttemptedRef.current && !syncMutation.isPending) {
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) {
        syncAttemptedRef.current = true;
        const payload: UserSyncPayload = {
          clerk_id: user.id,
          email: email,
          full_name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
          avatar_url: user.imageUrl || null,
        };
        syncMutation.mutate(payload);
      }
    }
  }, [isLoaded, isSignedIn, user, syncMutation]);

  return {
    isSyncing: syncMutation.isPending,
    isSynced: isSynced || Boolean(profileQuery.data),
    profile: profileQuery.data || null,
    error: syncMutation.error || profileQuery.error,
  };
}
