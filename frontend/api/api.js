import axios from "axios";
import * as SecureStore from "expo-secure-store";
const BACKEND_URL = "http://192.168.100.154:6000/api";

//initliaze the API
const API = axios.create({
    baseURL: BACKEND_URL,
});

//Store auth tokens in a secure storage
const storeTokens = async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(
        "tokens",
        JSON.stringify({ accessToken, refreshToken })
    );
};

//Retrieve tokens from storage
const getTokens = async () => {
    const tokens = await SecureStore.getItemAsync("tokens");
    return tokens ? JSON.parse(tokens) : null;
};

//clear tokens
const clearTokens = async () => {
    await SecureStore.deleteItemAsync("tokens");
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
                return API(originalRequest);
            } else {
                //await clearTokens();
                return Promise.reject("Session expired. Please log in again.");
            }
        }
        return Promise.reject(error);
    }
);

//refresh the tokens
const tryRefreshToken = async () => {
    const tokens = await getTokens();
    if (!tokens?.refreshToken) return false;

    try {
        const res = await axios.post(`${BACKEND_URL}/auth/refresh`, {
            token: tokens.refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        await storeTokens(newAccessToken, tokens.refreshToken);

        return true;
    } catch {
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

export { login, logout };

export default API;
