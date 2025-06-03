// Main page for Safe Cities admin
import React from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import safeCitiesLogo from "@/assets/images/logo.png";
import { useRouter, usePathname } from "expo-router";
import Colors from "@/constants/Colors";

const { width } = Dimensions.get("window");

export default function SchedulePage() {
  const router = useRouter();
  const pathname = usePathname();

  const buttons = [
    {
      label: "Schedule Workers",
      onPress: () => {
        if (pathname !== "/schedule/TaskManager") {
          router.push("/schedule/TaskManager");
        }
      },
    },
    {
    label: "View Daily Reports",
      onPress: () => {
        if (pathname !== "/schedule/DailyReport") {
          router.push("/schedule/DailyReport");
        }
      },
    },
    {
      label: "Create Personal Schedule",
      onPress: () => {
        if (pathname !== "/schedule/PersonalSchedule") {
          router.push("/schedule/PersonalSchedule");
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.adminView}>
      <ScrollView style={styles.adminView}>
        <Image source={safeCitiesLogo} style={styles.logo} />

        {buttons.map((btn, index) => (
          <TouchableOpacity key={index} style={styles.button} onPress={btn.onPress}>
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  adminView: {
    flex: 1,
    backgroundColor: Colors.backgroundTan,
  },
  logo: {
    width: width * 0.9,
    height: width * 0.5,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 16,
  },
  button: {
    backgroundColor: Colors.greenButton,
    padding: 25,
    marginVertical: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",

  },
});
