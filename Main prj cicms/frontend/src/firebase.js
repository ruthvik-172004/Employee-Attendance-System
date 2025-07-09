// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";

// Your web app's Firebase configuration
// Replace these values with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvQ32ErM4s5yhTn27Q0h0ONtcY8R4czAM",
  authDomain: "face-498db.firebaseapp.com",
  projectId: "face-498db",
  storageBucket: "face-498db.firebasestorage.app",
  messagingSenderId: "625287261391",
  appId: "1:625287261391:web:dc06ecbcbbe0cfdbafdbba",
  measurementId: "G-QCX4DH54LG"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firestore and Storage services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize and export Firebase Authentication service
export const auth = getAuth(app);

// Helper function: Sign in with email and password
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Helper function: Send password reset email
export const sendPasswordResetEmailToUser = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper function: Confirm password reset with code and new password
export const confirmPasswordResetWithCode = async (oobCode, newPassword) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
