const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',') : []),
].filter(Boolean).map((origin) => origin.trim().replace(/\/$/, ''));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/projects', require('./src/routes/project.routes'));
app.use('/api/tasks', require('./src/routes/task.routes'));
app.use('/api/users', require('./src/routes/user.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Team Task Manager API is running!' });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'TaskFlow API is running. Use /api/health for health checks.' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process using that port or set a different PORT value.`);
    process.exit(1);
  }

  console.error('Server error:', err);
  process.exit(1);
});
