import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userAuth } from "../auth/AuthContext";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { app } from "../config/FirebaseConfig";
import { useEffect } from "react";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const {session, userProfile, authReady, signUpNewUser} = userAuth();
    const db = getFirestore(app);
    const navigate =  useNavigate();

    useEffect(() => {
        if (authReady && session) {
            navigate(userProfile?.role === "admin" ? "/admin" : "/homepage");
        }
    }, [authReady, navigate, session, userProfile]);

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
            const result = await signUpNewUser(email, password);
            if (result.success) {
                const uid = result?.data?.user?.uid;
                const safePhone = normalizedPhone || phone;

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
                navigate(result.profile?.role === "admin" ? "/admin" : "/homepage");
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
        <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_25%)]" />
            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
                <div className="w-full overflow-hidden rounded-4xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                    <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-6 px-8 py-10 md:px-12 md:py-14">
                            <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-300">
                                Originals Printing Co.
                            </span>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                                    Create your Originals account.
                                </h1>
                                <p className="max-w-xl text-zinc-300">
                                    Join now to unlock faster checkout, order tracking, and personalized product recommendations.
                                </p>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 text-sm text-zinc-300 shadow-xl shadow-black/20">
                                <p className="font-semibold text-white">Password strength</p>
                                <p className="mt-2 leading-7">
                                    Use a strong password and confirm your phone number for a secure, premium experience.
                                </p>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-4xl bg-zinc-950/90 px-8 py-10 md:px-12 md:py-14">
                            <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-emerald-500/10 to-transparent" />
                            <div className="relative">
                                <button type="button" className="absolute right-4 top-4 text-zinc-400 transition hover:text-white" onClick={() => navigate("/") }>
                                    &times;
                                </button>
                                <div className="mb-8">
                                    <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Sign up</p>
                                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">Start your Originals journey</h2>
                                </div>
                                <form onSubmit={handleSignUp} className="space-y-6">
                                    <div className="space-y-3">
                                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Email address</label>
                                        <input
                                            id="email"
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            placeholder="sample@gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">Phone number</label>
                                        <input
                                            id="phone"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            className={`w-full rounded-2xl border px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 ${phone.length > 0 && !isPhoneValid ? "border-red-500/80" : "border-white/10 bg-white/5"}`}
                                            type="tel"
                                            required
                                            autoComplete="tel"
                                            inputMode="numeric"
                                            placeholder="09XXXXXXXXX"
                                        />
                                        {phone.length > 0 && !isPhoneValid && (
                                            <p className="text-xs text-red-400">Use 09XXXXXXXXX, 9XXXXXXXXX, 639XXXXXXXXX, or +639XXXXXXXXX.</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Password</label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                autoComplete="new-password"
                                                placeholder="Sample@123"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-white"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? "Hide" : "Show"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-300">Confirm password</label>
                                        <input
                                            id="confirm-password"
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 ${confirmPassword.length > 0 && doPasswordsMatch ? "border-emerald-500/80" : confirmPassword.length > 0 ? "border-red-500/80" : "border-white/10 bg-white/5"}`}
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="new-password"
                                            placeholder="Re-enter password"
                                        />
                                        {confirmPassword.length > 0 && !doPasswordsMatch && (
                                            <p className="text-xs text-red-400">Passwords do not match.</p>
                                        )}
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                                        <p className="font-semibold text-white">Password requirements</p>
                                        <ul className="mt-2 space-y-1 list-disc pl-5">
                                            <li className={validations.length ? "text-green-400" : "text-red-400"}>At least 8 characters</li>
                                            <li className={validations.uppercase ? "text-green-400" : "text-red-400"}>One uppercase letter</li>
                                            <li className={validations.lowercase ? "text-green-400" : "text-red-400"}>One lowercase letter</li>
                                            <li className={validations.number ? "text-green-400" : "text-red-400"}>One number</li>
                                            <li className={validations.special ? "text-green-400" : "text-red-400"}>One special symbol</li>
                                        </ul>
                                        {strengthText && <p className={`mt-3 text-xs font-semibold ${strengthClassName}`}>{strengthText}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || !isFormValid}
                                        className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? "Please wait..." : "Sign up"}
                                    </button>
                                    {successMessage && <p className="text-sm text-emerald-300">{successMessage}</p>}
                                    {error && <p className="text-sm text-red-400">{error}</p>}
                                </form>
                                <p className="mt-8 text-center text-sm text-zinc-400">
                                    Already have an account?{' '}
                                    <Link to="/signin" className="font-semibold text-amber-400 hover:text-amber-300">
                                        Sign in here!
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
