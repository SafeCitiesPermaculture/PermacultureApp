import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Buffer } from "buffer";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import FileListing from "@/components/FileListing";

const InformationPage = () => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderStack, setFolderStack] = useState([]);

    //get the file from the file picker
    const pickFile = async () => {
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

            console.log(result);

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

        formData.append("parent", currentFolder?._id || null);

        try {
            const res = await API.post("/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            await getFileList();
        } catch (err) {
            console.error("Upload error:", error.response || error.message);
        }
    };

    //get file from backend and open it on frontend
    const displayFile = async (fileId) => {
        try {
            //get data
            const res = await API.post(
                `/files/${fileId}`,
                {},
                { responseType: "arraybuffer" }
            );

            const base64String = Buffer.from(res.data, "binary").toString(
                "base64"
            );

            //determine file name and extension
            const disposition = res.headers["content-disposition"];
            let filename = "file.bin";

            if (disposition) {
                const match = disposition.match(
                    /filename[^;=\n]*=(['"]?)([^'"\n]*)\1?/
                );
                if (match && match[2]) {
                    filename = match[2];
                }
            }

            //V not currently used but maybe useful in future V
            const extension = filename.substring(filename.lastIndexOf("."));

            const fileUri = FileSystem.documentDirectory + filename;

            //save file
            await FileSystem.writeAsStringAsync(fileUri, base64String, {
                encoding: FileSystem.EncodingType.Base64,
            });

            //open file with native viewer
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri);
            } else {
                console.log("Sharing is not enabled on this device");
            }
        } catch (err) {
            console.error("Download or open failed:", error);
        }
    };

    const deleteFile = async (fileId) => {
        try {
            await API.delete(`/files/delete/${fileId}`);
            await getFileList();
        } catch (err) {
            console.error("Error when deleting file", err);
        }
    };

    //populate file list
    const getFileList = async () => {
        try {
            const res = await API.get("/files/list", {
                params: {
                    parent: currentFolder?._id || null,
                },
            });
            //sort files
            setFileList(
                res.data.files.sort((a, b) => {
                    //folders should appear first
                    if (a.isFolder !== b.isFolder) {
                        return a.isFolder ? -1 : 1;
                    }

                    //Alphabetical tie breaker
                    return a.name.localeCompare(b.name);
                })
            );
        } catch (err) {
            console.log("Error populating list", err);
        }
    };

    //navigate into a folder
    const enterFolder = (folder) => {
        setCurrentFolder(folder);
        setFolderStack((prevStack) => [...prevStack, folder]);
    };

    //go back to the parent folder
    const exitFolder = () => {
        if (folderStack.length === 0) return;
        setCurrentFolder(
            folderStack.length > 1 ? folderStack[folderStack.length - 2] : null
        );
        setFolderStack((prevStack) => prevStack.slice(0, -1));
    };

    useEffect(() => {
        getFileList();
    }, [currentFolder]);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Information Page</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={pickFile}>
                    <Text>Upload File</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={sendFile}>
                    <Text>Send File</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.fileContainer}>
                <Text style={styles.fileText}>
                    Current File:{" "}
                    {uploadedFile ? uploadedFile.assets[0].name : "N/A"}
                </Text>
                <Text style={styles.folderText}>
                    Current Folder:{" "}
                    {currentFolder ? currentFolder.name : "Root"}
                </Text>
                <TouchableOpacity onPress={exitFolder}>
                    <Text style={styles.exitButtonText}>Exit Folder</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.fileListingContainer}>
                {fileList.length > 0 ? (
                    fileList.map((item) => (
                        <FileListing
                            key={item._id}
                            file={item}
                            displayFile={displayFile}
                            deleteFile={deleteFile}
                            enterFolder={enterFolder}
                        />
                    ))
                ) : (
                    <Text>No files available</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    headerContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 50,
        width: "100%",
    },

    headerText: {
        fontSize: 30,
    },

    buttonContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding: 10,
        backgroundColor: Colors.greenRegular,
        marginBottom: 10,
    },

    fileContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        backgroundColor: Colors.greenRegular,
        marginBottom: 20,
    },

    fileText: {
        fontSize: 18,
    },

    folderText: {
        fontSize: 18,
    },

    exitButtonText: {
        fontSize: 18,
        backgroundColor: Colors.errorRed,
        padding: 5,
        borderRadius: 5,
    },

    fileListingContainer: {
        flex: 1,
        backgroundColor: Colors.brownLight,
        marginBottom: 20,
    },
});

export default InformationPage;
