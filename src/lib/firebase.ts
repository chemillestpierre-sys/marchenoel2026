import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.startsWith('VOTRE_') &&
    !firebaseConfig.projectId.startsWith('votre-')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

export async function ensureParentSession(): Promise<string> {
  if (!auth) {
    throw new Error("La connexion à la base de données n'est pas encore configurée.");
  }
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

export function translateFirebaseError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Ce créneau vient d'être complété")) {
      return error.message;
    }
    if (error.message.includes("n'est pas encore configurée")) {
      return error.message;
    }
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives de connexion. Merci de patienter quelques minutes avant de réessayer.';
    case 'permission-denied':
      return "Vous n'avez pas l'autorisation d'effectuer cette action.";
    case 'auth/operation-not-allowed':
      return "La connexion anonyme ou par e-mail n'est pas activée dans Firebase Authentication.";
    default:
      return "Une erreur est survenue lors de l'enregistrement. Merci de vérifier votre connexion et de réessayer.";
  }
}
