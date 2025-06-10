import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import RootLayout from "./RootLayout";

/**
 * Wraps the RootLayout in AuthProvider
 */
const RootLayoutWrapper = () => {
    return (
        <LoadingProvider>
            <AuthProvider>
                <RootLayout />
            </AuthProvider>
        </LoadingProvider>
    );
};

export default RootLayoutWrapper;
