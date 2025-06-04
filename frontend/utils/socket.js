import { io } from "socket.io-client";

const socket = io("http://192.168.88.187:6000"); // Replace with your IP if testing on device

export default socket;
