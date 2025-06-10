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

export default function PersonalSchedulePage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [task, setTask] = useState("");
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState("date");

  const [schedules, setSchedules] = useState([]);

  const handleSaveSchedule = async () => {
    const newSchedule = { task, date, time };

    try {
      const response = await API.post("/schedulePersonal", { schedule: newSchedule });
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
      const response = await API.get("/schedulePersonal");
      setSchedules(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error.message);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const deleteTask = async (taskId) => {
    try {
      await API.delete(`/schedulePersonal/delete/${taskId}`);
      await fetchSchedules();
    } catch (error) {
      console.error("Error", error);
    }
  };

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

  return (
    <SafeAreaView style={styles.personalschedule}>
      <ScrollView style={styles.personalschedule}>
        <Text style={styles.header}> Schedule </Text>

        <View style={styles.add}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image source={addIcon} style={styles.plusIcon} />
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
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
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.closeButton, { backgroundColor: 'gray' }]}>
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {schedules.map((item) => (
          <PersonalScheduleComponent key={item._id} task={item} deleteTask={deleteTask} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scheduleItem: {
    flex: 1,
    height: 60,
    color: Colors.greenRegular,
  },
  taskContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.greenRegular,
    borderRadius: 5,
    height: 55,
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
  },
  checkBox: {
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: Colors.backgroundTan,
  },
  xText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "left",
    marginLeft: 15,
  },
  taskText: {
    fontSize: 18,
    color: "black",
    fontWeight: "bold",
  },
  subText: {
    font: 15,
    color: "dark gray",
  },
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
  Subheader: {
    fontSize: 25,
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
    textDecorationLine: "underline",
  },
   add: {
     position: "absolute",
     top: 675,
     right: 2,
   },
    plusIcon:{
       width: 60,
       height: 60,
       resizeMode: "contain",
      },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  PromptsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  prompts: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 2,
  },
  InputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.greyTextBox,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 50,
    flex: 1,
    justifyContent: "space-between",
  },
  textInput: {
    color: "black",
    fontSize: 15,
  },
  picker: {
    width: "100%",
    marginTop: 16,

  },
  buttonGroup: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",

  },
});
