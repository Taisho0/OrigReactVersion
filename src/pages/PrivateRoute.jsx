import React from "react";
import { userAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, requireNonAdmin = false }) => {
    const { session, authReady, isAdmin } = userAuth();

    if (!authReady) {
        return null;
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    if (requireNonAdmin && isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;