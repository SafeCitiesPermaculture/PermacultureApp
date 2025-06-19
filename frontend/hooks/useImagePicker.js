import React, { useRef } from "react";
import { Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

//Custom hook to handle file uploading on mobile and web
export const useImagePicker = (setUploadedImage) => {
    const fileInputRef = useRef(null);

    const pickImage = async () => {
        if (Platform.OS === "web") {
            fileInputRef.current?.click();
            return;
        }

        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.status !== "granted") {
            Alert.alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            quality: 1,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        setUploadedImage({
            uri: asset.uri,
            name: asset.uri.split("/").pop(),
            type: asset.type || "image/jpeg",
        });
    };

    const onWebFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedImage({
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            fileObject: file,
        });
    };

    const WebImageInput = () => {
        if (Platform.OS !== "web") return null;

        return (
            <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={onWebFileChange}
            />
        );
    };

    return { pickImage, WebImageInput };
};
