import { useContext, useEffect } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";

/**
 * Wrap this component around any page that needs to be protected
 * and only accessible to logged in Admin users
 */

const AdminGuard = ({ children }) => {
    const { isAuthenticated, loading, isAdmin } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [loading, isAuthenticated]);

    useEffect(() => {
        if (!isAdmin) {
            router.back();
        }
    }, [isAdmin]);

    if (loading || !isAuthenticated) {
        return (
            <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <>{children}</>;
};

export default AdminGuard;
