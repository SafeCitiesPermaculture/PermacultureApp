import { Stack, Slot, useRouter, useSegments } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import Colors from "@/constants/Colors";
import { useContext, useEffect } from "react";

/**
 * Sets up navigation and Auth for all pages
 */
const RootLayout = () => {
    const { isLoggedIn, isAuthenticated, loading } = useContext(AuthContext);
    const router = useRouter();
    const segments = useSegments();
    const currentURL = segments.join("/");
    const isResetPasswordRoute = currentURL.startsWith("reset-password");
    console.log(segments);
    console.log(currentURL, isResetPasswordRoute);

    useEffect(() => {
        if (loading || isResetPasswordRoute) {
            return;
        }
        if (isLoggedIn && isAuthenticated) {
            router.replace("/home");
        } else {
            router.replace("/login");
        }
    }, [isLoggedIn, isAuthenticated, loading, isResetPasswordRoute]);

    if (!isLoggedIn) {
        return (
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.menuBrown,
                    },
                    headerTintColor: "#000",
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: "bold",
                    },
                    contentStyle: {
                        paddingHorizontal: 10,
                        paddingTop: 10,
                        backgroundColor: Colors.backgroundTan,
                    },
                }}
            >
                <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
                <Stack.Screen
                    name="signup"
                    options={{ headerTitle: "Sign Up" }}
                />
                <Stack.Screen name="forgotPassword" options={{ headerTitle: "Forgot Password" }} />
                <Stack.Screen name="reset-password/[resetPasswordToken]" options={{ headerTitle: "Reset password" }} />
            </Stack>
        );
    }

    return <Slot />;
};

export default RootLayout;
