const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const projectController = require('./controllers/projectController');
const reportController = require('./controllers/reportController');
const dashboardController = require('./controllers/dashboardController');
const aiController = require('./controllers/aiController');
const { protect, authorize } = require('./middleware/auth');

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', protect, authController.getMe);

// User Routes
app.get('/api/users', protect, authorize('Manager'), userController.getUsers);

// Project Routes
app.get('/api/projects', protect, projectController.getProjects);
app.post('/api/projects', protect, authorize('Manager'), projectController.createProject);
app.put('/api/projects/:id', protect, authorize('Manager'), projectController.updateProject);
app.delete('/api/projects/:id', protect, authorize('Manager'), projectController.deleteProject);

// Report Routes
app.get('/api/reports', protect, reportController.getReports);
app.post('/api/reports', protect, reportController.createReport);
app.get('/api/reports/:id', protect, reportController.getReportById);
app.put('/api/reports/:id', protect, reportController.updateReport);

// Dashboard Routes
app.get('/api/dashboard/metrics', protect, authorize('Manager'), dashboardController.getDashboardMetrics);

// AI Chat Route
app.post('/api/ai/chat', protect, aiController.chat);

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/weekly-reports';

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
