// this page is how the admin can schedule workers

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
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get("window");

export default function ScheduleWorkersPage() {
     const newSchedule = { task, date, time };

        try {
          const response = await API.post("/WorkersSchedule", { schedule: newSchedule });
          await fetchSchedules();
        } catch (error) {
          console.error("Error saving schedule:", error);
        }

        setTask("");
        setDate(null);
        setTime(null);
        setModalVisible(false);
      };

      const fetchSchedules = async () => {
        try {
          const response = await API.get("/WorkersSchedule");
          setSchedules(response.data);
        } catch (error) {
          console.error("Error fetching schedules:", error.message);
        }
      };

      useEffect(() => {
        fetchSchedules();
      }, []);

      const showMode = (modeType) => {
        setMode(modeType);
        setShowPicker(true);
      };

      const onChange = (event, selectedDateTime) => {
        if (Platform.OS === "android") {
          if (event.type === "dismissed") {
            setShowPicker(false);
            return;
          }
          setShowPicker(false);
        }

        if (selectedDateTime) {
          if (mode === "date") {
            const onlyDate = new Date(
              selectedDateTime.getFullYear(),
              selectedDateTime.getMonth(),
              selectedDateTime.getDate()
            );
            setDate(onlyDate);
          } else if (mode === "time") {
            const onlyTime = new Date();
            onlyTime.setHours(selectedDateTime.getHours());
            onlyTime.setMinutes(selectedDateTime.getMinutes());
            setTime(onlyTime);
          }
        }
      };

      const formatDate = (d) => d ? d.toDateString() : 'No date selected';
      const formatTime = (t) => t ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time selected';



    return(
        <SafeAreaView style={styles.page}>
          <ScrollView style={styles.page}>
                <Text style={styles.header}> Schedule Workers </Text>

                 <Text style={styles.Subheader}>Create Task</Text>
                  <View style={styles.PromptsContainer}>
                    <Text style={styles.prompts}>Task</Text>
                    <View style={styles.InputBox}>
                      <TextInput
                        style={styles.textInput}
                        value={task}
                        onChangeText={setTask}
                      />
                    </View>
                  </View>

                  <View style={styles.picker}>
                    <Text style={styles.textInput}>Date: {formatDate(date)}</Text>
                    <Text style={styles.textInput}>Time: {formatTime(time)}</Text>

                    <View style={styles.buttonGroup}>
                      <Button title="Pick Date" onPress={() => showMode("date")} color={Colors.brownMedium} />
                      <Button title="Pick Time" onPress={() => showMode("time")} color={Colors.brownMedium}  />

                    </View>

                    {showPicker && (
                      <DateTimePicker
                        value={new Date()}
                        mode={mode}
                        is24Hour={true}
                        display="default"
                        onChange={onChange}
                      />
                    )}
                  </View>

                  <TouchableOpacity onPress={handleSaveSchedule} style={styles.closeButton}>
                    <Text style={{ color: "white" }}>Save Task</Text>
                  </TouchableOpacity>

        </ScrollView>
        </SafeAreaView>
        );
    }


const styles = StyleSheet.create({
     page: {
       backgroundColor: Colors.backgroundTan,
       flex: 1,
     },
     header: {
       fontSize: 40,
       color: "#000",
       fontWeight: "bold",
       textDecorationLine: "underline",
       textAlign: "center",
     },
   });