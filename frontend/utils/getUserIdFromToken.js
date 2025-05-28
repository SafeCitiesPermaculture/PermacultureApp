import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

export const getUserIdFromToken = async () => {
    const tokenData = await SecureStore.getItemAsync("tokens");
    if (!tokenData) return null;

    const { accessToken } = JSON.parse(tokenData);
    const decoded = jwtDecode(accessToken);
    return decoded.userId;
};
