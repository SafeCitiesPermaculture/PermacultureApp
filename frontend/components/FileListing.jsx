import Colors from "@/constants/Colors";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import folders from "@/assets/images/folder 2 icon.png";

const FileListing = ({ file, displayFile, deleteFile, enterFolder }) => {
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
                    flexDirection: "row",
                    alignItems: "center",
                }}
            >
                <Image
                    source={file.isFolder ? folders : ""}
                    style={styles.folderIcons}
                />
                <Text style={styles.searchText}>{file.name}</Text>
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
        marginRight: 10,
        padding: 10,
    },
    searchText: {
        color: "#555",
        fontSize: 16,
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
});

export default FileListing;
