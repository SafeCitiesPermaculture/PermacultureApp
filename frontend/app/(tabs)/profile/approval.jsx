import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/constants/Colors";
import VerifyUserPanel from "@/components/VerifyUserPanel";
import API from "@/api/api";

const AdminApprovalPage = () => {
    const [unverifiedUsers, setUnverifiedUsers] = useState([]);

    const getUnverified = async () => {
        try {
            const res = await API.post("/admin/unverified");
            setUnverifiedUsers(res.data);
        } catch (err) {
            console.log("Error when getting unverified:", err);
        }
    };

    useEffect(() => {
        getUnverified();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Verify Users</Text>
                <Text style={styles.descriptionText}>
                    Use this area to approve or deny requests to join the Safe
                    Cities Permaculture App
                </Text>
            </View>
            {/* Check if we have users waiting to be verified */}
            {unverifiedUsers.length > 0 ? (
                <ScrollView style={styles.userContainer}>
                    {/* Loop through users and display a panel for each */}
                    {unverifiedUsers.map((item) => (
                        <VerifyUserPanel
                            user={item}
                            getUnverified={getUnverified}
                            key={item._id}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>
                        No users waiting to be verified
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.backgroundTan,
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
    messageContainer: {
        backgroundColor: Colors.brownLight,
        flex: 1,
        width: "90%",
        marginBottom: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    messageText: {
        fontSize: 30,
        textAlign: "center",
    },
});

export default AdminApprovalPage;
