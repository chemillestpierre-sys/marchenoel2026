import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured, translateFirebaseError } from '../lib/firebase';
import { checkIsAdmin, subscribeInscriptions } from '../services/firestoreService';
import type { Inscription } from '../types';

interface AppContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminChecking: boolean;
  inscriptions: Inscription[];
  inscriptionsLoading: boolean;
  inscriptionsError: string | null;
  firebaseReady: boolean;
  refreshAdminStatus: () => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(!isFirebaseConfigured);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminChecking, setAdminChecking] = useState<boolean>(false);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [inscriptionsLoading, setInscriptionsLoading] = useState<boolean>(isFirebaseConfigured);
  const [inscriptionsError, setInscriptionsError] = useState<string | null>(null);

  const evaluateAdmin = async (currentUser: User | null): Promise<boolean> => {
    if (!currentUser || currentUser.isAnonymous || !isFirebaseConfigured) {
      setIsAdmin(false);
      return false;
    }
    setAdminChecking(true);
    try {
      const ok = await checkIsAdmin(currentUser.uid);
      setIsAdmin(ok);
      return ok;
    } catch {
      setIsAdmin(false);
      return false;
    } finally {
      setAdminChecking(false);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthReady(true);
      setInscriptionsLoading(false);
      return;
    }

    const authInstance = auth;
    const unsubscribeAuth = onAuthStateChanged(authInstance, async (nextUser) => {
      if (!nextUser) {
        try {
          await signInAnonymously(authInstance);
          return;
        } catch {
          setUser(null);
          setIsAdmin(false);
          setAuthReady(true);
          return;
        }
      }
      setUser(nextUser);
      await evaluateAdmin(nextUser);
      setAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    setInscriptionsLoading(true);
    const unsubscribe = subscribeInscriptions(
      (items) => {
        setInscriptions(items);
        setInscriptionsError(null);
        setInscriptionsLoading(false);
      },
      (err) => {
        setInscriptionsError(translateFirebaseError(err));
        setInscriptionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshAdminStatus = async () => evaluateAdmin(user);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authReady,
      isAdmin,
      adminChecking,
      inscriptions,
      inscriptionsLoading,
      inscriptionsError,
      firebaseReady: isFirebaseConfigured,
      refreshAdminStatus,
    }),
    [user, authReady, isAdmin, adminChecking, inscriptions, inscriptionsLoading, inscriptionsError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext doit être utilisé dans un AppProvider.');
  }
  return ctx;
}
