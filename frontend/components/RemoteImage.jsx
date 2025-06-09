import React, { useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import ErrorImage from "@/assets/images/errorImage.jpg";
import { BACKEND_URL } from "@/api/api";
const PROXY_BASE_URL = `${BACKEND_URL}/files/file-proxy`;

//This image component is meant to be used in places where an image may take a while to load
const RemoteImage = ({ imgSource, containerStyle, imgStyle }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    function getSafeImageSource(rawImageSource) {
        // 1. Local image via require
        if (typeof rawImageSource === "number") return rawImageSource;

        // 2. Guard: Must be object with valid uri string
        if (
            typeof rawImageSource !== "object" ||
            rawImageSource === null ||
            typeof rawImageSource.uri !== "string"
        ) {
            return null;
        }

        const uri = rawImageSource.uri;

        // 3. Check for Google Drive pattern
        const isGoogleDrive = uri.includes("drive.google.com");

        if (isGoogleDrive) {
            const encoded = encodeURIComponent(uri);
            return { uri: `${PROXY_BASE_URL}?url=${encoded}` };
        }

        // 4. Normal image URL
        return rawImageSource;
    }

    return (
        <View style={containerStyle}>
            {loading && !error && (
                <ActivityIndicator
                    size="small"
                    color="#999"
                    style={StyleSheet.absoluteFill}
                />
            )}
            {error ? (
                <Image
                    source={ErrorImage}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            ) : (
                <Image
                    source={getSafeImageSource(imgSource)}
                    style={[StyleSheet.absoluteFill, imgStyle]}
                    resizeMode="cover"
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={(e) => {
                        //console.log(e);
                        setLoading(false);
                        setError(true);
                    }}
                />
            )}
        </View>
    );
};

export default RemoteImage;
