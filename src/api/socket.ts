import { io } from "socket.io-client";

const BASE_URL = "https://longheadedly-unprevailing-quinn.ngrok-free.dev";

export const socket = io(BASE_URL, { 
  transports: ["websocket"], 
  autoConnect: true,
});