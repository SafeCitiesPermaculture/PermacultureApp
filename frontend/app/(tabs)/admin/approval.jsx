import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Colors from "@/constants/Colors";
import VerifyUserPanel from "@/components/VerifyUserPanel";
import API from "@/api/api";

const AdminApprovalPage = () => {
    const [unverifiedUsers, setUnverifiedUsers] = useState([]);

    useEffect(() => {
        const getUnverified = async () => {
            try {
                const res = await API.post("/admin/unverified");
                setUnverifiedUsers(res.data);
            } catch (err) {
                console.log("Error when getting unverified:", err);
            }
        };

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
            <ScrollView style={styles.userContainer}>
                {unverifiedUsers.map((item) => (
                    <VerifyUserPanel user={item} key={item._id} />
                ))}
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
