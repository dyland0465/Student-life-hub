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

interface AuthContextType {
  currentUser: FirebaseUser | null;
  studentProfile: Student | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, major: string, year: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
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

  async function register(
    email: string,
    password: string,
    name: string,
    major: string,
    year: number
  ) {
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
    };

    await setDoc(doc(db, 'users', user.uid), studentData);
    setStudentProfile(studentData);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
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
      };

      await setDoc(doc(db, 'users', user.uid), studentData);
      setStudentProfile(studentData);
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
    } catch (error) {
      console.error('Error loading student profile:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadStudentProfile(user.uid);
      } else {
        setStudentProfile(null);
      }
      setLoading(false);
    });

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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

