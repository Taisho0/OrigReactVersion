import { createContext, useEffect, useState, useContext } from "react";
// import { supabase } from "../config/supabaseClient";
import { app } from "../config/FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

const AuthContext = createContext();

const mapFirebaseAuthError = (error) => {
  const code = error?.code;

  if (code === "auth/invalid-credential") {
    return "Invalid email or password.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Email/password sign-in is disabled in Firebase. Enable it in Firebase Console > Authentication > Sign-in method.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please sign in instead.";
  }

  if (code === "auth/weak-password") {
    return "Password is too weak. Use at least 6 characters.";
  }

  if (code === "auth/email-not-verified") {
    return "Please verify your email before signing in.";
  }

  return error?.message || "Authentication failed.";
};

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const auth = getAuth(app);

  //Sign Up
  const signUpNewUser = async (email, password) => {
    try {
      const data = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(data.user);
      await firebaseSignOut(auth);

      return {
        success: true,
        data,
        requiresEmailVerification: true,
        message: "Account created. Please verify your email, then sign in.",
      };
    } catch (error) {
      console.error("Error signing up:", error);
      return { success: false, error: mapFirebaseAuthError(error), code: error?.code };
    }

  };

  //Sign In
  const signInUser = async (email, password) => {
    try {
      const data = await signInWithEmailAndPassword(auth, email, password);
      await reload(data.user);

      console.log("sign-in success", data);
      return { success: true, data };
    } catch (error) {
      console.error("Error signing in:", error);
      return { success: false, error: mapFirebaseAuthError(error), code: error?.code };
    }
  };

  const checkEmailVerification = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return { success: false, verified: false, error: "No active user session." };
      }

      await reload(currentUser);

      if (currentUser.emailVerified) {
        setSession(currentUser);
        return { success: true, verified: true };
      }

      return { success: true, verified: false };
    } catch (error) {
      console.error("Error checking email verification:", error);
      return { success: false, verified: false, error: mapFirebaseAuthError(error), code: error?.code };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setSession(null);
          setAuthReady(true);
          return;
        }

        await reload(user);
        setSession(user);
        setAuthReady(true);
      },
      (error) => {
        console.error("Error getting auth state:", error);
        setSession(null);
        setAuthReady(true);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  //Sign Out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      return { success: false, error: error.message || "Unable to sign out." };
    }
    
  };
  
  return (
    <AuthContext.Provider value={{ session, authReady, signUpNewUser, signInUser, checkEmailVerification, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const userAuth = () => {
  return useContext(AuthContext);
};