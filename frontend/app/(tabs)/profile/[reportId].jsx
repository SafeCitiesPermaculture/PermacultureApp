import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions, Alert, Platform } from 'react-native';
import AdminGuard from "@/components/AdminGuard";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "@/api/api";
import { useState, useEffect, useCallback } from "react";
import Colors from "@/constants/Colors";
import { useLoading } from "@/context/LoadingContext";
import DeleteModal from '@/components/DeleteModal';

const { width } = Dimensions.get("window");

const HandleReportPage = () => {
    const { reportId } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [message, setMessage] = useState("");
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const { showLoading, hideLoading } = useLoading();
    const router = useRouter();

    const getReport = useCallback(async () => {
        showLoading();
        try {
            const response = await API.get(`/reports/${reportId}`);
            setReport(response.data.report);
        } catch (error) {
            console.error("Error fetching report:", error);
            setErrorMessage(error.response?.data?.message || error.message);
        } finally {
            hideLoading();
        }
    }, [reportId]);

    useEffect(() => {
        getReport();
    }, [getReport]);

    const handleIgnore = useCallback(async () => {
        showLoading();
        try {
            await API.put(`/reports/dismiss/${report.reported._id}`);
            await API.delete(`/reports/${reportId}`);
            setMessage("Report ignored.");
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error ignoring report:", error);
            setErrorMessage(error.response?.data?.message || error.message);
        } finally {
            hideLoading();
        }
    }, [reportId, router, report]);

    const removeUser = async () => {
        showLoading();
        setLoading(true);
        try {
            await API.put(`/admin/remove/${report.reported._id}`);
            setMessage(`${report?.reported.username} removed.`);
            await API.delete(`/reports/${reportId}`);
            setTimeout(() => router.dismiss(), 1000);
        } catch (error) {
            console.error("Error removing user:", error);
            setErrorMessage(error.response?.data?.message || error.message);
        } finally {
            hideLoading();
            setLoading(false);
            setDeleteModalVisible(false);
        }
    };

    const handleRemove = useCallback(async () => {
        setDeleteModalVisible(true);
    }, []);

    return (
        <AdminGuard>
            <View style={{ alignItems: "center", marginBottom: 7 }}>
                <Text style={styles.header}>Report Details</Text>
            </View>
                {loading ? 
                <View style={{alignItems: 'center'}}>
                    <ActivityIndicator size='large' color={Colors.greenRegular} />
                </View> :
                report ? 
                <ScrollView contentContainerStyle={{marginLeft: 2, height: 'auto'}}>
                    <Text style={styles.text}>Reported: <Text style={styles.username}>{report.reported.username}</Text></Text>
                    <Text style={styles.text}>Reported by: <Text style={styles.username}>{report.reportedBy.username}</Text></Text>
                    <Text style={{fontSize: 16, fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 5}}>Description</Text>
                    <Text style={styles.description}>{report.description}</Text>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-evenly",
                            marginTop: 50,
                        }}
                    >
                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: "green" },
                            ]}
                            onPress={handleIgnore}
                        >
                            <Text style={styles.buttonText}>Ignore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, {backgroundColor: 'red'}]} onPress={handleRemove}>
                            <Text style={styles.buttonText}>Remove {report.reported.username}</Text>
                        </TouchableOpacity>
                    </View>
                    {message && (
                        <View style={{ alignItems: "center", marginTop: 15 }}>
                            <Text
                                style={{
                                    fontSize: 20,
                                    color: Colors.greenRegular,
                                }}
                            >
                                {message}
                            </Text>
                        </View>
                    )}
                </ScrollView> :
                <Text style={styles.errorMessage}>
                    {errorMessage || "Error fetching report"}
                </Text>
            }
            <DeleteModal
                isVisible={deleteModalVisible}
                title="Remove User"
                message={`Are you sure you want to remove ${report?.reported?.username}`}
                onConfirm={() => removeUser()}
                onCancel={() => setDeleteModalVisible(false)}
                isLoading={loading}
                />
        </AdminGuard>
    );
};

const styles = StyleSheet.create({
    errorMessage: {
        color: "red",
        textAlign: "center",
    },
    header: {
        fontSize: 30,
        fontWeight: "bold",
    },
    username: {
        fontWeight: "bold",
    },
    text: {
        fontSize: 16,
        marginTop: 2,
    },
    description: {
        fontSize: 16,
        flexWrap: "wrap",
        marginTop: 2,
    },
    button: {
        width: width / 2 - 40,
        alignItems: "center",
        paddingVertical: 50,
        borderRadius: 10,
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        textAlignVertical: 'center'
    }
});

export default HandleReportPage;