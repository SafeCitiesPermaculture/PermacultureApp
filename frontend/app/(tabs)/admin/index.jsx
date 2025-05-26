import React from "react";
import { View, Text } from "react-native";
import AdminGuard from "@/components/AdminGuard";

const AdminPage = () => {
    return (
        <AdminGuard>
            <View>
                <Text>This Page Should only be accessible for admin users</Text>
            </View>
        </AdminGuard>
    );
};

export default AdminPage;
