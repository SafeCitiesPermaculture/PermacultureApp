import {
    Text,
    View,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Keyboard,
    ActivityIndicator,
    Image,
    Platform,
} from "react-native";
import React, { useState, useContext } from "react";
import AuthGuard from "@/components/AuthGuard";
import { AuthContext } from "@/context/AuthContext";
import API from "@/api/api";
import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import { useImagePicker } from "@/hooks/useImagePicker";

const PostListingPage = () => {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [message, setMessage] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const { userData, isAuthenticated } = useContext(AuthContext);
    const router = useRouter();

    const { pickImage, WebImageInput } = useImagePicker(setImage);

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

        if (userData.timesReported >= 3 || userData.isRemoved) {
            setMessage("Reported users cannot make new listings");
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

        if (!image) {
            setMessage("Image is required.");
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
            // populate form data
            const listingData = new FormData();

            if (Platform.OS === "web") {
                listingData.append("image", image.fileObject, image.name);
            } else {
                listingData.append("image", {
                    uri: image.uri,
                    name: image.name,
                    type: image.type,
                });
            }
            listingData.append("title", title.trim());
            listingData.append("price", numericPrice);
            listingData.append("location", location.trim());
            listingData.append("description", description.trim());

            const response = await API.post("/listings/post", listingData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setTitle("");
            setPrice("");
            setLocation("");
            setDescription("");
            setImage(null);
            setMessage("Listing created successfully");
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error creating listing: ", error);
            setMessage(error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthGuard>
            <View style={styles.header}>
                <View style={styles.form}>
                    <Text style={styles.title}>Create new listing</Text>
                    <TouchableOpacity style={styles.imageButton}>
                        <Text
                            style={styles.chooseImageText}
                            onPress={pickImage}
                        >
                            Choose image*
                        </Text>
                        <WebImageInput />
                    </TouchableOpacity>
                    {image && (
                        <Image
                            source={{ uri: image.uri }}
                            style={{
                                width: 100,
                                height: 100,
                                marginVertical: 10,
                            }}
                        />
                    )}
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
                        textAlignVertical="center"
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
                            color={Colors.greenButton}
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
        fontSize: 16,
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
        marginVertical: 10,
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
    imageButton: {
        padding: 10,
        backgroundColor: Colors.greenButton,
        borderRadius: 5,
        marginVertical: 10,
    },
    chooseImageText: {
        fontSize: 20,
    },
});

export default PostListingPage;
