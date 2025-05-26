import React, { createContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, logout as apiLogout } from "@/api/api";

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
        SecureStore.getItemAsync("tokens").then((tokens) => {
            setIsAuthenticated(!!tokens);
            setLoading(false);
        });
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
