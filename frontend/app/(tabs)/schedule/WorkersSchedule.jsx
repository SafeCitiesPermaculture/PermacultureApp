import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  Button,
} from "react-native";
import safeCitiesLogo from "@/assets/images/logo.png";
import { useRouter, usePathname } from "expo-router";
import Colors from "@/constants/Colors";
import addIcon from "@/assets/images/Add _ plus icon.png";
import { Picker } from '@react-native-picker/picker';
import API from "@/api/api";
import PersonalScheduleComponent from "@/components/PersonalScheduleComponent";
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get("window");


export default function WorkersPage(){

    return (
        <SafeAreaView style={styles.personalschedule}>
          <ScrollView style={styles.personalschedule}>
            <Text style={styles.header}> Schedule </Text>

          {schedules.map((item) => (
                  <WorkersComponent key={item._id} task={item} />
                ))}
        </ScrollView>
        </SafeAreaView>

    );
    }

const styles = StyleSheet.create({
    personalschedule: {
        flex: 1,
        backgroundColor: Colors.backgroundTan,
      },
      header: {
        fontSize: 40,
        color: "#000",
        fontWeight: "bold",
        textDecorationLine: "underline",
        textAlign: "center",
      },
    })