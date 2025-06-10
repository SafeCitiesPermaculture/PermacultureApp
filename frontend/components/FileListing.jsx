import Colors from "@/constants/Colors";
import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import folders from "@/assets/images/folder 2 icon.png";
import { AuthContext } from "@/context/AuthContext";

const FileListing = ({ file, displayFile, deleteFile, enterFolder }) => {
    const { isAdmin } = useContext(AuthContext);

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={() => {
                if (file.isFolder) {
                    enterFolder(file);
                } else {
                    displayFile(file._id);
                }
            }}
        >
            <View
                style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Image
                    source={file.isFolder ? folders : ""}
                    style={styles.folderIcons}
                />
                <View style={styles.textContent}>
                    <Text style={styles.searchText}>{file.name}</Text>
                    {isAdmin && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteFile(file._id)}
                        >
                            <Text style={styles.deleteButtonText}>X</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    folderIcons: {
        width: 40,
        height: 40,
        alignItems: "center",
        resizeMode: "contain",
        marginTop: 5,
        marginRight: 10,
        padding: 10,
    },
    searchText: {
        color: "#555",
        fontSize: 16,
    },
    button: {
        flex: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.brownLight,
        borderRadius: 5,
        height: 45,
        justifyContent: "space-between",
        borderWidth: 1, // Thickness of the border
        borderColor: "black",
    },

    textContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    deleteButton: {
        backgroundColor: Colors.greenButton,
        padding: 5,
        marginRight: 20,
        borderRadius: 5,
        height: "80%",
        aspectRatio: 1 / 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    deleteButtonText: {
        fontSize: 20,
        fontWeight: "bold",
    },
});

export default FileListing;
