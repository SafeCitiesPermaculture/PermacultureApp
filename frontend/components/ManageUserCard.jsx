import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";

const ManageUserCard = ({ user }) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push(`/profile/${user._id}`)}
        >
            <Text style={styles.nameText}>{user.username}</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <View style={styles.farmRoleContainer}>
                <Text style={styles.roleText}>
                    Role:{" "}
                    <Text style={styles.roleInnerText}>{user.userRole}</Text>
                </Text>
                <Text style={styles.farmText}>
                    Farm:{" "}
                    <Text style={styles.farmNameInnerText}>
                        {user.farmName.length > 0 ? user.farmName : "N/A"}
                    </Text>
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.greenRegular,
        marginHorizontal: 20,
        marginBottom: 20,
        minHeight: 75,
        padding: 5,
        borderRadius: 5,
    },

    nameText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 5,
    },
    emailText: {
        fontSize: 15,
    },

    farmRoleContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "start",
    },
    roleText: {
        marginRight: 10,
    },
    roleInnerText: {
        fontWeight: "bold",
    },
    farmText: {},
    farmNameInnerText: {
        fontWeight: "bold",
    },
});

export default ManageUserCard;
