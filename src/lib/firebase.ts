
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
let configSource: string = "None (initial)";

// Log attempts to get config
console.log("[FirebaseInit] Attempting to load Firebase config...");

// 1. Try injected config (Primarily for Firebase Hosting, but App Hosting might use similar mechanism for Web Apps)
if (typeof window !== 'undefined' && (window as any).__FIREBASE_DEFERRED_APP_CONFIG__) {
  try {
    const deferredConfig = (window as any).__FIREBASE_DEFERRED_APP_CONFIG__;
    if (typeof deferredConfig.then === 'function') {
      console.warn("[FirebaseInit] __FIREBASE_DEFERRED_APP_CONFIG__ is a promise. This script expects it to be resolved.");
      // If it's a promise, this simple script won't await it. App Hosting should resolve it.
    } else {
      firebaseConfigValues = deferredConfig;
      configSource = "__FIREBASE_DEFERRED_APP_CONFIG__ (window)";
      console.log(`[FirebaseInit] Loaded config from ${configSource}`);
    }
  } catch (error) {
    console.error("[FirebaseInit] Failed to parse __FIREBASE_DEFERRED_APP_CONFIG__ from window:", error);
  }
} else {
  console.log("[FirebaseInit] __FIREBASE_DEFERRED_APP_CONFIG__ not found on window.");
}

// 2. Try FIREBASE_WEBAPP_CONFIG environment variable (Less likely for client-side runtime in App Hosting unless specifically exposed)
if (!firebaseConfigValues.apiKey && process.env.FIREBASE_WEBAPP_CONFIG) {
  console.log("[FirebaseInit] Attempting to load from process.env.FIREBASE_WEBAPP_CONFIG...");
  try {
    firebaseConfigValues = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    configSource = "process.env.FIREBASE_WEBAPP_CONFIG";
    console.log(`[FirebaseInit] Loaded config from ${configSource}`);
  } catch (error) {
    console.error("[FirebaseInit] Failed to parse FIREBASE_WEBAPP_CONFIG from process.env:", error);
  }
} else if (!firebaseConfigValues.apiKey) {
  console.log("[FirebaseInit] process.env.FIREBASE_WEBAPP_CONFIG not found or apiKey still missing.");
}

// 3. Fallback to individual NEXT_PUBLIC_ environment variables (Standard for Next.js)
if (!firebaseConfigValues.apiKey) {
  console.log("[FirebaseInit] Attempting to load from NEXT_PUBLIC_ environment variables...");
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
  console.log(`[FirebaseInit] Attempted to load config from ${configSource}. API Key found: ${!!firebaseConfigValues.apiKey}, Project ID found: ${!!firebaseConfigValues.projectId}`);
}

// Check if essential config values are present
if (!firebaseConfigValues.apiKey) {
  console.error(
    `[FirebaseInit - ERROR] Firebase API Key is missing or not loaded. Final config source tried: ${configSource}. Ensure Firebase configuration is available. For local development, check your .env.local file. For App Hosting, ensure FIREBASE_WEBAPP_CONFIG is injected or individual NEXT_PUBLIC_ variables are set in the App Hosting environment configuration if you are not using the injected config.`
  );
}
if (!firebaseConfigValues.projectId) {
   console.error(`[FirebaseInit - ERROR] Firebase Project ID is missing or not loaded. Final config source tried: ${configSource}.`);
}

if (!firebaseConfigValues.apiKey || !firebaseConfigValues.projectId) {
  console.error("[FirebaseInit - CRITICAL] Critical Firebase configuration (apiKey or projectId) is missing. Firebase initialization might fail or use incorrect project.");
} else {
  console.log(`[FirebaseInit] Proceeding with Firebase initialization. Config source: ${configSource}. Project ID: ${firebaseConfigValues.projectId}`);
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | undefined;

if (!getApps().length) {
  app = initializeApp(firebaseConfigValues);
} else {
  app = getApps()[0]!;
}

auth = getAuth(app);
db = getFirestore(app);

if (typeof window !== 'undefined' && firebaseConfigValues.measurementId && app && app.options.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("[FirebaseInit] Firebase Analytics could not be initialized:", error);
  }
} else if (typeof window !== 'undefined' && !firebaseConfigValues.measurementId) {
    console.log("[FirebaseInit] Firebase Analytics not initialized because measurementId is missing in config.");
}


export { app, auth, db, analytics };
    