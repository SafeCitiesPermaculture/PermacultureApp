import { View, Text, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from "@/constants/Colors";
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const ReportCard = ({ reported, reportedBy, description, reportId }) => {
    const router = useRouter();

    return (
        <TouchableOpacity onPress={() => router.push(`/profile/${reportId}`)}>
            <View style={styles.background}>
                <Text style={styles.label}>Reported: <Text style={{fontWeight: 'bold'}}>{reported}</Text></Text>
                <Text style={styles.label}>Reported by: <Text style={{fontWeight: 'bold'}}>{reportedBy}</Text></Text>
                <Text style={styles.label}>Description: {description}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    background: {
        backgroundColor: Colors.brownLight,
        width: width - 20,
        padding: 5,
        marginVertical: 5
    },
    label: {
        fontSize: 16
    }
});

export default ReportCard;