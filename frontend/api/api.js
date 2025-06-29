import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const devUrl = "http://localhost:3000/api";
const devSocketUrl = "http://localhost:3000";
const prodUrl = "https://permacultureapp.onrender.com/api";
const prodSocketUrl = "https://permacultureapp.onrender.com";

const BACKEND_URL = __DEV__ ? devUrl : prodUrl;
const SOCKET_URL = __DEV__ ? devSocketUrl : prodSocketUrl;


const STORAGE_KEY = "tokens";

//initliaze the API
const API = axios.create({
    baseURL: BACKEND_URL,
});

//Store auth tokens in a secure storage
const storeTokens = async (accessToken, refreshToken) => {
    const tokenData = JSON.stringify({ accessToken, refreshToken });

    if (Platform.OS === "web") {
        localStorage.setItem(STORAGE_KEY, tokenData);
    } else {
        await SecureStore.setItemAsync(STORAGE_KEY, tokenData);
    }
};

//Retrieve tokens from storage
const getTokens = async () => {
    let tokenData;

    if (Platform.OS === "web") {
        tokenData = localStorage.getItem(STORAGE_KEY);
    } else {
        tokenData = await SecureStore.getItemAsync(STORAGE_KEY);
    }
    return tokenData ? JSON.parse(tokenData) : null;
};

//clear tokens
const clearTokens = async () => {
    if (Platform.OS === "web") {
        localStorage.removeItem(STORAGE_KEY);
    } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
};

//Attach tokens to all sent requests automatically
API.interceptors.request.use(async (config) => {
    const tokens = await getTokens();

    //attach token
    if (tokens?.accessToken) {
        config.headers.authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
});

//Auto refresh access token if it was expired
//Occurs if request returns a 401 error
API.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        console.log("Error when sending request:", error);
        // Don't refresh if it's login or refresh token request
        if (
            originalRequest.url.includes("/login") ||
            originalRequest.url.includes("/refresh")
        ) {
            return Promise.reject(error);
        }
        //401 error that hasn't been retired
        if (error.response?.status == 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                console.log("Got new tokens");
                const newTokens = await getTokens();
                originalRequest.headers.authorization = `Bearer ${newTokens.accessToken}`;
                return API(originalRequest);
            }
            else {
                console.log("Did not get new tokens");
                await clearTokens();
                return Promise.reject("Session expired. Please log in again.");
            }
        }
        console.log("Didn't try again");
        return Promise.reject(error);
    }
);

//refresh the tokens
const tryRefreshToken = async () => {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) return false;

    try {
        const res = await axios.post(`${BACKEND_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        await storeTokens(newAccessToken, tokens.refreshToken);

        return true;
    } catch (err) {
        console.log("Refresh failed:", err);
        return false;
    }
};

//Auth functions
const login = async (username, password) => {
    try {
        const res = await API.post("/auth/login", { username, password });
        const { accessToken, refreshToken, user } = res.data;
        await storeTokens(accessToken, refreshToken);
        return user;
    } catch (err) {
        if (err.response && err.response.status === 401) {
            throw new Error("Invalid username or password");
        }
        if (err.response?.status == 403) {
            throw new Error(err.response?.data?.message);
        }
        
        throw new Error("Login failed. Please try again later.");
    }
};

const logout = async () => {
    const tokens = await getTokens();
    if (tokens?.refreshToken) {
        await API.post("/auth/logout", { token: tokens.refreshToken });
    }
    await clearTokens();
};

export { login, logout, getTokens, BACKEND_URL, SOCKET_URL };

export default API;
