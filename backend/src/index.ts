import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import interactionRoutes from './routes/interactions';
import userRoutes from './routes/user';
import notificationRoutes from './routes/notifications';

dotenv.config();

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


app.get('/', (req, res) => {
  res.send('YouTube Clone API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

