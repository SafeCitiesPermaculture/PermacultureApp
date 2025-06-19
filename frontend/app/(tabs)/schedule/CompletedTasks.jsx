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
import DeleteModal from "@/components/DeleteModal";
import { useLoading } from "@/context/LoadingContext";

const { width } = Dimensions.get("window");

const CompletedTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [incompletingTasks, setIncompletingTasks] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [toBeDeletedId, setToBeDeletedId] = useState(null);
    const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    
    const { showLoading, hideLoading } = useLoading();

    const deleteButton = require("@/assets/images/trash-can.png");
    
    const getTasks = useCallback(async () => {
        showLoading();
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
            hideLoading();
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
        showLoading();
        try {
            const promises = Array.from(selectedTasks).map(taskId => 
                API.put(`/tasks/incomplete/${taskId}`)
            );
            await Promise.all(promises);
            setErrorMessage("Selected tasks marked as incomplete!");
            setSelectedTasks(new Set());
            getTasks();
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIncompletingTasks(false);
            hideLoading();
        }
    };

    const deleteTask = useCallback(async (taskId) => {
      setDeletingId(taskId);
      setErrorMessage("");
      try {
          await API.delete(`/tasks/${taskId}`);
          getTasks();
      } catch (error) {
          setErrorMessage(error.response?.data?.message || error.message);
      } finally {
        setDeletingId(null);
        setDeleteModalVisible(false);
        setToBeDeletedId(null);
      }
  }, [getTasks]);
    
    const handleDelete = useCallback((taskId) => {
        setDeletingId(null);
        setToBeDeletedId(taskId);
        setDeleteModalVisible(true);
    }, []);

    const deleteAll = useCallback(async () => {
        showLoading();
        setDeletingAll(true);
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
            setErrorMessage(error.response?.data?.message || error.message);
        } finally {
            hideLoading();
            setDeletingAll(false);
            setDeleteAllModalVisible(false);
        }
    }, [getTasks]);

    const handleMassDelete = async () => {
        if (selectedTasks.size === tasks.length) {
            setErrorMessage("No tasks to be deleted. Only completed, checked tasks will be deleted.");
            return;
        }

        setDeleteAllModalVisible(true);
    };


    return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>Completed Tasks</Text>
        <View style={styles.taskArea}>
          {errorMessage ? (
            <Text style={[styles.message, { color: "red" }]}>{errorMessage}</Text>
          ) : tasks.length === 0 ? (
            <Text style={styles.message}>You have no completed tasks!</Text>
          ) : (
            tasks.map((task) => (
              <TaskCard task={task} key={task._id} isChecked={!selectedTasks.has(task._id)} toggleCompletion={toggleTaskCompletion} deleting={deletingId?.toString() === task._id.toString()} onDelete={() => handleDelete(task._id)} />
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
      
      <DeleteModal
        isVisible={deleteModalVisible}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        onConfirm={() => deleteTask(toBeDeletedId)}
        onCancel={() => {
          setDeletingId(null);
          setToBeDeletedId(null);
          setDeleteModalVisible(false);
        }}
        isLoading={!!deletingId}
        />
      
      <DeleteModal
        isVisible={deleteAllModalVisible}
        title="Delete All Tasks"
        message="Are you sure you want to delete all tasks?"
        onConfirm={() => deleteAll()}
        onCancel={() => {
          setDeleteAllModalVisible(false);
        }}
        isLoading={deletingAll}
        />
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