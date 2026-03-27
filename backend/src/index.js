const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Feature routes
const authRoutes = require('./features/auth/auth.routes');
const videoRoutes = require('./features/videos/video.routes');
const interactionRoutes = require('./features/interactions/interaction.routes');
const userRoutes = require('./features/user/user.routes');
const notificationRoutes = require('./features/notifications/notification.routes');
const reportRoutes = require('./features/reports/report.routes');
const adminRoutes = require('./features/admin/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api', interactionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('YouTube Clone API is running!');
});

app.use(async (err, req, res, next) => {
  console.error('Error:', err.message || err);
  
  // Log critical errors to audit trail
  try {
    const { query } = require('./lib/db');
    await query(
      'INSERT INTO audit_logs (action, entity_type, details) VALUES ($1, $2, $3)',
      ['SYSTEM_ERROR', req.method + ' ' + req.path, JSON.stringify({ message: err.message, stack: err.stack })]
    ).catch(e => console.error('Failed to log error to DB:', e.message));
  } catch (logError) {}

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
