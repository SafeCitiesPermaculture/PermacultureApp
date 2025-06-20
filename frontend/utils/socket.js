import { io } from "socket.io-client";
import { SOCKET_URL } from "@/api/api";

const socket = io(SOCKET_URL); // Replace with your IP if testing on device

export default socket;
