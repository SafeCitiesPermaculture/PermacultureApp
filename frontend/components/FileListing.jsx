import Colors from "@/constants/Colors";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const FileListing = ({ file, displayFile, deleteFile }) => {
    return (
        <View style={styles.container}>
            <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{file.name}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.displayButton}
                    onPress={() => displayFile(file._id)}
                >
                    <Text style={styles.displayButtonText}>Download File</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteFile(file._id)}
                >
                    <Text style={styles.deleteButtonText}>Delete File</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        backgroundColor: Colors.greenRegular,
        margin: 10,
        height: 50,
    },

    nameContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "40%",
    },

    nameText: {
        fontSize: 18,
    },

    buttonContainer: {
        flex: 1,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
    },

    displayButton: {
        backgroundColor: Colors.greenButton,
        padding: 5,
        borderRadius: 5,
    },

    displayButtonText: {
        fontSize: 15,
    },

    deleteButton: {
        backgroundColor: Colors.errorRed,
        padding: 5,
        borderRadius: 5,
    },

    deleteButtonText: {
        fontSize: 15,
    },
});

export default FileListing;
