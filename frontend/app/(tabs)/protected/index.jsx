import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AuthGuard from "@/components/AuthGuard";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";

const ProtectedPage = () => {
    const { isAdmin } = useContext(AuthContext);
    const router = useRouter();

    return (
        <AuthGuard>
            <View>
                <Text>
                    This Page Should only be accessible for authenticated users
                </Text>
                {isAdmin && (
                    <TouchableOpacity onPress={() => router.push("/admin")}>
                        <Text>Admins Only</Text>
                    </TouchableOpacity>
                )}
            </View>
        </AuthGuard>
    );
};

export default ProtectedPage;
