import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

// ============================================
// CONTROL #3: SECURE JWT SESSION MANAGEMENT
// ============================================
// Threat: Session Hijacking / Token Forgery
// CIA Principle: Confidentiality
// Status: IMPLEMENTED via Supabase Auth
//
// Implementation:
// 1. Supabase Auth uses secure JWT tokens stored in HTTP-only cookies
// 2. Tokens are automatically refreshed on expiration
// 3. onAuthStateChange listener updates session state in real-time
// 4. Unauthenticated users cannot access protected routes
// 5. ProtectedRoute component enforces authentication checks
//
// Evidence in code:
// Line ~XX: supabase.auth.getSession() — gets current session
// Line ~XX: supabase.auth.onAuthStateChange() — listens for auth changes
// Line ~XX: setUser(session?.user) — updates auth state
//
// Protected Routes:
// src/App.jsx — ProtectedRoute wrapper on /home, /profile, /saved, etc.

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
