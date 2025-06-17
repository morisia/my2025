import admin from 'firebase-admin';

// Ensure this is only initialized once
if (!admin.apps.length) {
  // If GOOGLE_APPLICATION_CREDENTIALS environment variable is set (e.g., in Cloud Functions, Cloud Run),
  // it will be used automatically.
  // For local development, you'd set this environment variable to point to your service account key file.
  // Alternatively, you can explicitly pass serviceAccount credentials here if needed,
  // but using ADC is generally preferred for Google Cloud environments.
  admin.initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
