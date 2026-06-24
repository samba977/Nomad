// ✅ MUST be first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const chatSocket = require('./sockets/chatSocket');

const app = express();

/* ----------------------------- Core Middleware ----------------------------- */
app.set('trust proxy', 1);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (images, uploads, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------------------------- Routes -------------------------------- */
const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const chatRoutes         = require('./routes/chatRoutes');
const groupRoutes        = require('./routes/groupRoutes');        // groups + polls
const reportRoutes       = require('./routes/reportRoutes');       // existing: message reports
const userReportRoutes   = require('./routes/userReportRoutes');   // ✅ NEW: user reports
const destinationRoutes  = require('./routes/destinationRoutes');
const eventImageRoutes   = require('./routes/eventImageRoutes');
const travelPlanRoutes   = require('./routes/travelPlanRoutes');
const blogRoutes         = require('./routes/blogRoutes');

// ✅ Mount routes
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/groups',        groupRoutes);
app.use('/api/reports',       reportRoutes);        // (message reports) keep existing
app.use('/api/user-reports',  userReportRoutes);    // ✅ (user reports) new path
app.use('/api/destinations',  destinationRoutes);
app.use('/api/event-images',  eventImageRoutes);
app.use('/api/travel-plans',  travelPlanRoutes);
app.use('/api/blogs',         blogRoutes);

/* ---------------------------- Temp Admin Seeder ---------------------------- */
app.get('/create-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcrypt');

    await User.deleteMany({ email: 'admin@example.com' });

    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      phone: '9999999999',
      password: hashed,
      governmentID: '00000000000',
      isAdmin: true,
      profileCreated: false,
    });

    console.log('✅ Admin user created');
    res.send('✅ Admin user created!');
  } catch (err) {
    console.error('❌ Admin seed error:', err);
    res.status(500).send('Failed to create admin');
  }
});

/* ------------------------------- Health Check ------------------------------ */
app.get('/', (req, res) => {
  console.log('✅ API is live and connected.');
  res.send('API is running...');
});

/* --------------------------- 404 & Error Handling -------------------------- */
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Route not found' });
  }
  next();
});

app.use((err, req, res, next) => {
  console.error('🔥 Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

/* ------------------------------ Start Server ------------------------------- */
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
    });

    // (Optional) Make io available to controllers via utils/io (for getIO())
    try {
      const { setIO } = require('./utils/io');
      if (typeof setIO === 'function') setIO(io);
    } catch {
      // utils/io not present — safe to ignore
    }

    // 🎧 Setup chat events (rooms, typing, DM/group messages, etc.)
    chatSocket(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
