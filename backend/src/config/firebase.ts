import admin from 'firebase-admin';

export function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin already initialized');
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️  Firebase Admin credentials not found. Running in demo mode.');
      console.warn('   AI features will work with mock data only.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    console.warn('   Running in demo mode. AI features will use mock data.');
  }
}

export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken | null> => {
  try {
    if (admin.apps.length === 0) {
      console.warn('Firebase Admin not initialized. Skipping token verification.');
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
};

export default admin;

