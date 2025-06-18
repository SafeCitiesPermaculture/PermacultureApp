import React, { useContext, useEffect, useState } from "react";
import { useLoading } from "@/context/LoadingContext";
import {
    View,
    ScrollView,
    Text,
    Image,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Pressable,
    TextInput,
    Dimensions,
    Modal,
    Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Buffer } from "buffer";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import FileListing from "@/components/FileListing";
import safeCitiesLogo from "@/assets/images/logo.png";
import searchGlass from "@/assets/images/maginfying glass icon.png";
import addIcon from "@/assets/images/post-button.png";
import backArrow from "@/assets/images/back_arrow.png";
import folders from "@/assets/images/folder 2 icon.png";
import { AuthContext } from "@/context/AuthContext";
import { useFilePicker } from "@/hooks/useFilePicker";

const screenWidth = Dimensions.get("window").width;

const InformationPage = () => {
    const [uploadedFile, setUploadedFile] = useState(null);
    const [fileModalVisible, setFileModalVisible] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [filteredFileList, setFilteredFileList] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderStack, setFolderStack] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [driveUsage, setDriveUsage] = useState(null);

    const { showLoading, hideLoading } = useLoading();
    const { isAdmin } = useContext(AuthContext);
    const { pickFile, WebFileInput } = useFilePicker(setUploadedFile);

    //send the file to the backend
    const sendFile = async () => {
        if (!uploadedFile) {
            console.log("Upload a file");
            return;
        }

        let fileFormData;

        if (Platform.OS === "web") {
            fileFormData = uploadedFile.uri;
        } else {
            const file = uploadedFile.assets[0];
            fileFormData = {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || "application/octet-stream",
            };
        }

        const formData = new FormData();
        formData.append("file", fileFormData);
        formData.append("parent", currentFolder?._id || null);

        try {
            showLoading();
            setFileModalVisible(false);

            const res = await API.post("/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setUploadedFile(null);
            await getFileList();
        } catch (err) {
            console.error("Upload error:", err.response || err.message);
        } finally {
            hideLoading();
        }
    };

    //get file from backend and open it on frontend
    const displayFile = async (fileId) => {
        try {
            showLoading();
            //get data
            const res = await API.post(
                `/files/${fileId}`,
                {},
                { responseType: "arraybuffer" }
            );

            //determine file name and extension
            const disposition = res.headers["content-disposition"];

            let filename = "file.bin";
            const mimeType =
                res.headers["content-type"] || "application/octet-stream";

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

            if (Platform.OS === "web") {
                const blob = new Blob([res.data], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const base64String = Buffer.from(res.data, "binary").toString(
                    "base64"
                );

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
            }
        } catch (err) {
            console.error("Download or open failed:", err);
        } finally {
            hideLoading();
        }
    };

    const deleteFile = async (fileId) => {
        try {
            showLoading();
            await API.delete(`/files/delete/${fileId}`);
            await getFileList();
        } catch (err) {
            console.error("Error when deleting file", err);
        } finally {
            hideLoading();
        }
    };

    //populate file list
    const getFileList = async () => {
        try {
            showLoading();
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

            //get usage stats
            getDriveUsage();
        } catch (err) {
            console.log("Error populating list", err);
        } finally {
            hideLoading();
        }
    };

    const getDriveUsage = async () => {
        try {
            const res = await API.get("/files/storage");
            setDriveUsage(res.data);
        } catch (err) {
            console.log("Error getting drive usage", err);
        }
    };

    const createFolder = async () => {
        try {
            showLoading();
            setFileModalVisible(false);
            const res = await API.post("/files/folder/create", {
                name: newFolderName,
                parent: currentFolder?._id || null,
            });

            setNewFolderName("");
            await getFileList();
        } catch (err) {
            console.log("Error creating folder:", err);
        } finally {
            hideLoading();
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

    useEffect(() => {
        const filtered = fileList.filter((file) =>
            file.name.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredFileList(filtered);
    }, [searchText, fileList]);

    return (
        <>
            <SafeAreaView style={styles.informationMainScreen}>
                <ScrollView style={styles.informationMainScreen}>
                    {/* header with logo and search box */}
                    <View style={styles.headerContainer}>
                        <View style={styles.searchContainer}>
                            <Image
                                source={safeCitiesLogo}
                                style={styles.logo}
                            />

                            <View style={styles.searchBox}>
                                <TextInput
                                    style={styles.textInput}
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    placeholder="Search Information"
                                    placeholderTextColor="#888"
                                />
                                {/* magnfiying image*/}
                                <Image
                                    source={searchGlass}
                                    style={styles.searchIcon}
                                />
                            </View>
                        </View>

                        {isAdmin && (
                            <View style={styles.usageContainer}>
                                <Text style={styles.usageText}>
                                    {driveUsage
                                        ? driveUsage.usageGB > 0
                                            ? `Storage Used: ${driveUsage.usageGB} GB / ${driveUsage.limitGB} GB`
                                            : `Storage Used: ${driveUsage.usageMB} MB / ${driveUsage.limitMB} MB`
                                        : "Loading..."}
                                </Text>
                            </View>
                        )}

                        <View style={styles.currentFolderContainer}>
                            {currentFolder && (
                                <>
                                    <TouchableOpacity onPress={exitFolder}>
                                        <Image
                                            source={backArrow}
                                            style={styles.backArrowIcon}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.currentFolderText}>
                                        <Image
                                            source={folders}
                                            style={styles.folderIcons}
                                        />
                                        <Text>
                                            {currentFolder
                                                ? currentFolder.name
                                                : "N/A"}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/*file folders */}
                    <View style={styles.scrollContent}>
                        {filteredFileList.length > 0 ? (
                            filteredFileList.map((item) => (
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
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Add Button */}
            {isAdmin && (
                <View style={styles.addContainer}>
                    <TouchableOpacity
                        style={styles.add}
                        onPress={() => setFileModalVisible(true)}
                    >
                        <Image source={addIcon} style={styles.plusIcon} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Add File Modal */}
            {isAdmin && (
                <Modal
                    visible={fileModalVisible}
                    transparent
                    onRequestClose={() => setFileModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalBackground}
                        onPress={() => setFileModalVisible(false)}
                    >
                        <Pressable
                            style={styles.modalContainer}
                            onPress={(e) => {
                                if (e.target === e.currentTarget) {
                                    e.stopPropagation();
                                }
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => setFileModalVisible(false)}
                                style={styles.modalBackButton}
                            >
                                <Image
                                    source={backArrow}
                                    style={styles.backArrowIcon}
                                    pointerEvents="none"
                                />
                            </TouchableOpacity>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalHeaderText}>
                                    Create
                                </Text>
                            </View>
                            <View style={styles.pickFileContainer}>
                                <Text style={styles.uploadFileText}>
                                    Upload File:
                                </Text>
                                <TouchableOpacity
                                    onPress={pickFile}
                                    style={styles.pickFileButton}
                                >
                                    <Text style={styles.pickFileText}>
                                        Pick File
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <WebFileInput />
                            <Text style={styles.selectedFileText}>
                                Selected File:{" "}
                                {Platform.OS !== "web" ? (
                                    <>
                                        {uploadedFile
                                            ? uploadedFile.assets[0].name
                                            : "N/A"}
                                    </>
                                ) : (
                                    <>
                                        {uploadedFile
                                            ? uploadedFile.name
                                            : "N/A"}
                                    </>
                                )}
                            </Text>

                            <View style={styles.uploadContainer}>
                                <TouchableOpacity
                                    onPress={sendFile}
                                    style={[
                                        styles.uploadButton,
                                        !uploadedFile
                                            ? styles.disabledButton
                                            : null,
                                    ]}
                                    disabled={!uploadedFile}
                                >
                                    <Text style={styles.uploadText}>
                                        Upload File
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalDivider} />
                            <View style={styles.newFolderContainer}>
                                <Text style={styles.newFolderText}>
                                    New Folder:
                                </Text>
                                <TextInput
                                    style={styles.newFolderInput}
                                    value={newFolderName}
                                    onChangeText={setNewFolderName}
                                    placeholder="Enter new folder name..."
                                    placeholderTextColor="#888"
                                />
                            </View>

                            <View style={styles.createFolderContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.createFolderButton,
                                        newFolderName.length <= 0
                                            ? styles.disabledButton
                                            : null,
                                    ]}
                                    disabled={newFolderName.length <= 0}
                                    onPress={createFolder}
                                >
                                    <Text style={styles.createFolderText}>
                                        Create Folder
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    addContainer: {
        position: "absolute",
        right: 20,
        bottom: 100,
    },
    add: {
        flex: 1,
    },
    plusIcon: {
        flex: 1,
        width: 50,
        height: 50,
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
    searchContainer: {
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

    searchIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    textInput: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 8,
        fontSize: 16,
    },

    usageContainer: {
        marginLeft: 20,
    },

    usageText: {},

    currentFolderContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 15,
    },

    backArrowIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
        marginRight: 10,
    },

    folderIcons: {
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        resizeMode: "contain",
        marginTop: 10,
    },

    currentFolderText: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "start",
    },

    modalBackground: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 12,
        zIndex: 5,
        position: "relative",
    },

    modalBackButton: {
        position: "absolute",
        top: 20,
        left: 15,
        width: 20,
        height: 20,
        zIndex: 10,
    },

    modalHeader: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },

    modalHeaderText: {
        fontSize: 30,
        fontWeight: "bold",
    },

    pickFileContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-evenly",
        flexDirection: "row",
        marginHorizontal: 50,
    },

    uploadFileText: {
        fontSize: 20,
    },

    pickFileButton: {
        backgroundColor: Colors.greenButton,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },

    pickFileText: {
        fontSize: 20,
    },

    selectedFileText: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        marginTop: 10,
        fontSize: 20,
    },

    uploadContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    uploadButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 10,
        marginTop: 20,
    },
    uploadText: {
        fontSize: 20,
        fontWeight: "bold",
    },

    modalDivider: {
        borderBottomColor: Colors.greenRegular,
        borderBottomWidth: 3,
        marginVertical: 30,
    },

    newFolderContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginHorizontal: 20,
    },

    newFolderText: {
        marginRight: 10,
        fontSize: 20,
    },

    newFolderInput: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.greyTextBox,
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        justifyContent: "space-between",
        flex: 1,
    },

    createFolderContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    createFolderButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.greenButton,
        padding: 10,
        borderRadius: 10,
        marginTop: 20,
    },

    createFolderText: {
        fontSize: 20,
        fontWeight: "bold",
    },

    disabledButton: {
        opacity: 0.3,
        backgroundColor: Colors.greyTextBox,
    },
});

export default InformationPage;
