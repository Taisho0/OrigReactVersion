import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userAuth } from "../auth/AuthContext";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(""); 

    const {session, signUpNewUser} = userAuth();
    const navigate =  useNavigate();
    console.log(session);
    console.log(email, password);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result =  await signUpNewUser({email, password, tagname});
            if (result.success) {
                console.log("User signed up successfully:", result.data);
                navigate("/homepage");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
    <div>    
        <form onSubmit={handleSignUp} className="max-w-md m-auto pt-24">
            <h2 className="font-bold pb-2">Sign Up</h2> 
            <p>
                Already have an account? 
                <Link to="/signin" className="text-blue-500">
                    Sign in here!
                </Link>
            </p>

            {/* inputs */}
            <div className="flex flex-col py-4">
                <input onChange={(e) => setEmail(e.target.value)} className="p-3 mt-2" type="email" required placeholder="Email" />
                <input onChange={(e) => setPassword(e.target.value)} className="p-3 mt-2" type="password" required placeholder="Password" />
                <button className="mt-2" type="submit" disabled={loading} >
                    Sign up
                </button>
                {error && <p className="text-red-600 text-center mt-4">{error}</p>}
            </div>
        </form>
    </div>
    );
};

export default SignUp;