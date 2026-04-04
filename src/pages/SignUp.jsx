import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userAuth } from "../auth/AuthContext";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { app } from "../config/FirebaseConfig";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false); 

    const {session, signUpNewUser} = userAuth();
    const db = getFirestore(app);
    const navigate =  useNavigate();

    const normalizePhone = (value) => {
        const digitsOnly = value.replace(/\D/g, "");

        if (digitsOnly.startsWith("09") && digitsOnly.length === 11) {
            return `+63${digitsOnly.slice(1)}`;
        }

        if (digitsOnly.startsWith("639") && digitsOnly.length === 12) {
            return `+${digitsOnly}`;
        }

        if (digitsOnly.startsWith("9") && digitsOnly.length === 10) {
            return `+63${digitsOnly}`;
        }

        return null;
    };

    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const strengthScore = Object.values(validations).filter(Boolean).length;
    const isPasswordValid = Object.values(validations).every(Boolean);
    const normalizedPhone = normalizePhone(phone);
    const isPhoneValid = normalizedPhone !== null;
    const doPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const isFormValid = isPasswordValid && isPhoneValid && doPasswordsMatch;

    let strengthText = "";
    let strengthClassName = "";

    if (password.length > 0) {
        if (strengthScore === 5) {
            strengthText = "Strong";
            strengthClassName = "text-green-400";
        } else if (strengthScore >= 3) {
            strengthText = "Moderate";
            strengthClassName = "text-yellow-300";
        } else {
            strengthText = "Weak";
            strengthClassName = "text-red-400";
        }
    }

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!isPhoneValid) {
            setError("Please enter a valid PH phone number (09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX, or +639XXXXXXXXX).");
            return;
        }

        if (!isFormValid) {
            setError("Please ensure all fields are correct and password requirements are met.");
            return;
        }

        setLoading(true);
        try {
            const result =  await signUpNewUser(email, password);
            if (result.success) {
                const uid = result?.data?.user?.uid;
                const safePhone = normalizedPhone || phone;

                // Do not block redirect if profile write is slow or fails.
                if (uid) {
                    setDoc(
                        doc(db, "users", uid),
                        {
                            email,
                            phone: safePhone,
                        },
                        { merge: true },
                    ).catch((writeError) => {
                        console.error("Unable to save profile details:", writeError);
                    });
                }

                setSuccessMessage(result.message || "Account created successfully.");
                navigate("/homepage");
                return;
            }
            setError(result.error || "Unable to sign up. Please try again.");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = (e) => {
        const sanitized = e.target.value
            .replace(/[^\d+]/g, "")
            .replace(/(?!^)\+/g, "");

        setPhone(sanitized);
    };


    return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">   
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img src="/public/images/logo.png" alt="Your Company" className="mx-auto h-30 w-auto" />
            <h2 className="mt-2 text-center text-2xl/9 font-bold tracking-tight text-white">Sign up to your account</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm"> 
            <form onSubmit={handleSignUp} className="space-y-6 p-10 backdrop-blur-xs rounded-xl">
                <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => navigate("/")}>
                    &times; 
                    
                </button>

                {/* inputs */}
                <div className="flex flex-col py-4">
                    {/* email */}
                    <div>
                        <label htmlFor="email" className="block text-sm/6 font-medium text-gray-100">Email address</label>
                        <div className="mt-2">
                            <input onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-amber-400 sm:text-sm/6"  type="email" required autoComplete="email" placeholder="sample@gmail.com"/>
                        </div>
                    </div>
                    
                    {/* tel */}
                    <div>
                        <label htmlFor="phone" className="block text-sm/6 font-medium text-gray-100">Phone number</label>
                        <div className="mt-2">
                            <input
                                value={phone}
                                onChange={handlePhoneChange}
                                className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-amber-400 sm:text-sm/6 ${phone.length > 0 && !isPhoneValid ? "outline-red-500/80" : "outline-white/10"}`}
                                type="tel"
                                required
                                autoComplete="tel"
                                inputMode="numeric"
                                placeholder="Phone (09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX, or +639XXXXXXXXX)"
                            />
                            {phone.length > 0 && !isPhoneValid && (
                                <p className="mt-2 text-xs text-red-400">Use 09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX, or +639XXXXXXXXX.</p>
                            )}
                        </div>
                    </div>

                    {/* password */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-100">Password</label>

                        </div>

                        <div className="mt-2 relative">
                            <input onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-md bg-white/5 px-3 py-1.5 pr-10 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-amber-400 sm:text-sm/6" type={showPassword ? "text" : "password"} required autoComplete="new-password" 
                            placeholder="Sample@123" />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300 hover:text-white"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.5a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* confirm password */}
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm/6 font-medium text-gray-100">Confirm Password</label>
                        <div className="mt-2">
                            <input
                                id="confirm-password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-amber-400 sm:text-sm/6 ${confirmPassword.length > 0 && doPasswordsMatch ? "outline-green-500/80" : confirmPassword.length > 0 ? "outline-red-500/80" : "outline-white/10"}`}
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                placeholder="Re-enter password"
                            />
                            {confirmPassword.length > 0 && !doPasswordsMatch && (
                                <p className="mt-2 text-xs text-red-400">Passwords do not match.</p>
                            )}
                        </div>
                    </div>

                    <div id="password-requirements" className="mt-3 text-sm text-gray-200">
                        <p>Password must contain:</p>
                        <ul className="list-disc pl-5">
                            <li id="req-length" className={validations.length ? "text-green-400" : "text-red-400"}>At least 8 characters</li>
                            <li id="req-uppercase" className={validations.uppercase ? "text-green-400" : "text-red-400"}>At least one uppercase letter</li>
                            <li id="req-lowercase" className={validations.lowercase ? "text-green-400" : "text-red-400"}>At least one lowercase letter</li>
                            <li id="req-number" className={validations.number ? "text-green-400" : "text-red-400"}>At least one number</li>
                            <li id="req-special" className={validations.special ? "text-green-400" : "text-red-400"}>At least one special character</li>
                        </ul>
                        <p id="strength-text" className={`mt-2 text-xs font-semibold ${strengthClassName}`}>{strengthText}</p>
                    </div>

                    <div className="mt-2">
                        <button className="flex w-full justify-center rounded-md bg-amber-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500" type="submit" disabled={loading || !isFormValid} >
                            {loading ? "Please wait..." : "Sign up"}
                        </button>
                    </div>
                    {successMessage && <p className="text-green-400 text-center mt-4">{successMessage}</p>}
                    {error && <p className="text-red-600 text-center mt-4">{error}</p>}
                </div>
                <p className="mt-2 text-center text-sm/6 text-gray-400">
                    Already have an account? 
                    {" "}
                    <Link to="/signin" className="font-semibold text-amber-400 hover:text-blue-400">
                        Sign in here!
                    </Link>
                </p>

            </form>
        </div>
    </div>
    );
};

export default SignUp;