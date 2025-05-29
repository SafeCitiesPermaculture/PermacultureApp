import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import colors from "@/constants/Colors.js";

// Icon imports
import homeIcon from "@/assets/images/home icon transparent.png";
import infoIcon from "@/assets/images/Info icon.png";
import marketIcon from "@/assets/images/marketplace icon.png";
import chatIcon from "@/assets/images/chat forum icon.png";
import scheduleIcon from "@/assets/images/schedule icon.png";
import profileIcon from "@/assets/images/profile icon.png";

export default function Menu() {
    return (
        <View style={styles.bottomRectangle}>
            <TouchableOpacity style={styles.menuItem}>
                <Image source={homeIcon} style={styles.icon} />
                <Text style={styles.label}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Image source={marketIcon} style={styles.icon} />
                <Text style={styles.label}>Marketplace</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Image source={infoIcon} style={styles.icon} />
                <Text style={styles.label}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Image source={chatIcon} style={styles.icon} />
                <Text style={styles.label}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Image source={scheduleIcon} style={styles.icon} />
                <Text style={styles.label}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
                <Image source={profileIcon} style={styles.icon} />
                <Text style={styles.label}>Profile</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomRectangle: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 85,
        backgroundColor: colors.menuBrown,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    menuItem: {
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: 24,
        height: 24,
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: "black", // Adjust color as needed
    },
});
