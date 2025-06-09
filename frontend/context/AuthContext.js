import React, { createContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import API, {
    login as apiLogin,
    logout as apiLogout,
    getTokens,
} from "@/api/api";

/**
 * Combination of these two provides Auth functions to all components
 * Allows access to the values in value={...} at the bottom
 */

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!userData) {
            setIsAdmin(false);
            return;
        }

        setIsAdmin(userData.userRole === "admin");
    }, [userData]);

    useEffect(() => {
        const checkAuth = async () => {
            const tokens = await getTokens();
            setIsAuthenticated(!!tokens);
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        const user = await apiLogin(username, password);
        setIsAuthenticated(true);
        setUserData(user);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        await apiLogout();
        setIsAuthenticated(false);
        setIsLoggedIn(false);
    };

    const refreshUserData = async () => {
        const res = await API.get("/auth/userdata");
        const { user } = res.data;
        setUserData(user);
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                login,
                logout,
                loading,
                userData,
                isAdmin,
                isLoggedIn,
                refreshUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
