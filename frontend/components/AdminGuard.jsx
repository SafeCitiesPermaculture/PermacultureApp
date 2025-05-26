import { useCallback, useContext, useEffect } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";

/**
 * Wrap this component around any page that needs to be protected
 * and only accessible to logged in Admin users
 */

const AdminGuard = ({ children }) => {
    const { isAuthenticated, loading, isAdmin } = useContext(AuthContext);
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            if (!loading && !isAuthenticated) {
                router.replace("/login");
            }
        }, [loading, isAuthenticated])
    );

    useFocusEffect(
        useCallback(() => {
            if (!isAdmin) {
                router.replace("/protected");
            }
        }, [isAdmin])
    );

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
