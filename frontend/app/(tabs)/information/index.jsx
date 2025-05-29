import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import API from "@/api/api";

const InformationPage = () => {
    const [uploadedFile, setUploadedFile] = useState(null);

    //get the file from the file picker
    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    "image/jpeg",
                    "image/png",
                    "application/pdf",
                    "application/msword",
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
    };

    //send the file to the backend
    const sendFile = async () => {
        if (!uploadedFile) {
            console.log("Upload a file");
            return;
        }

        const file = uploadedFile.assets[0];
        const formData = new FormData();
        formData.append("file", {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
        });

        try {
            console.log("Starting upload...");
            const res = await API.post("/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("File uploaded:", res.data);
        } catch (err) {
            console.error("Upload error:", error.response || error.message);
        }
    };

    return (
        <View>
            <Text>Information Page</Text>
            <TouchableOpacity onPress={pickFile}>
                <Text>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendFile}>
                <Text>Send File</Text>
            </TouchableOpacity>
        </View>
    );
};

export default InformationPage;
