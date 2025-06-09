import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Replace with your IP if testing on device

export default socket;
