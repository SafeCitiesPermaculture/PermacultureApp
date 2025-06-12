import { 
    View,
    Text,
    TouchableOpacity,
    StyleSheet
 } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";

const TaskCard = ({ task }) => {
    let dueDateString = task.dueDateTime.toLocaleString("en-GB").slice(0, -3);

    return (
        <View style={styles.background}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity style={styles.checkBox} /> 
                <Text style={styles.taskName}>{task.name}</Text>
            </View>
            <Text style={styles.dueDate}>Due: {dueDateString}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        backgroundColor: Colors.brownLight,
        width: "100%",
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderColor: Colors.brownMedium,
        borderWidth: 1
    },
    checkBox: {
        backgroundColor: 'white',
        margin: 10,
        borderColor: 'black',
        borderWidth: 2,
        width: "15%",
        aspectRatio: "1/1"
    },
    taskName: {
        fontSize: 20,
        fontWeight: '500'
    },
    dueDate: {
        fontSize: 15,
        marginRight: 5,
        fontWeight: '200'
    }
});

export default TaskCard;