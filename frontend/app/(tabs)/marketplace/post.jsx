import {
    Text,
    View,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Keyboard,
    ActivityIndicator,
} from "react-native";
import React, { useState, useContext } from "react";
import AuthGuard from "@/components/AuthGuard";
import { AuthContext } from "@/context/AuthContext";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";

const PostListingPage = () => {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { userData, isAuthenticated } = useContext(AuthContext);
    const router = useRouter();

    const handlePriceChange = (newPrice) => {
        const cleanedPrice = newPrice.replace(/[^0-9]/g, "");
        setPrice(cleanedPrice);
    };

    const handleSubmit = async () => {
        Keyboard.dismiss();

        if (!isAuthenticated) {
            setMessage(
                "Unauthorized action: User must be logged in and verified to post."
            );
            return;
        }

        if (!title.trim()) {
            setMessage("Listing title is required.");
            return;
        }

        if (!price.trim()) {
            setMessage("Listing price is required.");
            return;
        }

        if (!location.trim()) {
            setMessage("Location is required.");
            return;
        }

        const numericPrice = parseInt(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            setMessage("Please enter a positive, numeric price.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const listingData = {
                title: title.trim(),
                price: numericPrice,
                location: location.trim(),
                description: description.trim(),
                postedBy: userData._id,
            };

            const response = await API.post("/listings/post", listingData);

            setMessage("Listing created successfully");
            setTitle("");
            setPrice("");
            setLocation("");
            setDescription("");
            setTimeout(() => router.dismiss(), 1500);
        } catch (error) {
            console.error("Error creating listing: ", error);

            if (error.response) {
                // Handle axios errors
                const statusCode = error.response.status;
                const backendMessage =
                    error.response.data.message ||
                    "An unknown error occurred on the server.";
                const backendErrors = error.response.data.errors;

                let displayMessage = `Error ${statusCode}: ${backendMessage}`;

                if (backendErrors && backendErrors.length > 0) {
                    displayMessage += `\nDetails:\n${backendErrors.join("\n")}`;
                } else if (statusCode === 401) {
                    displayMessage =
                        "Authentication failed. Please log in again.";

                    router.push("/login");
                }

                setMessage(displayMessage);
            } else if (error.request) {
                setMessage("Network error");
            } else {
                setMessage(`Error creating listing: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <View style={styles.header}>
                <View style={styles.form}>
                    <Text style={styles.title}>Create new listing</Text>
                    <TextInput
                        placeholder="Listing title*"
                        onChangeText={(newTitle) => setTitle(newTitle)}
                        defaultValue={title}
                        style={styles.inputField}
                        maxLength={100}
                        numberOfLines={1}
                    />
                    <TextInput
                        placeholder="Price*"
                        defaultValue={price}
                        style={styles.inputField}
                        inputMode="numeric"
                        keyboardType="numeric"
                        onChangeText={handlePriceChange}
                        maxLength={10}
                        numberOfLines={1}
                    />
                    <TextInput
                        placeholder="Location*"
                        defaultValue={location}
                        style={styles.inputField}
                        onChangeText={(newLocation) => setLocation(newLocation)}
                        maxLength={100}
                        numberOfLines={1}
                    />
                    <TextInput
                        placeholder="Longer description"
                        defaultValue={description}
                        style={styles.inputField}
                        onChangeText={(newDescription) =>
                            setDescription(newDescription)
                        }
                        multiline={true}
                        maxLength={500}
                        numberOfLines={3}
                        rows={3}
                    />
                    {loading && (
                        <ActivityIndicator
                            size="large"
                            color={Colors.greenRegular}
                            style={styles.loadingWheel}
                        />
                    )}
                    {message ? (
                        <Text style={styles.message}>{message}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={styles.postButton}
                        onPress={handleSubmit}
                    >
                        <Text>Post Listing</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AuthGuard>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: 1,
        flexDirection: "column",
        backgroundColor: Colors.backgroundTan,
        paddingTop: 5,
        alignItems: "center",
    },
    inputField: {
        borderColor: "grey",
        borderWidth: 1,
        width: 300,
        textAlign: "center",
        margin: 5,
        backgroundColor: Colors.greyTextBox,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        paddingBottom: 10,
    },
    postButton: {
        backgroundColor: Colors.greenButton,
        padding: 15,
        marginTop: 10,
    },
    loadingWheel: {
        marginTop: 10,
        marginBottom: 10,
    },
    message: {
        marginTop: 10,
        fontSize: 14,
        color: "red",
        textAlign: "center",
    },
    form: {
        backgroundColor: Colors.greenRegular,
        alignItems: "center",
        flexShrink: 1,
        width: "auto",
        height: "auto",
        padding: 20,
    },
});

export default PostListingPage;
