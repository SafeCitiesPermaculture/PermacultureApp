import { 
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
 } from "react-native";
import Colors from "@/constants/Colors";

const TaskCard = ({ task, toggleCompletion, isChecked, onDelete, deleting }) => {
    const dueDateString  = task.dueDateTime.toLocaleString("en-GB").slice(0, -3); //Convert to dd/mm/yyyy, hh:mm

    const dueDateStyle = !isChecked && task.dueDateTime <= new Date() ? styles.dueDatePastDue : styles.dueDate; //Make overdue task times red
    const nameStyle = isChecked ? styles.nameCompleted : styles.name; //Strikethrough tasks marked as completed

    const checkBox = require("@/assets/images/check-mark.png");
    const trashCan = require("@/assets/images/trash-can.png");

    return (
        <View style={styles.background}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <View style={{flex: 5, flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity style={styles.checkBox} onPress={() => toggleCompletion(task._id, !isChecked)}>
                        {isChecked && <Image source={checkBox} style={{width: "100%", height: "100%"}} />}
                    </TouchableOpacity>
                    <Text style={nameStyle} numberOfLines={1}>{task.name}</Text>
                </View>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'flex-end', marginRight: 10}}>
                    {deleting ? <ActivityIndicator color="red" size="small" /> :
                    <TouchableOpacity style={styles.trashCan} onPress={onDelete}>
                        <Image source={trashCan} style={{ width: "100%", height: "100%"}} />
                    </TouchableOpacity>
                }
                </View>
            </View>
            <Text style={dueDateStyle}>Due: {dueDateString}</Text>
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
    name: {
        fontSize: 20,
        fontWeight: '500',
        flexShrink: 1
    },
    nameCompleted: {
        fontSize: 20,
        fontWeight: '500',
        flexShrink: 1,
        textDecorationLine: 'line-through'
    },
    dueDate: {
        fontSize: 15,
        marginLeft: 40,
        fontWeight: '200',
    },
    dueDatePastDue: {
        fontSize: 15,
        marginLeft: 40,
        fontWeight: "200",
        color: 'red'
    },
    trashCan: {
        width: 20,
        aspectRatio: "1/1",
    }
});

export default TaskCard;