
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  databaseURL?: string;
}

let firebaseConfigValues: FirebaseConfig = {};
let configSource: string = "None";

// Check if running in a Firebase App Hosting environment (where configuration might be injected)
// or if NEXT_PUBLIC_ variables are available (common for client-side access in Next.js)

if (typeof window !== 'undefined' && (window as any).__FIREBASE_DEFERRED_APP_CONFIG__) {
  // Preferentially use config injected by App Hosting if available on the client (often for Hosting, might apply to App Hosting too)
  try {
    const deferredConfig = (window as any).__FIREBASE_DEFERRED_APP_CONFIG__;
    // Check if it's a promise or direct object
    if (typeof deferredConfig.then === 'function') {
      // It's a promise, handle it (though usually it's an object by the time scripts run)
      // This part might need adjustment based on how App Hosting actually injects it.
      // For now, assuming it might already be resolved or we won't await here.
      console.warn("__FIREBASE_DEFERRED_APP_CONFIG__ is a promise, direct usage might be tricky here.");
    } else {
      firebaseConfigValues = deferredConfig;
      configSource = "__FIREBASE_DEFERRED_APP_CONFIG__ (window)";
    }
  } catch (error) {
    console.error("Failed to parse __FIREBASE_DEFERRED_APP_CONFIG__ from window:", error);
  }
}

// If the window object didn't provide it, try process.env.FIREBASE_WEBAPP_CONFIG (more for build time)
// For client-side runtime, this is less likely to be directly available unless specifically exposed.
if (!firebaseConfigValues.apiKey && process.env.FIREBASE_WEBAPP_CONFIG) {
  try {
    firebaseConfigValues = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    configSource = "process.env.FIREBASE_WEBAPP_CONFIG";
  } catch (error) {
    console.error("Failed to parse FIREBASE_WEBAPP_CONFIG from process.env:", error);
  }
}

// If FIREBASE_WEBAPP_CONFIG wasn't available or parsing failed, or if we're in a context where NEXT_PUBLIC_ vars are primary
if (!firebaseConfigValues.apiKey) {
  configSource = "NEXT_PUBLIC_ environment variables";
  firebaseConfigValues = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

// console.log(`Firebase config loaded from: ${configSource}`);

// The warning message for missing API key
if (!firebaseConfigValues.apiKey) {
  console.error(
    "Firebase API Key is missing or not loaded. Ensure Firebase configuration is available. For local development, check your .env.local file. For App Hosting, ensure FIREBASE_WEBAPP_CONFIG is injected or individual NEXT_PUBLIC_ variables are set in the App Hosting environment configuration if you are not using the injected config."
  );
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;

if (!getApps().length) {
  if (firebaseConfigValues.apiKey && firebaseConfigValues.projectId) {
    app = initializeApp(firebaseConfigValues);
  } else {
    console.error("Critical Firebase configuration (apiKey or projectId) is missing. Firebase initialization might fail.");
    // Attempt anyway, it will likely throw a more specific error from Firebase SDK itself if truly broken.
    app = initializeApp(firebaseConfigValues as any);
  }
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== 'undefined' && firebaseConfigValues.measurementId && app) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized:", error);
  }
}

export { app, auth, db, analytics };
