import { AuthProvider } from "@/context/AuthContext";
import RootLayout from "./RootLayout";

/**
 * Wraps the RootLayout in AuthProvider
 */
const RootLayoutWrapper = () => {
    return (
        <AuthProvider>
            <RootLayout />
        </AuthProvider>
    );
};

export default RootLayoutWrapper;
