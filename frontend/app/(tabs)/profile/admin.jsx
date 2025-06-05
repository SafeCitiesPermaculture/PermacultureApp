import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AdminGuard from "@/components/AdminGuard";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";

const AdminPage = () => {
    const router = useRouter();

    return (
        <AdminGuard>
            <View style={styles.container}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/profile/approval")}
                    >
                        <Text style={styles.buttonText}>Approve Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/profile/manageUsers")}
                    >
                        <Text style={styles.buttonText}>Manage Users</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    container: {},

    buttonContainer: {
        flex: 1,
        paddingVertical: 25,
    },
    button: {
        backgroundColor: Colors.greenButton,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        minHeight: 50,
    },
    buttonText: {
        fontSize: 25,
    },
});

export default AdminPage;
