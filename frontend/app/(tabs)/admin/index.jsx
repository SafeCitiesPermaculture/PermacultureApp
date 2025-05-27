import React from "react";
import { View, Text } from "react-native";
import AdminGuard from "@/components/AdminGuard";
import { Link } from "expo-router";

const AdminPage = () => {
    return (
        <AdminGuard>
            <View>
                <Text>This Page Should only be accessible for admin users</Text>
                <Link href={"/admin/approval"}>
                    <Text>Approval Page</Text>
                </Link>
            </View>
        </AdminGuard>
    );
};

export default AdminPage;
