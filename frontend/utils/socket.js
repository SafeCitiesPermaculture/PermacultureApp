import { io } from "socket.io-client";
import { BACKEND_URL } from "@/api/api";

const socket = io(BACKEND_URL); // Replace with your IP if testing on device

export default socket;
