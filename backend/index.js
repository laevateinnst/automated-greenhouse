

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI);


mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});


const SensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  lightLevel: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorReading = mongoose.model('SensorReading', SensorSchema);


app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/readings', async (req, res) => {
  try {
    const reading = await SensorReading.create(req.body);
    res.status(201).json(reading);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.get('/readings', async (req, res) => {
  const readings = await SensorReading.find();
  res.json(readings);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
