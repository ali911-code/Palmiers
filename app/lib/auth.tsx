"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "./supabase";

export type Role = "student" | "teacher" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  classeId?: string;
  teacherId?: string;
};

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    profile: { name: string; role: Role; classeId?: string; teacherId?: string }
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(id: string, email: string): Promise<User | null> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      return { id, email, name: "", role: "student" };
    }
    return {
      id,
      email,
      name: data.name ?? "",
      role: (data.role ?? "student") as Role,
      classeId: data.classe_id ?? undefined,
      teacherId: data.teacher_id ?? undefined,
    };
  } catch {
    return { id, email, name: "", role: "student" };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Fallback : si Supabase traîne ou plante, on affiche l'app quand même
    const timeout = setTimeout(() => setReady(true), 5000);

    // Check existing session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email ?? "");
          setUser(profile);
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => {
        clearTimeout(timeout);
        setReady(true);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          return;
        }
        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email ?? "");
          setUser(profile);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<{ error: { message: string } }>((resolve) =>
          setTimeout(
            () => resolve({ error: { message: "Serveur lent ou indisponible (Supabase en pause ?). Réessaie dans 1 min." } }),
            15000
          )
        ),
      ]);
      if (result.error) return result.error.message;
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Erreur de connexion";
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    profile: { name: string; role: Role; classeId?: string; teacherId?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: profile.name, role: profile.role },
      },
    });
    if (error) return error.message;
    if (!data.user) return "Erreur lors de la création du compte.";

    // Upsert profile (trigger may have already created it)
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name: profile.name,
      role: profile.role,
      classe_id: profile.classeId ?? null,
      teacher_id: profile.teacherId ?? null,
    });
    if (profileError) return profileError.message;

    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut }),
    [user, ready, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
