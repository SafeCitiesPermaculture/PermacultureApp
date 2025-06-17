// Main page for Safe Cities admin
import React, { useContext, useCallback, useState, useEffect } from "react";
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
    Alert,
} from "react-native";
import Colors from "@/constants/Colors";
import { AuthContext } from "@/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import TaskCard from "@/components/TaskCard";
import API from "@/api/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Picker } from "@react-native-picker/picker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowList: true,
    }),
});

const SchedulePage = () => {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [newTaskName, setNewTaskName] = useState("");
    const [newTaskDate, setNewTaskDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [completingTasks, setCompletingTasks] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [safeCitiesWorkers, setSafeCitiesWorkers] = useState([]);
    const [assignedTo, setAssignedTo] = useState(null);
    const [showWorkerPicker, setShowWorkerPicker] = useState(false);
    const { userData, isAdmin } = useContext(AuthContext);
    const router = useRouter();

    const postButton = require("@/assets/images/post-button.png");
    const greenCheckMark = require("@/assets/images/green-check-mark.png");

    // Request notification permissions when the component mounts
    useEffect(() => {
        (async () => {
            if (Platform.OS !== "web") {
                const { status: existingStatus } =
                    await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== "granted") {
                    const { status } =
                        await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== "granted") {
                    Alert.alert(
                        "Permission required",
                        "Please enable notifications in your device settings to receive task reminders."
                    );
                }
            }
        })();
    }, []);

    const scheduleTaskNotification = useCallback(async (task) => {
        if (!task.dueDateTime || Platform.OS === "web") {
            return;
        }

        const notificationIdentifier = `task-${task._id}`;

        // Calculate notification time to be 15 mins before task due
        const triggerTime = new Date(
            task.dueDateTime.getTime() - 15 * 60 * 1000
        );
        const hoursString = String(task.dueDateTime.getHours()).padStart(
            2,
            "0"
        );
        const minutesString = String(task.dueDateTime.getMinutes()).padStart(
            2,
            "0"
        );

        if (triggerTime < new Date()) {
            // Don't schedule notifications for the past
            return;
        }

        try {
            await Notifications.cancelScheduledNotificationAsync(
                notificationIdentifier
            ); // Cancel previously scheduleds

            await Notifications.scheduleNotificationAsync({
                identifier: notificationIdentifier,
                content: {
                    title: "Task Reminder!",
                    body: `Don't forget to complete: ${task.name} at ${hoursString}:${minutesString}`,
                    data: { taskId: task._id, taskName: task.name },
                    sound: "default",
                },
                trigger: {
                    type: "date",
                    date: triggerTime,
                },
            });
        } catch (error) {
            setErrorMessage(error.message);
            console.log(error.message);
        }
    }, []);

    const cancelTaskNotification = useCallback(async (taskId) => {
        if (Platform.OS !== "web") {
            const notificationIdentifier = `task-${taskId}`;
            await Notifications.cancelScheduledNotificationAsync(
                notificationIdentifier
            );
        }
    }, []);

    const getTasks = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const response = await API.get("/tasks");
            const fetchedTasks = response.data.tasks.map((task) => ({
                ...task,
                dueDateTime: new Date(task.dueDateTime),
            }));
            setTasks(fetchedTasks);

            if (Platform.OS !== "web") {
                fetchedTasks.forEach((task) => {
                    if (
                        task.dueDateTime >
                        new Date(new Date().getTime() + 15 * 60 * 1000)
                    ) {
                        scheduleTaskNotification(task);
                    }
                });
            }
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const getSafeCitiesWorkers = useCallback(async () => {
        if (!isAdmin) {
            setSafeCitiesWorkers([]);
            return;
        }
        try {
            const response = await API.get("/admin/safecities");
            setSafeCitiesWorkers(response.data.safeCitiesWorkers);
        } catch (error) {
            setSafeCitiesWorkers([]);
        }
    }, [isAdmin]);

    useFocusEffect(
        useCallback(() => {
            getTasks();
            if (isAdmin) {
                getSafeCitiesWorkers();
            }
        }, [getTasks])
    );

    const handleDateTimeSelection = () => {
        if (Platform.OS === "android") {
            setShowDatePicker(true);
        } else {
            setShowDatePicker(!showDatePicker);
        }
    };

    const onDateChangeAndroid = (event, selectedDate) => {
        setShowDatePicker(false);
        if (event?.type === "dismissed") return;
        if (selectedDate) {
            const updated = new Date(newTaskDate);
            updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setNewTaskDate(updated);
            setShowTimePicker(true);
        }
    };

    const onTimeChangeAndroid = (event, selectedTime) => {
        setShowTimePicker(false);
        if (event?.type === "dismissed") return;
        if (selectedTime) {
            const updated = new Date(newTaskDate);
            updated.setHours(selectedTime.getHours());
            updated.setMinutes(selectedTime.getMinutes());
            setNewTaskDate(updated);
        }
    };

    const onNativeDateChange = (event, date) => {
        const selectedDate = date >= new Date() ? date : newTaskDate; //Only allow dates from the future
        setShowDatePicker(Platform.OS === "ios");
        setNewTaskDate(selectedDate);
    };

    const onWebDateChange = (date) => {
        setNewTaskDate(date);
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
                assignedTo: assignedTo || userData._id,
            });

            if (response.status === 201) {
                setModalVisible(false);
                setNewTaskName("");
                setNewTaskDate(new Date());
                setShowDatePicker(false);
                setAssignedTo(null);
                setShowWorkerPicker(false);
                getTasks();
            } else {
                setErrorMessage(
                    "Failed to create task with status: " + response.status
                );
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

    const toggleTaskCompletion = useCallback((taskId, isSelected) => {
        setSelectedTasks((prevSelected) => {
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
            const completionPromises = Array.from(selectedTasks).map(
                async (taskId) => {
                    await API.put(`/tasks/complete/${taskId}`);
                    await cancelTaskNotification(taskId);
                }
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

    const deleteTask = useCallback(
        async (taskId) => {
            if (Platform.OS !== "web") {
                Alert.alert(
                    "Deleting task",
                    "Are you sure you want to delete this task",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                                setDeletingId(taskId);
                                setErrorMessage("");
                                try {
                                    await API.delete(`/tasks/${taskId}`);
                                    await cancelTaskNotification(taskId);
                                    getTasks();
                                } catch (error) {
                                    setErrorMessage(error.message);
                                } finally {
                                    setDeletingId(null);
                                }
                            },
                        },
                    ]
                );
            } else {
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
        },
        [getTasks]
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View
                    style={{
                        flexDirection: "row",
                        marginBottom: 20,
                        alignItems: "flex-start",
                        width: "100%",
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "flex-start",
                        }}
                    >
                        <TouchableOpacity
                            onPress={() =>
                                router.push("/schedule/CompletedTasks")
                            }
                        >
                            <Image
                                source={greenCheckMark}
                                style={styles.checkMark}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 2, justifyContent: "center" }}>
                        <Text style={styles.header}>Schedule</Text>
                    </View>
                </View>
                <View style={styles.taskArea}>
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={Colors.greenRegular}
                        />
                    ) : errorMessage ? (
                        <Text style={[styles.message, { color: "red" }]}>
                            {errorMessage}
                        </Text>
                    ) : tasks.length === 0 ? (
                        <Text style={styles.message}>
                            You have no tasks remaining!
                        </Text>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                task={task}
                                key={task._id}
                                isChecked={selectedTasks.has(task._id)}
                                toggleCompletion={toggleTaskCompletion}
                                onDelete={() => deleteTask(task._id)}
                                deleting={
                                    deletingId?.toString() ===
                                    task._id.toString()
                                }
                            />
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
                <Image source={postButton} style={styles.postButtonImage} />
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
                                Due Date: {newTaskDate.toLocaleDateString()}{" "}
                                {newTaskDate.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setShowDatePicker(!showDatePicker)
                                }
                                style={styles.selectDateButton}
                            >
                                <Text style={styles.selectDateButtonText}>
                                    Select Date & Time
                                </Text>
                            </TouchableOpacity>
                            {Platform.OS === "web" && showDatePicker ? (
                                <View style={styles.webDatePickerWrapper}>
                                    <DatePicker
                                    selected={newTaskDate}
                                    onChange={onWebDateChange}
                                    showTimeSelect
                                    dateFormat="Pp"
                                    minDate={new Date()}
                                    className="react-datepicker-custom-input"
                                    />
                                </View>
                                ) : null}

                                {Platform.OS === "ios" && showDatePicker ? (
                                <DateTimePicker
                                    testID="iosDateTimePicker"
                                    value={newTaskDate}
                                    mode="datetime"
                                    is24Hour={true}
                                    display="spinner"
                                    onChange={onNativeDateChange}
                                    minimumDate={new Date()}
                                />
                                ) : null}

                                {Platform.OS === "android" && showDatePicker ? (
                                <DateTimePicker
                                    testID="androidDatePicker"
                                    value={newTaskDate}
                                    mode="date"
                                    display="default"
                                    minimumDate={new Date()}
                                    onChange={(event, selectedDate) => {
                                    if (event.type === "dismissed") {
                                        setShowDatePicker(false);
                                        return;
                                    }
                                    if (selectedDate) {
                                        const updatedDate = new Date(newTaskDate);
                                        updatedDate.setFullYear(
                                        selectedDate.getFullYear(),
                                        selectedDate.getMonth(),
                                        selectedDate.getDate()
                                        );
                                        setNewTaskDate(updatedDate);
                                        setShowDatePicker(false);
                                        setTimeout(() => setShowTimePicker(true), 0);
                                    }
                                    }}
                                />
                                ) : null}

                                {Platform.OS === "android" && showTimePicker ? (
                                <DateTimePicker
                                    testID="androidTimePicker"
                                    value={newTaskDate}
                                    mode="time"
                                    display="default"
                                    is24Hour={true}
                                    onChange={(event, selectedTime) => {
                                    if (event.type === "dismissed") {
                                        setShowTimePicker(false);
                                        return;
                                    }
                                    if (selectedTime) {
                                        const updatedDate = new Date(newTaskDate);
                                        updatedDate.setHours(selectedTime.getHours());
                                        updatedDate.setMinutes(selectedTime.getMinutes());
                                        setNewTaskDate(updatedDate);
                                    }
                                    setShowTimePicker(false);
                                    }}
                                />
                                ) : null}
                        </View>

                        {/* Show picker to allow admin to assign tasks to workers */}
                        {isAdmin && (
                            <View style={styles.pickerContainer}>
                                <TouchableOpacity
                                    onPress={() =>
                                        setShowWorkerPicker(!showWorkerPicker)
                                    }
                                    style={styles.selectDateButton}
                                >
                                    <Text style={styles.selectDateButtonText}>
                                        Assign to Worker
                                    </Text>
                                </TouchableOpacity>

                                {showWorkerPicker && (
                                    <Picker
                                        selectedValue={assignedTo}
                                        onValueChange={(itemValue) =>
                                            setAssignedTo(itemValue)
                                        }
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        {safeCitiesWorkers.map((worker) => (
                                            <Picker.Item
                                                key={worker._id}
                                                label={worker.username}
                                                value={worker._id}
                                            />
                                        ))}
                                    </Picker>
                                )}
                            </View>
                        )}

                        {errorMessage && (
                            <Text style={styles.modalErrorMessage}>
                                {errorMessage}
                            </Text>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={handleCancelCreateTask}
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateTask}
                                style={[
                                    styles.modalButton,
                                    styles.createButton,
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        Create Task
                                    </Text>
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
        flex: 1,
    },
    scrollViewContent: {
        alignItems: "center",
        flexGrow: 1,
    },
    header: {
        fontSize: 32,
        fontWeight: "bold",
        color: Colors.darkGray,
        flex: 1,
    },
    taskArea: {
        width: "95%",
        alignItems: "center",
        justifyContent: "center",
    },
    message: {
        fontSize: 20,
        textAlign: "center",
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
        borderRadius: 20,
        padding: 25,
        width: "85%",
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
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        color: Colors.darkGray,
    },
    datePickerContainer: {
        width: "100%",
        marginBottom: 10,
        alignItems: "center",
    },
    dateDisplay: {
        fontSize: 16,
        marginBottom: 10,
    },
    selectDateButton: {
        borderWidth: 1,
        borderColor: Colors.greyTextBox,
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
        fontSize: 16,
        fontWeight: "bold",
    },
    modalErrorMessage: {
        color: "red",
        marginBottom: 15,
        textAlign: "center",
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
        backgroundColor: "#db6969",
    },
    createButton: {
        backgroundColor: Colors.greenRegular,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "bold",
    },
    completeButton: {
        position: "absolute",
        bottom: 100,
        left: 30,
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
        fontSize: 16,
        fontWeight: "bold",
    },
    checkMark: {
        height: 30,
        width: 30,
    },
    pickerContainer: {
        width: "100%",
        marginBottom: 20,
        alignItems: "center",
        overflow: "hidden",
    },
    picker: {
        width: "100%",
        height: Platform.OS === "ios" ? 150 : 50, // iOS picker takes more height
        marginTop: 5,
        justifyContent: "flex-start",
        paddingVertical: 0,
    },
    pickerItem: {
        fontSize: 16,
        flex: 1,
    },
});

export default SchedulePage;
