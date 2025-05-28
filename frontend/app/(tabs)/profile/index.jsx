import React, { useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";

const ProfilePage = () => {
    const { userData, isAdmin, logout } = useContext(AuthContext);
    const router = useRouter();

    const logoutButton = async () => {
        try {
            await logout();
        } catch (err) {
            console.log("Error when logging out", err);
        }
    };

    const adminButton = () => {
        if (!isAdmin) return;
        router.push("/profile/admin");
    };

    return (
        <View style={styles.container}>
            <View style={styles.profileImageContainer}>
                <Image
                    style={styles.profileImage}
                    source={
                        userData.profilePicture !== ""
                            ? { uri: userData.profilePicture }
                            : DefaultProfilePicture
                    }
                />
            </View>
            <View style={styles.bioContainer}>
                <Text style={styles.nameText}>{userData.username}</Text>
                <Text style={styles.emailText}>{userData.email}</Text>
                <Text style={styles.farmText}>{userData.farmName}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Settings</Text>
                </TouchableOpacity>
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={adminButton}
                    >
                        <Text style={styles.buttonText}>Admin Panel</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.button} onPress={logoutButton}>
                    <Text style={styles.buttonText}>Log out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    profileImageContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
    },
    profileImage: {
        width: 200,
        height: 200,
        borderWidth: 1,
        borderColor: "rgba(0,0,0, 0.3)",
        borderRadius: 10,
    },
    bioContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        minHeight: 100,
    },
    nameText: {
        fontSize: 25,
        fontWeight: "bold",
    },
    emailText: {
        fontSize: 18,
    },
    farmText: {
        fontSize: 18,
    },
    buttonContainer: {
        flex: 1,
    },
    button: {
        backgroundColor: Colors.greenButton,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        minHeight: 50,
    },
    buttonText: {
        fontSize: 25,
    },
});

export default ProfilePage;
