import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const STORAGE_KEY = "tokens";

export const getUserIdFromToken = async () => {
  try {
    let tokenData;

    if (Platform.OS === "web") {
      const raw = localStorage.getItem(STORAGE_KEY);
      tokenData = raw ? JSON.parse(raw) : null;
    } else {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      tokenData = raw ? JSON.parse(raw) : null;
    }

    if (!tokenData?.accessToken) return null;

    const decoded = jwtDecode(tokenData.accessToken);
    return decoded.userId;
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
};
