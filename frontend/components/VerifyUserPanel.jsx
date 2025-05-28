import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";
import API from "@/api/api";

//Panel that gets displayed for each user that needs to be verified
const VerifyUserPanel = ({ user, getUnverified }) => {
    //aprove the user
    const approve = async () => {
        try {
            await API.put(`/admin/verify/${user._id}`);
            getUnverified(); //refresh list
        } catch (err) {
            console.log("Error when approving user", err);
        }
    };

    //deny the user
    const deny = async () => {
        try {
            await API.delete(`/admin/denyverify/${user._id}`);
            getUnverified(); //refresh list
        } catch (err) {
            console.log("Error when denying user", err);
        }
    };

    return (
        <View style={styles.container}>
            <Image
                style={styles.image}
                source={require("@/assets/images/profile_blank_icon.png")}
            />
            <View style={styles.bioContainer}>
                <Text style={styles.nameText}>{user.username}</Text>
                <Text style={styles.emailText}>{user.email}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.approveButton}
                    onPress={approve}
                >
                    <Text>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyButton} onPress={deny}>
                    <Text>Deny</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.greenRegularB,
        margin: 10,
        padding: 5,
        boxShadow: "1px 1px 4px 2px rgba(0,0,0,0.3)",
        borderRadius: 5,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 100,
    },
    image: {
        width: 75,
        height: 75,
        margin: 10,
    },
    bioContainer: {
        flex: 1,
    },
    nameText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    emailText: {
        fontWeight: 18,
    },
    buttonContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    approveButton: {
        backgroundColor: Colors.greenButton,
        padding: 5,
        borderRadius: 5,
        marginBottom: 10,
    },
    denyButton: {
        backgroundColor: Colors.errorRed,
        padding: 5,
        borderRadius: 5,
    },
});

export default VerifyUserPanel;
