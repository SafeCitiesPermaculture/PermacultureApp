import React from "react";
import { View, ActivityIndicator, StyleSheet, Dimensions } from "react-native";

const LoadingOverlay = () => {
    return (
        <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#ffffff" />
        </View>
    );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        elevation: 10,
    },
});

export default LoadingOverlay;
