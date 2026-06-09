import React, { useState } from "react";
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import { useImagePicker } from "@/hooks/useImagePicker";

/**
 * Modal shown when completing task(s). Lets the worker optionally record HOW the
 * task was done (a note + a photo) so admins can review it later. Both fields are
 * optional — completing with nothing is still allowed.
 *
 * onConfirm receives ({ note, photo }) where photo is the picked image object
 * (or null). The note/photo apply to every task being completed.
 */
const CompletionModal = ({ isVisible, count, onConfirm, onCancel, isLoading }) => {
    const [note, setNote] = useState("");
    const [photo, setPhoto] = useState(null);
    const { pickImage, WebImageInput } = useImagePicker(setPhoto);

    const reset = () => {
        setNote("");
        setPhoto(null);
    };

    const handleConfirm = () => {
        onConfirm({ note: note.trim(), photo });
        reset();
    };

    const handleCancel = () => {
        reset();
        onCancel();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.header}>
                        Complete {count > 1 ? `${count} Tasks` : "Task"}
                    </Text>
                    <Text style={styles.subtext}>
                        Optionally describe how it was done.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Notes (optional)"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                        <Text style={styles.photoButtonText}>
                            {photo ? "Change Photo" : "Add Photo (optional)"}
                        </Text>
                    </TouchableOpacity>
                    <WebImageInput />

                    {photo && (
                        <Image source={{ uri: photo.uri }} style={styles.preview} />
                    )}
                    {count > 1 && photo && (
                        <Text style={styles.warnText}>
                            This photo & note apply to all {count} selected tasks.
                        </Text>
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Complete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    content: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 30,
        width: "85%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 12,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtext: {
        fontSize: 14,
        color: Colors.darkGray,
        marginBottom: 15,
        textAlign: "center",
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        minHeight: 70,
        textAlignVertical: "top",
        color: Colors.darkGray,
    },
    photoButton: {
        borderWidth: 1,
        borderColor: "black",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: Colors.brownLight,
        marginBottom: 10,
    },
    photoButtonText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    preview: {
        width: 120,
        height: 120,
        borderRadius: 10,
        marginBottom: 10,
        resizeMode: "cover",
    },
    warnText: {
        fontSize: 12,
        color: Colors.darkGray,
        marginBottom: 10,
        textAlign: "center",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 5,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: "#ffbaba",
    },
    confirmButton: {
        backgroundColor: Colors.greenRegular,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
    },
});

export default CompletionModal;
