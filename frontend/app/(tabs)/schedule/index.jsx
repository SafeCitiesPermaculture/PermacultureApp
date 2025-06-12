// Main page for Safe Cities admin
import React, { useContext, useCallback, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import Colors from "@/constants/Colors";
import { AuthContext } from "@/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import TaskCard from "@/components/TaskCard";
import API from "@/api/api";
import DateTimePicker from "@react-native-community/datetimepicker";

const SchedulePage = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [completingTasks, setCompletingTasks] = useState(false);
  const { userData } = useContext(AuthContext);

  const postButton = require("@/assets/images/post-button.png");

  const getTasks = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await API.get("/tasks");
      setTasks(response.data.tasks);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getTasks();
    }, [getTasks])
  );

  const onDateChange = (event, date) => {
    const selectedDate = date >= new Date() ? date : newTaskDate; //Only allow dates from the future
    setShowDatePicker(Platform.OS === 'ios');
    setNewTaskDate(selectedDate);
  };

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) {
      setErrorMessage("Task name cannot be empty.");
      return;
    }

    if (newTaskName.length > 50) {
      setErrorMessage("Task name cannot be longer than 50 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await API.post("/tasks", {
        name: newTaskName,
        dueDateTime: newTaskDate,
        assignedTo: userData._id
      });

      if (response.status === 201) {
        setModalVisible(false);
        setNewTaskName("");
        setNewTaskDate(new Date());
        setShowDatePicker(false);
        getTasks();
      } else {
        setErrorMessage("Failed to create task with status: " + response.status);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCreateTask = () => {
    setModalVisible(false);
    setNewTaskName("");
    setNewTaskDate(new Date());
    setErrorMessage("");
    setShowDatePicker(false);
  };

  const onToggleTaskCompletion = useCallback((taskId, isSelected) => {
    setSelectedTasks(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) {
        newSelected.add(taskId);
      } else {
        newSelected.delete(taskId);
      }
      return newSelected;
    });
  }, []);

const handleMarkSelectedCompleted = async () => {
    if (selectedTasks.size === 0) {
      setErrorMessage("No tasks selected to mark as completed.");
      return;
    }

    setCompletingTasks(true);
    setErrorMessage("");

    try {
      const completionPromises = Array.from(selectedTasks).map(taskId =>
        API.put(`/tasks/complete/${taskId}`)
      );
      await Promise.all(completionPromises); // Wait for all completion requests to finish

      setErrorMessage("Selected tasks marked as completed!");
      setSelectedTasks(new Set());
      getTasks();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setCompletingTasks(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>Schedule</Text>
        <View style={styles.taskArea}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.greenRegular} />
          ) : errorMessage ? (
            <Text style={[styles.message, { color: "red" }]}>{errorMessage}</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.message}>You have no tasks remaining!</Text>
          ) : (
            tasks.map((task) => (
              <TaskCard task={task} key={task._id} isChecked={selectedTasks.has(task._id)} toggleCompletion={onToggleTaskCompletion} />
            ))
          )}
        </View>
      </ScrollView>

      {selectedTasks.size > 0 && (
        <TouchableOpacity
          onPress={handleMarkSelectedCompleted}
          style={styles.completeButton}
          disabled={completingTasks}
        >
          {completingTasks ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>
              Mark {selectedTasks.size} Task(s) Completed
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.postButton}
      >
        <Image
          source={postButton}
          style={styles.postButtonImage}
        />
      </TouchableOpacity>

      {/* Create Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelCreateTask}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Create New Task</Text>

            <TextInput
              style={styles.input}
              placeholder="Task Name"
              value={newTaskName}
              onChangeText={setNewTaskName}
              maxLength={50}
            />

            <View style={styles.datePickerContainer}>
              <Text style={styles.dateDisplay}>
                Due Date: {newTaskDate.toLocaleDateString()} {newTaskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} style={styles.selectDateButton}>
                <Text style={styles.selectDateButtonText}>Select Date & Time</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={newTaskDate}
                  mode="datetime"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {errorMessage && <Text style={styles.modalErrorMessage}>{errorMessage}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleCancelCreateTask} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateTask} style={[styles.modalButton, styles.createButton]}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Create Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  scrollViewContent: {
    alignItems: 'center',
    flexGrow: 1, // Allow content to grow
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 20
  },
  taskArea: {
    width: '95%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 20,
    textAlign: 'center',
    color: Colors.gray,
  },
  postButton: {
    position: "absolute",
    bottom: 100,
    right: 10,
    backgroundColor: "transparent",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  postButtonImage: {
    height: 50, 
    width: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.brownLight,
    borderRadius: 20, // Rounded corners for the modal
    padding: 25,
    width: "85%", // Adjust width for modal content
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: Colors.darkGray,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: Colors.white,
    color: Colors.darkGray,
  },
  datePickerContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: 'center',
  },
  dateDisplay: {
    fontSize: 16,
    color: Colors.darkGray,
    marginBottom: 10,
  },
  selectDateButton: {
    backgroundColor: Colors.blueRegular, // Blue for date selection
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  selectDateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalErrorMessage: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: Colors.redRegular, // Red for cancel
  },
  createButton: {
    backgroundColor: Colors.greenRegular, // Green for create
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  completeButton: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    backgroundColor: Colors.brownMedium, // Distinct color
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  completeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SchedulePage;
