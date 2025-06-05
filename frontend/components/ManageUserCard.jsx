import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";

const ManageUserCard = ({ user }) => {
    const router = useRouter();
    const { userData } = useContext(AuthContext);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => {
                if (user._id == userData._id) return;
                router.push(`/profile/${user._id}`);
            }}
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
            {user.isReported && (
                <Text style={styles.reportedText}>REPORTED</Text>
            )}
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

    reportedText: {
        color: Colors.errorRed,
        fontWeight: "bold",
        marginTop: 3,
    },
});

export default ManageUserCard;
