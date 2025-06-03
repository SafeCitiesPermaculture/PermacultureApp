import React, { useEffect, useState } from "react";
import {
    View,
    ScrollView,
    Text,
    Image,
    Button,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    onPress,
    TextInput,
    Dimensions,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Buffer } from "buffer";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import FileListing from "@/components/FileListing";
import safeCitiesLogo from "@/assets/images/logo.png";
import folders from "@/assets/images/folder 2 icon.png";
import searchGlass from "@/assets/images/maginfying glass icon.png";
import addIcon from "@/assets/images/Add _ plus icon.png";

const screenWidth = Dimensions.get("window").width;

const InformationPage = () => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderStack, setFolderStack] = useState([]);
    const [searchText, setSearchText] = useState("");

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
        <SafeAreaView style={styles.informationMainScreen}>
            <ScrollView style={styles.informationMainScreen}>
                {/* header with logo and search box */}
                <View style={styles.headerContainer}>
                    <Image source={safeCitiesLogo} style={styles.logo} />

                    <View style={styles.searchBox}>
                        <TextInput
                            style={styles.textInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search Information"
                            placeholderTextColor="#888"
                        />
                        {/* magnfiying image*/}
                        <Image source={searchGlass} style={styles.searchIcon} />
                    </View>
                </View>

                {/*file folders */}
                <View style={styles.scrollContent}>
                    <TouchableOpacity style={styles.button} onPress={onPress}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Image
                                source={folders}
                                style={styles.folderIcons}
                            />
                            <Text style={styles.searchText}>Livestock</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onPress}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Image
                                source={folders}
                                style={styles.folderIcons}
                            />
                            <Text style={styles.searchText}>Plants</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onPress}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Image
                                source={folders}
                                style={styles.folderIcons}
                            />
                            <Text style={styles.searchText}>
                                Plant Calendar
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={onPress}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <Image
                                source={folders}
                                style={styles.folderIcons}
                            />
                            <Text style={styles.searchText}>Insects</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View>
                    <TouchableOpacity style={styles.add}>
                        <Image source={addIcon} style={styles.plusIcon} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    add: {
        flex: 1,
        marginLeft: screenWidth * 0.82,
        marginTop: screenWidth * 0.99,
    },
    plusIcon: {
        flex: 1,
        width: 45,
        height: 55,
    },
    informationMainScreen: {
        flex: 1,
        backgroundColor: Colors.backgroundTan,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    folderIcons: {
        width: 40,
        height: 40,
        alignItems: "center",
        resizeMode: "contain",
        marginRight: 10,
        padding: 10,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 10,
    },

    logo: {
        width: 60,
        height: 60,
        resizeMode: "contain",
        marginRight: 12,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.greyTextBox,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        flex: 1, // take remaining space
        justifyContent: "space-between",
    },
    searchIcon: {
        width: 20,
        height: 20,
        marginLeft: 8,
    },
    searchText: {
        color: "#555",
        fontSize: 16,
    },
    searchIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    button: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.brownLight,
        borderRadius: 5,
        height: 45,
        justifyContent: "space-between",
        borderWidth: 1, // Thickness of the border
        borderColor: "black",
    },
    textInput: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 8,
        fontSize: 16,
    },
});

export default InformationPage;
