import React, { useContext, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "@/context/AuthContext";
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import API from "@/api/api";
import RemoteImage from "@/components/RemoteImage";

const ProfilePage = () => {
    const { userData, isAdmin, logout, refreshUserData } =
        useContext(AuthContext);
    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

    const logoutButton = async () => {
        try {
            showLoading();
            await logout();
        } catch (err) {
            console.log("Error when logging out", err);
        } finally {
            hideLoading();
        }
    };

    const adminButton = () => {
        if (!isAdmin) return;
        router.push("/profile/admin");
    };

    //change profile picture
    const changeImage = async () => {
        //ask for permission
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
            alert("Permission to access camera roll is required!");
            return;
        }

        //open image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            quality: 1,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        //convert to file
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const fileName = asset.uri.split("/").pop();
        const fileType = asset.type || "image/jpeg";

        const formData = new FormData();
        formData.append("file", {
            uri: asset.uri,
            name: fileName,
            type: fileType,
        });

        try {
            showLoading();
            const response = await API.put(
                `/user/image/${userData._id}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            await refreshUserData();
        } catch (error) {
            console.error("Upload failed:", error.message);
        } finally {
            hideLoading();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.profileImageContainer}>
                <RemoteImage
                    containerStyle={styles.profileImageWrapper}
                    imgStyle={styles.profileImage}
                    imgSource={
                        userData.profilePicture !== ""
                            ? { uri: userData.profilePicture }
                            : DefaultProfilePicture
                    }
                />
                <TouchableOpacity
                    style={styles.imageButton}
                    onPress={changeImage}
                >
                    <Text style={styles.imageButtonText}>Change Image</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.bioContainer}>
                <Text style={styles.nameText}>{userData.username}</Text>
                <Text style={styles.emailText}>{userData.email}</Text>
                <Text style={styles.farmText}>{userData.farmName}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/(tabs)/profile/user/settings')}
                    >
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
        minHeight: 250,
    },

    profileImageWrapper: {
        width: 200,
        height: 200,
    },

    profileImage: {
        width: 200,
        height: 200,
        borderWidth: 1,
        borderColor: "rgba(0,0,0, 0.3)",
        borderRadius: 10,
    },
    imageButton: {
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },

    imageButtonText: {
        fontSize: 20,
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
