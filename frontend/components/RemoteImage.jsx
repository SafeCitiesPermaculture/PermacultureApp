import React, { useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import ErrorImage from "@/assets/images/errorImage.jpg";

//This image component is meant to be used in places where an image may take a while to load
const RemoteImage = ({ imgSource, containerStyle, imgStyle }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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
                    source={imgSource}
                    style={[StyleSheet.absoluteFill, imgStyle]}
                    resizeMode="cover"
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                />
            )}
        </View>
    );
};

export default RemoteImage;
