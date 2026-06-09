// Admin-only screen: view tasks assigned to workers and how they were completed.
import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Platform,
} from "react-native";
import Colors from "@/constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import API from "@/api/api";
import AdminGuard from "@/components/AdminGuard";

const STATUS_OPTIONS = [
    { key: "all", label: "All" },
    { key: "false", label: "Incomplete" },
    { key: "true", label: "Completed" },
];

const AdminTasksPage = () => {
    const [workers, setWorkers] = useState([]);
    const [selectedWorker, setSelectedWorker] = useState("all");
    const [status, setStatus] = useState("all");
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Build the worker filter from the people who actually have tasks (one
    // unfiltered fetch), so anyone with an assigned task is filterable —
    // not just currently-assignable farm workers.
    const getWorkers = useCallback(async () => {
        try {
            const res = await API.get("/admin/tasks");
            const map = new Map();
            (res.data.tasks || []).forEach((t) => {
                if (t.assignedTo?._id && !map.has(t.assignedTo._id)) {
                    map.set(t.assignedTo._id, t.assignedTo);
                }
            });
            setWorkers(
                Array.from(map.values()).sort((a, b) =>
                    (a.username || "").localeCompare(b.username || "")
                )
            );
        } catch (error) {
            setWorkers([]);
        }
    }, []);

    const getTasks = useCallback(async () => {
        setLoading(true);
        setErrorMessage("");
        try {
            const params = {};
            if (selectedWorker !== "all") params.assignedTo = selectedWorker;
            if (status !== "all") params.isCompleted = status;
            const res = await API.get("/admin/tasks", { params });
            const fetched = res.data.tasks.map((t) => ({
                ...t,
                dueDateTime: new Date(t.dueDateTime),
                completedAt: t.completedAt ? new Date(t.completedAt) : null,
            }));
            setTasks(fetched);
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [selectedWorker, status]);

    useFocusEffect(
        useCallback(() => {
            getWorkers();
        }, [getWorkers])
    );

    useFocusEffect(
        useCallback(() => {
            getTasks();
        }, [getTasks])
    );

    const fmt = (d) => (d ? d.toLocaleString("en-GB").slice(0, -3) : "");

    return (
        <AdminGuard>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.header}>Workers&apos; Tasks</Text>

                    {/* Worker filter */}
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={selectedWorker}
                            onValueChange={setSelectedWorker}
                            style={styles.picker}
                        >
                            <Picker.Item label="All Workers" value="all" />
                            {workers.map((w) => (
                                <Picker.Item
                                    key={w._id}
                                    label={
                                        w.farms?.length
                                            ? `${w.username} (${w.farms
                                                  .map((f) => f.name)
                                                  .join(", ")})`
                                            : w.username
                                    }
                                    value={w._id}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* Status filter */}
                    <View style={styles.statusRow}>
                        {STATUS_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    styles.statusButton,
                                    status === opt.key && styles.statusButtonActive,
                                ]}
                                onPress={() => setStatus(opt.key)}
                            >
                                <Text style={styles.statusButtonText}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.greenRegular} />
                    ) : errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : tasks.length === 0 ? (
                        <Text style={styles.message}>No tasks found.</Text>
                    ) : (
                        tasks.map((task) => (
                            <View key={task._id} style={styles.card}>
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.taskName} numberOfLines={2}>
                                        {task.name}
                                    </Text>
                                    <View
                                        style={[
                                            styles.badge,
                                            task.isCompleted
                                                ? styles.badgeDone
                                                : styles.badgePending,
                                        ]}
                                    >
                                        <Text style={styles.badgeText}>
                                            {task.isCompleted ? "Completed" : "Incomplete"}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.metaText}>
                                    Assigned to: {task.assignedTo?.username || "Unknown"}
                                </Text>
                                <Text style={styles.metaText}>
                                    Due: {fmt(task.dueDateTime)}
                                </Text>

                                {task.isCompleted && (
                                    <View style={styles.completionBlock}>
                                        {task.completedAt && (
                                            <Text style={styles.metaText}>
                                                Completed: {fmt(task.completedAt)}
                                            </Text>
                                        )}
                                        {task.completedBy?.username && (
                                            <Text style={styles.metaText}>
                                                By: {task.completedBy.username}
                                            </Text>
                                        )}
                                        {task.completionNote ? (
                                            <Text style={styles.noteText}>
                                                Note: {task.completionNote}
                                            </Text>
                                        ) : null}
                                        {task.completionPhoto ? (
                                            <Image
                                                source={{ uri: task.completionPhoto }}
                                                style={styles.photo}
                                            />
                                        ) : null}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    scrollContent: {
        alignItems: "center",
        padding: 10,
        flexGrow: 1,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.darkGray,
        marginBottom: 15,
    },
    pickerWrapper: {
        width: "100%",
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        borderRadius: 10,
        marginBottom: 10,
        overflow: "hidden",
        backgroundColor: "#fff",
    },
    picker: {
        width: "100%",
        height: Platform.OS === "ios" ? 150 : 50,
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginBottom: 15,
    },
    statusButton: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.brownLight,
        alignItems: "center",
    },
    statusButtonActive: {
        backgroundColor: Colors.greenRegular,
    },
    statusButtonText: {
        fontWeight: "bold",
        fontSize: 14,
    },
    card: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.brownMedium,
        padding: 12,
        marginBottom: 12,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    taskName: {
        fontSize: 18,
        fontWeight: "bold",
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    badgeDone: {
        backgroundColor: Colors.greenRegular,
    },
    badgePending: {
        backgroundColor: Colors.taskdeadline || "#e0a0a0",
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#fff",
    },
    metaText: {
        fontSize: 14,
        color: Colors.darkGray,
        marginBottom: 2,
    },
    completionBlock: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    noteText: {
        fontSize: 14,
        fontStyle: "italic",
        marginTop: 4,
        color: Colors.darkGray,
    },
    photo: {
        width: 160,
        height: 160,
        borderRadius: 10,
        marginTop: 8,
        resizeMode: "cover",
    },
    message: {
        fontSize: 18,
        textAlign: "center",
        marginTop: 20,
        color: Colors.gray,
    },
    errorText: {
        fontSize: 16,
        color: "red",
        textAlign: "center",
        marginTop: 20,
    },
});

export default AdminTasksPage;
