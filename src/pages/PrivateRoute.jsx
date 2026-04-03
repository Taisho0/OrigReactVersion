import React from "react";
import { userAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const { session, authReady } = userAuth();
    return <>{session ? <>{children}</> : <Navigate to="/" />}</>;
};

export default PrivateRoute;