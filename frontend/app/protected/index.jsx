import React from "react";
import { View, Text } from "react-native";
import AuthGuard from "@/components/AuthGuard";

const ProtectedPage = () => {
    return (
        <AuthGuard>
            <View>
                <Text>
                    This Page Should only be accessible for authenticated users
                </Text>
            </View>
        </AuthGuard>
    );
};

export default ProtectedPage;
