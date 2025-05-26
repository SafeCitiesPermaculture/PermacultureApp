import { Stack, Slot, useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { useContext, useEffect } from "react";

/**
 * Sets up navigation and Auth for all pages
 */
const RootLayout = () => {
    const { isLoggedIn, isAuthenticated, loading } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!loading && isLoggedIn && isAuthenticated) {
            router.replace("/protected");
        }
    }, [isLoggedIn, isAuthenticated, loading]);

    if (!isLoggedIn) {
        return (
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.brownDark,
                    },
                    headerTintColor: "#000",
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: "bold",
                    },
                    contentStyle: {
                        paddingHorizontal: 10,
                        paddingTop: 10,
                        backgroundColor: Colors.backgroundWhite,
                    },
                }}
            >
                <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
                <Stack.Screen
                    name="signup"
                    options={{ headerTitle: "Sign Up" }}
                />
            </Stack>
        );
    }

    return <Slot />;
};

export default RootLayout;
