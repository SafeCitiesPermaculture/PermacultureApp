import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import RootLayout from "./RootLayout";
import { useEffect } from "react";

/**
 * Wraps the RootLayout in AuthProvider
 */
const RootLayoutWrapper = () => {
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.title = "AFC Estate";
        }
    }, []);

    return (
        <LoadingProvider>
            <AuthProvider>
                <RootLayout />
            </AuthProvider>
        </LoadingProvider>
    );
};

export default RootLayoutWrapper;
