import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Button,
  StyleSheet,
} from "react-native";
import Colors from "@/constants/Colors";
import API from "@/api/api";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width } = Dimensions.get("window");

export default function ScheduleWorkersPage() {
  const [task, setTask] = useState("");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("date");
  const [showPicker, setShowPicker] = useState(false);
  const [schedules, setSchedules] = useState([]);

  const showMode = (currentMode) => {
    setMode(currentMode);
    setShowPicker(true);
  };

  const handleSaveSchedule = async () => {
    const newSchedule = { task, date, time };

    try {
      const response =  await API.post("ScheduleWorkers", newSchedule);
      await fetchSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
    }

    setTask("");
    setDate(null);
    setTime(null);
  };

  const fetchSchedules = async () => {
    try {
      const response = await API.get("/ScheduleWorkers");
      setSchedules(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error.message);
    }
  };

//   useEffect(() => {
//     fetchSchedules();
//   }, []);

  const onChange = (event, selectedDateTime) => {
    setShowPicker(false); // hide picker after selection

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

  const formatDate = (d) => (d ? d.toDateString() : "No date selected");
const formatTime = (t) =>
  t
    ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    : "No time selected";

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView style={styles.page}>
        <Text style={styles.header}> Schedule Workers </Text>

        <Text style={styles.Subheader}>Create Task</Text>

        <View style={styles.PromptsContainer}>
          <Text style={styles.prompts}>Task</Text>
          <View style={styles.InputBox}>
            <TextInput style={styles.textInput} value={task} onChangeText={setTask} />
          </View>
        </View>

        <View style={styles.picker}>
          <Text style={styles.textInput}>Date: {formatDate(date)}</Text>
          <Text style={styles.textInput}>Time: {formatTime(time)}</Text>

          <View style={styles.buttonGroup}>
            <Button title="Pick Date" onPress={() => showMode("date")} color={Colors.brownMedium} />
            <Button title="Pick Time" onPress={() => showMode("time")} color={Colors.brownMedium} />
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

        <TouchableOpacity onPress={handleSaveSchedule} style={styles.saveButton}>
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
  Subheader: {
    fontSize: 20,
    margin: 10,
    textAlign: "left",
    fontWeight: "600",
  },
  PromptsContainer: {
    margin: 10,
  },
  prompts: {
    fontSize: 16,
    marginBottom: 5,
  },
  InputBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  textInput: {
    fontSize: 16,
  },
  picker: {
    margin: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: Colors.brownDark,
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButton: {
          backgroundColor: "black",
          padding: 10,
          borderRadius: 5,
          marginTop: 10,
          width: "100%",
          alignItems: "center",
      },
});
