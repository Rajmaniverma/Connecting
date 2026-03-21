import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/session.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a specific room based on the 12-digit code
  socket.on('join_room', ({ code }) => {
    socket.join(code);
    console.log(`User ${socket.id} joined room ${code}`);
    socket.to(code).emit('user_joined', { userId: socket.id });
  });

  // Handle messages
  socket.on('send_message', (data) => {
    // data contains room code, message content, etc.
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
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
