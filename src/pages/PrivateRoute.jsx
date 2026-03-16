import React, { useEffect, useState } from "react";
import { userAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const { session } = userAuth();
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        if (session !== undefined) return;
        const timer = setTimeout(() => setTimedOut(true), 100);
        return () => clearTimeout(timer);
    }, [session]);

    if (session === undefined && !timedOut) {
        return <p>Loading...</p>;
    }
    return <>{session ? <>{children}</> : <Navigate to="/" />}</>;
};

export default PrivateRoute;