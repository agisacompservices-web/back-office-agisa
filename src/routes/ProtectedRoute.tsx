import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem("agisa_token");

    // console.log('ProtectedRoute check:', {
    //     path: window.location.pathname,
    //     hasToken: !!token
    // });

    useEffect(() => {
        if (!token) {
            // console.warn('No token found in ProtectedRoute, redirecting to /');
            navigate("/", { replace: true });
        }
    }, [token, navigate]);

    if (!token) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
