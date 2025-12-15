import { auth, db } from './firebase';
import { getDoc, doc } from 'firebase/firestore';

export type ErrorType = 'firebase' | 'network' | 'server' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
}

/**
 * Checks if Firebase services are accessible
 */
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    // Try to access Firebase Auth
    if (!auth) {
      return false;
    }

    // Check if db is initialized
    if (!db) {
      return false;
    }

    // Try a simple Firestore read operation
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase connection timeout')), 5000)
    );

    const checkPromise = getDoc(doc(db, '_health', 'check'))
      .then(() => true)
      .catch((error) => {

        const errorMessage = error?.message?.toLowerCase() || '';
        if (
          errorMessage.includes('permission') ||
          errorMessage.includes('missing') ||
          errorMessage.includes('not found')
        ) {
          return true;
        }
        throw error;
      });

    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
}

/**
 * Checks if there's a network connection
 */
export function checkNetworkConnection(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.onLine;
}

/**
 * Determines the error type from an error object
 */
export function determineErrorType(error: Error | unknown): ErrorType {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorName.includes('network') ||
    !navigator.onLine
  ) {
    return 'network';
  }

  // Firebase-specific errors
  if (
    errorMessage.includes('firebase') ||
    errorMessage.includes('auth') ||
    errorMessage.includes('firestore') ||
    errorMessage.includes('permission-denied') ||
    errorMessage.includes('unavailable') ||
    errorName.includes('firebase')
  ) {
    return 'firebase';
  }

  // Server errors (5xx)
  if (
    errorMessage.includes('server') ||
    errorMessage.includes('500') ||
    errorMessage.includes('503') ||
    errorMessage.includes('502')
  ) {
    return 'server';
  }

  return 'unknown';
}

/**
 * Gets a user-friendly error message
 */
export function getErrorMessage(error: Error | unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred';
  }

  // Return a more user-friendly message
  const errorType = determineErrorType(error);
  
  switch (errorType) {
    case 'firebase':
      return 'Unable to connect to Firebase services. Please check your connection and try again.';
    case 'network':
      return 'Network connection error. Please check your internet connection.';
    case 'server':
      return 'Server error. Our services may be temporarily unavailable.';
    default:
      return error.message || 'An unexpected error occurred';
  }
}

/**
 * Error detection and classification
 */
export async function detectError(): Promise<ErrorInfo | null> {
  // First check network
  if (!checkNetworkConnection()) {
    return {
      type: 'network',
      message: 'No internet connection detected',
    };
  }

  // Then check Firebase
  const isFirebaseConnected = await checkFirebaseConnection();
  if (!isFirebaseConnected) {
    return {
      type: 'firebase',
      message: 'Firebase services are not accessible',
    };
  }

  return null;
}

