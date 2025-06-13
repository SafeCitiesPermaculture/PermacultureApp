import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import TaskCard from "@/components/TaskCard";
import API from "@/api/api";

const CompletedTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [incompletingTasks, setIncompletingTasks] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    const getTasks = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const response = await API.get("/tasks/completed");
            console.log(response.data.tasks);
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
              <TaskCard task={task} key={task._id} isChecked={!selectedTasks.has(task._id)} toggleCompletion={toggleTaskCompletion} />
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
        width: '95%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        fontSize: 20,
        textAlign: 'center',
        color: Colors.gray,
    },
    completeButton: {
        position: 'absolute',
        bottom: 100,
        left: 50,
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

});

export default CompletedTasksPage;