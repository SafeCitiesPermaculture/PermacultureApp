import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";

const ProtectedPage = () => {
    const { isAdmin } = useContext(AuthContext);
    const router = useRouter();

    return (
        <View>
            <Text>
                This Page Should only be accessible for authenticated users
            </Text>
        </View>
    );
};

export default ProtectedPage;
