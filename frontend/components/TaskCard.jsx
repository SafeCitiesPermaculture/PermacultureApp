import { 
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image
 } from "react-native";
import API from "@/api/api";
import Colors from "@/constants/Colors";

const TaskCard = ({ task, toggleCompletion, isChecked }) => {
    let dueDateString = new Date(task.dueDateTime).toLocaleString("en-GB").slice(0, -3); //Convert to dd/mm/yyyy, hh:mm
    
    return (
        <View style={styles.background}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity style={styles.checkBox} onPress={() => toggleCompletion(task._id, !isChecked)}>
                    {isChecked && <Image source={require("@/assets/images/check-mark.png")} style={{width: "100%", height: "100%"}} />}
                </TouchableOpacity>
                <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
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
        justifyContent: 'center',
        borderColor: Colors.brownMedium,
        borderWidth: 1,
        flexWrap: 'wrap'
    },
    checkBox: {
        backgroundColor: 'white',
        margin: 10,
        borderColor: 'black',
        borderWidth: 2,
        width: 20,
        aspectRatio: "1/1"
    },
    taskName: {
        fontSize: 20,
        fontWeight: '500',
        flexShrink: 1
    },
    dueDate: {
        fontSize: 15,
        marginLeft: 40,
        fontWeight: '200',
    }
});

export default TaskCard;