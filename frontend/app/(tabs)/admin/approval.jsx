import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/constants/Colors";
import VerifyUserPanel from "@/components/VerifyUserPanel";

const AdminApprovalPage = () => {
    const exampleUser = {
        _id: "683610a9f659759ee63ba9ca",
        username: "Steve",
        password:
            "$2b$10$Vaz12hnfEhCzfew.RHW5WOe/jEGFfLRB75BV17c9yCcWKgHu1G8pC",
        email: "steve@test.com",
        isVerified: false,
        userRole: "user",
        isSafeCities: false,
        profilePicture: "",
        farmName: "",
        isReported: false,
        isRemoved: false,
        removedDate: null,
        __v: 0,
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Verify Users</Text>
                <Text style={styles.descriptionText}>
                    Use this area to approve or deny requests to join the Safe
                    Cities Permaculture App
                </Text>
            </View>
            <ScrollView style={styles.userContainer}>
                <VerifyUserPanel user={exampleUser} />
                <VerifyUserPanel user={exampleUser} />
                <VerifyUserPanel user={exampleUser} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.backgroundWhite,
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
    },

    headerContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
    },

    headerText: {
        fontSize: 30,
        marginBottom: 20,
        fontWeight: "bold",
    },

    descriptionText: {
        textAlign: "center",
        fontSize: 18,
    },

    userContainer: {
        backgroundColor: Colors.brownLight,
        flex: 1,
        width: "90%",
        marginBottom: 30,
    },
});

export default AdminApprovalPage;
