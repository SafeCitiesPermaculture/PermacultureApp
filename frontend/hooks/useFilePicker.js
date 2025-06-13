import React, { useRef } from "react";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";

//Custom hook to handle file uploading on mobile and web
export const useFilePicker = (setUploadedFile) => {
    const fileInputRef = useRef(null);

    const pickFile = async () => {
        if (Platform.OS === "web") {
            fileInputRef.current?.click();
            return null;
        } else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: [
                        "image/jpeg",
                        "image/png",
                        "application/pdf",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ],
                    copyToCacheDirectory: true,
                });

                if (!result.canceled) {
                    setUploadedFile(result);
                    return result;
                } else {
                    return null;
                }
            } catch (err) {
                console.error("Error picking file:", err);
                return null;
            }
        }
    };

    const onWebFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = {
                name: file.name,
                size: file.size,
                type: file.type,
                uri: file, // raw File object
                canceled: false,
            };
            setUploadedFile(result);
        };
        reader.readAsArrayBuffer(file);
    };

    const WebFileInput = () => {
        if (Platform.OS !== "web") return null;

        return (
            <input
                type="file"
                accept=".jpeg,.jpg,.png,.pdf,.doc,.docx"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={onWebFileChange}
            />
        );
    };

    return { pickFile, WebFileInput };
};
