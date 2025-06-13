import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from "react-native";
import { AuthContext } from "@/context/AuthContext";
import DefaultProfilePicture from "@/assets/images/profile_blank_icon.png";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useLoading } from "@/context/LoadingContext";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import API from "@/api/api";
import RemoteImage from "@/components/RemoteImage";
import { useImagePicker } from "@/hooks/useImagePicker";

const ProfilePage = () => {
    const [uploadedImage, setUploadedImage] = useState(null);

    const { userData, isAdmin, logout, refreshUserData } =
        useContext(AuthContext);
    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();
    const { pickImage, WebImageInput } = useImagePicker(setUploadedImage);

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
        const formData = new FormData();

        if (Platform.OS === "web") {
            formData.append(
                "file",
                uploadedImage.fileObject,
                uploadedImage.name
            );
        } else {
            formData.append("file", {
                uri: uploadedImage.uri,
                name: uploadedImage.name,
                type: uploadedImage.type,
            });
        }

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

    useEffect(() => {
        if (!uploadedImage) return;

        changeImage();
    }, [uploadedImage]);

    return (
        <ScrollView style={styles.container}>
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
                    onPress={pickImage}
                >
                    <Text style={styles.imageButtonText}>Change Image</Text>
                </TouchableOpacity>
                <WebImageInput />
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileImageContainer: {
        display: "flex",
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
        display: "flex",
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
    },
    button: {
        backgroundColor: Colors.greenButton,
        flex: 1,
        width: "100%",
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
