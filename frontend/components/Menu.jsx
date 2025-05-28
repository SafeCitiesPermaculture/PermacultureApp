import React from "react";
import {
    View,
    ScrollView,
    Text,
    Button,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import colors from "@/constants/Colors.js";

export default function Menu() {
    return <View style={styles.bottomRectangle} />;
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bottomRectangle: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        backgroundColor: colors.menuBrown,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
});
