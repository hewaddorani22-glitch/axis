"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  plan: "free" | "pro";
  onboarding_done: boolean;
  user_type: string | null;
  timezone: string;
  prove_it_username: string | null;
  prove_it_bio: string | null;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      setUser(profile as UserProfile);
    } else {
      // Create profile if doesn't exist (first login via OAuth)
      const { data: newProfile } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
        })
        .select()
        .single();
      setUser(newProfile as UserProfile);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, [fetchUser, supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (data) setUser(data as UserProfile);
  };

  return { user, loading, signOut, updateProfile, refetch: fetchUser };
}
