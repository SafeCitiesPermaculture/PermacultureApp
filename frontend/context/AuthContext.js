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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        SecureStore.getItemAsync("tokens").then((tokens) => {
            setIsAuthenticated(!!tokens);
            setLoading(false);
        });
    }, []);

    const login = async (username, password) => {
        await apiLogin(username, password);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        await apiLogout();
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, login, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
