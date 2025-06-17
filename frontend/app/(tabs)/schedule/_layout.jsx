// import React, { useContext, useEffect } from "react";
// import { useRouter, Stack } from "expo-router";
// import { AuthContext } from "@/context/AuthContext";
// import { ActivityIndicator, View } from "react-native";
// import Colors from "@/constants/Colors";

// const ScheduleLayout = () => {
//     return (
//         <Stack
//             screenOptions={{
//                 headerStyle: {
//                     backgroundColor: Colors.menuBrown,
//                 },
//                 headerTintColor: "#000",
//                 headerTitleStyle: {
//                     fontSize: 20,
//                     fontWeight: "bold",
//                 },
//                 contentStyle: {
//                     paddingHorizontal: 10,
//                     paddingTop: 10,
//                     backgroundColor: Colors.backgroundTan,
//                 },
//             }}
//         >
//             <Stack.Screen name="index" options={{ title: "Schedule" }} />
//         </Stack>
//     );
// };
//
// export default ScheduleLayout;
import { Stack } from "expo-router";
import Colors from "@/constants/Colors";

const ScheduleLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.menuBrown,
        },
        headerTintColor: "#000",
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "bold",
        },
        contentStyle: {
          paddingHorizontal: 10,
          paddingTop: 10,
          backgroundColor: Colors.backgroundTan,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Schedule" }} />
      <Stack.Screen name="CompletedTasks" options={{  title: "Completed Tasks" }} />
    </Stack>
  );
};

export default ScheduleLayout;
