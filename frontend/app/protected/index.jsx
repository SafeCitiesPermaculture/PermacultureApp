import React from "react";
import { View, Text } from "react-native";

const ProtectedPage = () => {
    return (
        <View>
            <Text>
                This Page Should only be accessible for authenticated users
            </Text>
        </View>
    );
};

export default ProtectedPage;
