import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: "https://connecting31.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "https://connecting31.vercel.app",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8 // Increase limit to 100MB for sharing large base64 file payloads
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a specific room based on the 12-digit code
  socket.on('join_room', (data) => {
    socket.join(data.code);
    console.log(`User ${data.username} (${socket.id}) joined room ${data.code}`);
    socket.to(data.code).emit('user_joined', data);
  });

  // Handle messages
  socket.on('send_message', (data) => {
    // Broadcast message / file data to the room
    io.to(data.code).emit('receive_message', data);
  });

  // Handle typing status
  socket.on('typing', (data) => {
    socket.to(data.code).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running. WebSocket server is active.');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
