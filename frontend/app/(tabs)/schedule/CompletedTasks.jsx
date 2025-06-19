import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import Colors from "@/constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import TaskCard from "@/components/TaskCard";
import API from "@/api/api";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";

const { width } = Dimensions.get("window");

const CompletedTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [incompletingTasks, setIncompletingTasks] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const deleteButton = require("@/assets/images/trash-can.png");
    
    const getTasks = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const response = await API.get("/tasks/completed");
            const fetchedTasks = response.data.tasks.map((task) => ({
                ...task,
                dueDateTime: new Date(task.dueDateTime),
            }));
            setTasks(fetchedTasks);
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

    const toggleTaskCompletion = useCallback((taskId, isSelected) => {
        setSelectedTasks(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (isSelected) {
                newSelected.delete(taskId);
            } else {
                newSelected.add(taskId);
            }
            return newSelected;
            });
    }, []);

    const handleMarkSelectedCompleted = async () => {
        if (selectedTasks.size === 0) {
            setErrorMessage("No tasks selected to mark as incomplete.");
            return;
        }

        setIncompletingTasks(true);
        setErrorMessage("");
        try {
            const promises = Array.from(selectedTasks).map(taskId => 
                API.put(`/tasks/incomplete/${taskId}`)
            );
            await Promise.all(promises);
            setErrorMessage("Selected tasks marked as incompleted!");
            setSelectedTasks(new Set());
            console.log("Getting again");
            getTasks();
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIncompletingTasks(false);
        }
    };

     const deleteTask = useCallback(async (taskId) => {
      Alert.alert(
        "Deleting task",
        "Are you sure you want to delete this task", 
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive",
            onPress: async () => {
              setDeletingId(taskId);
              setErrorMessage("");
              try {
                  await API.delete(`/tasks/${taskId}`);
                  getTasks();
              } catch (error) {
                  setErrorMessage(error.message);
              } finally {
                setDeletingId(null);
              }
            }
          }
        ]
      );
  }, [getTasks]);

    const handleMassDelete = async () => {
        if (selectedTasks.size === tasks.length) {
            Alert.alert("No tasks to be deleted. Only completed, checked tasks will be deleted.");
            return;
        }

        Alert.alert(
            "Deleting tasks",
            `Are you sure you want to delete ${tasks.length - selectedTasks.size} completed tasks?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try{
                            const promises = Array.from(tasks).map(task => {
                            if (selectedTasks.has(task._id)) { // Don't delete tasks that are presently unchecked
                                return;
                            }
                            return API.delete(`/tasks/${task._id}`);
                            });
                            await Promise.all(promises);
                            getTasks();
                        } catch (error) {
                            setErrorMessage(error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };


    return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>Completed Tasks</Text>
        <View style={styles.taskArea}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.greenRegular} />
          ) : errorMessage ? (
            <Text style={[styles.message, { color: "red" }]}>{errorMessage}</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.message}>You have no completed tasks!</Text>
          ) : (
            tasks.map((task) => (
              <TaskCard task={task} key={task._id} isChecked={!selectedTasks.has(task._id)} toggleCompletion={toggleTaskCompletion} deleting={deletingId?.toString() === task._id.toString()} onDelete={() => deleteTask(task._id)} />
            ))
          )}
        </View>
      </ScrollView>

      {selectedTasks.size > 0 && (
        <TouchableOpacity
          onPress={handleMarkSelectedCompleted}
          style={styles.completeButton}
          disabled={incompletingTasks}
        >
          {incompletingTasks ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>
              Mark {selectedTasks.size} Task(s) Not Completed
            </Text>
          )}
        </TouchableOpacity>
      )}

      {tasks.length > 0 && <TouchableOpacity
            onPress={handleMassDelete}
            style={styles.deleteButton}
        >
            <Image
            source={deleteButton}
            style={styles.deleteButtonImage}
            />
        </TouchableOpacity>}

    </SafeAreaView>);
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollViewContent: {
        alignItems: 'center',
        flexGrow: 1,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.darkGray,
        marginBottom: 20,
    },
    taskArea: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        fontSize: 20,
        textAlign: 'center',
        color: Colors.gray,
    },
    completeButton: {
       position: "absolute",
        bottom: 100,
        left: 10,
        backgroundColor: Colors.brownMedium,
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
    deleteButton: {
        position: "absolute",
        bottom: 100,
        right: 2,
        backgroundColor: "transparent",
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButtonImage: {
        height: 50, 
        width: 50,

    },
});

export default CompletedTasksPage;