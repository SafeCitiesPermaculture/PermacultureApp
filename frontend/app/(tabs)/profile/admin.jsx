import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AdminGuard from "@/components/AdminGuard";
import { Link } from "expo-router";
import Colors from "@/constants/Colors";

const AdminPage = () => {
    return (
        <AdminGuard>
            <View>
                <Text>This Page Should only be accessible for admin users</Text>
                <Text>STILL A WORK IN PROGRESS</Text>
                <Link href={"/profile/approval"}>
                    <Text style={styles.linkText}>Approval Page</Text>
                </Link>
            </View>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    linkText: {
        fontSize: 30,
        textAlign: "center",
        backgroundColor: Colors.greenButton,
    },
});

export default AdminPage;
