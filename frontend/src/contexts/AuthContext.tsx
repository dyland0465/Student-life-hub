import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import type { Student } from '@/types';
import { detectError, determineErrorType, getErrorMessage } from '@/lib/errorDetection';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  studentProfile: Student | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, major: string, year: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  firebaseError: { type: string; message: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<{ type: string; message: string } | null>(null);

  async function register(
    email: string,
    password: string,
    name: string,
    major: string,
    year: number
  ) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create student profile in Firestore
      const studentData: Student = {
        id: user.uid,
        name,
        email,
        major,
        year,
        isPro: false,
      };

      await setDoc(doc(db, 'users', user.uid), studentData);
      setStudentProfile(studentData);
      setFirebaseError(null);
    } catch (error) {
      const errorType = determineErrorType(error);
      const errorMessage = getErrorMessage(error);
      setFirebaseError({ type: errorType, message: errorMessage });
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setFirebaseError(null);
    } catch (error) {
      const errorType = determineErrorType(error);
      const errorMessage = getErrorMessage(error);
      setFirebaseError({ type: errorType, message: errorMessage });
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create a basic profile for Google sign-in users
        const studentData: Student = {
          id: user.uid,
          name: user.displayName || 'Student',
          email: user.email || '',
          major: 'Undeclared',
          year: 1,
          isPro: false,
        };

        await setDoc(doc(db, 'users', user.uid), studentData);
        setStudentProfile(studentData);
      }
      setFirebaseError(null);
    } catch (error) {
      const errorType = determineErrorType(error);
      const errorMessage = getErrorMessage(error);
      setFirebaseError({ type: errorType, message: errorMessage });
      throw error;
    }
  }

  async function logout() {
    setStudentProfile(null);
    await signOut(auth);
  }

  async function loadStudentProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setStudentProfile(userDoc.data() as Student);
      }
      setFirebaseError(null);
    } catch (error) {
      console.error('Error loading student profile:', error);
      const errorType = determineErrorType(error);
      const errorMessage = getErrorMessage(error);
      setFirebaseError({ type: errorType, message: errorMessage });
    }
  }

  useEffect(() => {
    // Check Firebase connection on mount
    detectError().then((errorInfo) => {
      if (errorInfo) {
        setFirebaseError({ type: errorInfo.type, message: errorInfo.message });
        setLoading(false);
        return;
      }
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          setCurrentUser(user);
          if (user) {
            await loadStudentProfile(user.uid);
          } else {
            setStudentProfile(null);
          }
          setFirebaseError(null);
        } catch (error) {
          const errorType = determineErrorType(error);
          const errorMessage = getErrorMessage(error);
          setFirebaseError({ type: errorType, message: errorMessage });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        const errorType = determineErrorType(error);
        const errorMessage = getErrorMessage(error);
        setFirebaseError({ type: errorType, message: errorMessage });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    studentProfile,
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
    firebaseError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

