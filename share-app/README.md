# SendIt - Real-Time File & Message Sharing App

SendIt is a full-stack, real-time file and message sharing application built with the MERN stack (MongoDB, Express, React, Node.js) and socket.io for real-time peer-to-peer style communication.

## Features

- **Real-Time Chat**: WebSockets (Socket.io) enable instantaneous message delivery with typing indicators.
- **Large File Sharing**: Drag-and-drop file upload interface using `react-dropzone`. Files are chunked and streamed directly to MongoDB using **GridFS** (`multer-gridfs-storage`), allowing for virtually unlimited file sizes without overloading the server memory.
- **Secure Sessions**: Connect to peers using a unique, auto-generated 12-digit connection code.
- **Authentication**: JWT-based login and signup system to protect user identities.
- **Beautiful UI**: Built with React, Tailwind CSS, Lucide icons, and modern design principles.

## Folder Structure

```
share-app/
├── backend/            # Express.js API, MongoDB schemas, and Socket.io server
│   ├── models/         # Mongoose schemas (User, Session, Message)
│   ├── routes/         # REST API routes (auth, session, upload)
│   ├── middleware/     # JWT Protection logic
│   ├── index.js        # Main entrypoint
│   └── package.json
└── frontend/           # React + Vite frontend application
    ├── src/
    │   ├── components/ # React UI components (Navbar, etc.)
    │   ├── context/    # User Auth and Socket connection Providers
    │   ├── pages/      # Login, Signup, Dashboard, and Room views
    │   ├── App.jsx     # Frontend routing
    │   └── main.jsx
    ├── tailwind.config.js
    └── package.json
```

## Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Database (Local instance or MongoDB Atlas cluster)

### 1. Database Setup
Ensure you have MongoDB running locally on `mongodb://127.0.0.1:27017` or have an Atlas cluster URI.

### 2. Backend Setup
Navigate into the `backend` directory:
```bash
cd backend
npm install
```
Start the development server (runs on `http://localhost:5000`):
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate into the `frontend` directory:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173` (or `http://localhost:5174` if the port is busy).

## Deployment Instructions

### Backend (Render or AWS)
1. Commit the `backend` folder to a GitHub repository.
2. In Render, create a new **Web Service** and connect the repository.
3. Set the Root Directory to `backend`.
4. Set Build Command to `npm install`.
5. Set Start Command to `npm start`.
6. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure, random string.
   - `PORT`: (Render will automatically inject this, but you can set a default if needed).

### Frontend (Vercel)
1. Commit the `frontend` folder to a GitHub repository.
2. Log into Vercel and import the project.
3. Go to the project settings exactly BEFORE deploying and override the `Framework Preset` to **Vite**.
4. Set the Root Directory to `frontend`.
5. Under 'Environment Variables', optionally add the deployed Backend URL if you change the hardcoded `http://localhost:5000` in the frontend source files (`AuthContext.jsx`, `Dashboard.jsx`, `Room.jsx`, `SocketContext.jsx`) to a dynamic environment variable like `import.meta.env.VITE_API_URL`.
6. Click Deploy!
