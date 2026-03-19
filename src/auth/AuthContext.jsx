import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../config/supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined); 

  //Sign Up
  const signUpNewUser = async (email, password) => {
    const {data, error} = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Error signing up:", error);
      return {success: false, error: error.message};
    }

    const identities = data?.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      return {success: false, error: "This email is already registered. Please sign in instead."};
    }

    return {success: true, data};
  };

  //Sign In
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        console.error("Error signing in:", error);
        return {success: false, error: error.message};
      }
      console.log("sign-in success", data);
      return {success: true, data};
    } catch (error) {
      console.error("Error signing in:", error);
      return {success: false, error: error.message || "Unable to sign in."};
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  //Sign Out
  const signOut = async () => {
    const { error } =  await supabase.auth.signOut();
    if(error){
      console.error("Error signing out:", error);
      return {success: false, error: error.message || "Unable to sign out."};
    }

    return {success: true};
  };
  
  return(
    <AuthContext.Provider value={{session, signUpNewUser, signInUser, signOut}}>
      {children}
    </AuthContext.Provider>
  );
};

export const userAuth = () => {
  return useContext(AuthContext);
};