import admin from 'firebase-admin';

// Re-use the existing app if it's already initialized
export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccount) {
    try {
      const cert = JSON.parse(serviceAccount);
      return admin.initializeApp({
        credential: admin.credential.cert(cert)
      });
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  }

  // Fallback to default credentials (works on GCP)
  return admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}
