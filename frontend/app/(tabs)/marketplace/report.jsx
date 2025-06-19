import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Keyboard,
} from "react-native";
import API from "@/api/api";
import AuthGuard from "@/components/AuthGuard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useContext } from "react";
import Colors from "@/constants/Colors";
import { AuthContext } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";

const reportPage = () => {
    const { reportedUsername, reported } = useLocalSearchParams();
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const { userData } = useContext(AuthContext);
    const router = useRouter();
    const { showLoading, hideLoading } = useLoading();

    const handleSubmit = async () => {
        Keyboard.dismiss();

        if (userData.timesReported >= 3) {
            setMessage("Reported users cannot create reports");
            return;
        }

        if (!description.trim()) {
            setMessage("Description is required.");
            return;
        }

        setLoading(true);
        showLoading();
        setMessage("");
        try {
            const reportData = {
                reported,
                reportedBy: userData?._id,
                description: description.trim(),
            };

            const response = await API.post("/reports", reportData);
            setMessage("Report successfully created.");
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error creating report: ", error);
            setMessage(
                error.status == 409
                    ? "You have already reported this user"
                    : error.message
            );
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    return (
        <AuthGuard>
            <View style={styles.container}>
                <View
                    style={{ alignItems: "center", justifyContent: "center" }}
                >
                    <Text
                        style={{
                            textAlign: "center",
                            fontSize: 30,
                            fontWeight: "bold",
                        }}
                    >
                        Reporting {reportedUsername}
                    </Text>
                </View>
                <TextInput
                    placeholder="Enter a description of your report. Mention specific listing(s) or message(s) if applicable."
                    defaultvalue={description}
                    onChangeText={(newDescription) =>
                        setDescription(newDescription)
                    }
                    maxLength={500}
                    multiline={true}
                    numberOfLines={6}
                    style={styles.textInput}
                />
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.text}>Submit</Text>
                </TouchableOpacity>
                {loading ? (
                    <></>
                ) : (
                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.message}>{message}</Text>
                    </View>
                )}
            </View>
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.brownLight,
        width: 300,
        marginTop: 15,
        fontSize: 16,
    },
    text: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    button: {
        backgroundColor: Colors.greenButton,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
        elevation: 2,
        marginTop: 10,
    },
    message: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.greenRegular,
    },
});

export default reportPage;
