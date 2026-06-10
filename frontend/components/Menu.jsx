import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import colors from "@/constants/Colors.js";
import { useRouter, usePathname } from "expo-router";

// Icon imports
import homeIcon from "@/assets/images/home icon transparent.png";
import infoIcon from "@/assets/images/Info icon.png";
import scheduleIcon from "@/assets/images/schedule icon.png";
import profileIcon from "@/assets/images/profile icon.png";
import assistantIcon from "@/assets/images/assistant icon.png";

export default function Menu({ state, navigation }) {
    const router = useRouter();
    const pathname = usePathname(); // <-- current path

    const currentTabIndex = state.index;
    const currentRouteName = state.routes[currentTabIndex].name;

    const menuItems = [
        { label: "Home", icon: homeIcon, route: "home" },
        { label: "Documents", icon: infoIcon, route: "documents" },
        { label: "Schedule", icon: scheduleIcon, route: "schedule" },
        { label: "Profile", icon: profileIcon, route: "profile" },
        { label: "Assistant", icon: assistantIcon, route: "chatbot" },
    ];

    return (
        <View style={styles.bottomRectangle}>
            {menuItems.map((item, index) => {
                const isCurrentTab = currentRouteName === item.route;

                return (
                    <TouchableOpacity
                        key={item.label}
                        style={styles.menuItem}
                        onPress={() => {
                            if (!isCurrentTab) {
                                navigation.navigate(item.route);
                            } else {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: item.route }],
                                });
                            }
                        }}
                    >
                        {item.icon ? (
                            <Image source={item.icon} style={styles.icon} />
                        ) : null}
                        <Text style={styles.label}>{item.label}</Text>
                    </TouchableOpacity>
                );
            })}
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
        height: 30,
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: "black", // Adjust color as needed
    },
});
