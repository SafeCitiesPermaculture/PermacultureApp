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
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: false,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];

        // NOTE: asset.type is just "image"/"video" — NOT a real MIME type.
        // Prefer asset.mimeType (e.g. "image/heic", "image/png") and the real
        // fileName so HEIC and other formats upload correctly. The backend also
        // derives the type from the extension as a safety net.
        const name = asset.fileName || asset.uri.split("/").pop() || "photo.jpg";
        setUploadedImage({
            uri: asset.uri,
            name,
            type: asset.mimeType || "image/jpeg",
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
