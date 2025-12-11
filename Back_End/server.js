// server.js - single-file backend (CommonJS) for Greenhouse Dashboard - ENHANCED VERSION
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

// ---------- Middleware ----------
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000', `http://localhost:${PORT}`],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Mongoose connection with fallback flag ----------
let mongoConnected = false;

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI missing in .env — running in fallback mode');
} else {
  // Add connection timeout options
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log('📡 Database:', mongoose.connection.name);
    console.log('📍 Host:', mongoose.connection.host);
    mongoConnected = true;
    // Delay sync to ensure connection is stable
    setTimeout(syncFallbackUsersToMongo, 1000);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in fallback mode (in-memory only)');
  });
}

// ---------- Schemas & Models ----------
const greenhouseDataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  lightLevel: Number,
  recordedAt: { type: Date, default: Date.now }
});
const GreenhouseData = mongoose.model('SensorReadings', greenhouseDataSchema);

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

const deviceSchema = new mongoose.Schema({
  pumpStatus: { type: String, enum: ['ON','OFF'], default: 'OFF' },
  coverStatus: { type: String, enum: ['OPEN','CLOSED'], default: 'CLOSED' },
  updatedAt: { type: Date, default: Date.now }
});
const Device = mongoose.model('Device', deviceSchema);

const targetSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  soil: Number,
  light: Number,
  plantType: String
});
const Target = mongoose.model('Target', targetSchema);

const logSchema = new mongoose.Schema({
  message: String,
  type: { type: String, default: 'SYSTEM' },
  createdAt: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', logSchema);

// ---------- In-memory fallback ----------
let memoryData = { temperature: 24.5, humidity: 65, soilMoisture: 72, lightLevel: 850, recordedAt: new Date() };
let fallbackUsers = [
  { name: 'Admin', username: 'admin', password: 'admin123' },
  { name: 'Demo User', username: 'demo', password: 'demo123' }
];
let fallbackDevices = { pumpStatus: 'OFF', coverStatus: 'CLOSED', updatedAt: new Date() };
let fallbackTargets = { temperature: 22, humidity: 60, soil: 65, light: 800, plantType: 'Tomato' };
let fallbackLogs = [];

// ---------- Auto-sync fallback users to MongoDB ----------
async function syncFallbackUsersToMongo() {
  if (!mongoConnected) {
    console.log('⚠️ MongoDB not connected, skipping user sync');
    return;
  }
  
  console.log('🔄 Syncing fallback users to MongoDB...');
  let syncedCount = 0;
  
  for (const fbUser of fallbackUsers) {
    try {
      const exists = await User.findOne({ username: fbUser.username });
      if (!exists) {
        await User.create(fbUser);
        console.log(`✅ Added fallback user "${fbUser.username}" to MongoDB`);
        syncedCount++;
      } else {
        console.log(`⏭️ User "${fbUser.username}" already exists in MongoDB`);
      }
    } catch (err) {
      if (err.code !== 11000) { // Ignore duplicate key errors
        console.warn(`⚠️ Could not sync user "${fbUser.username}":`, err.message);
      }
    }
  }
  
  console.log(`📊 User sync complete: ${syncedCount} users added to MongoDB`);
}

// ---------- Helper: Unified user lookup ----------
async function findUserAnywhere(username) {
  // 1. Try MongoDB first (if connected)
  if (mongoConnected) {
    try {
      const user = await User.findOne({ username }).lean();
      if (user) return { user, source: 'mongodb' };
    } catch (err) {
      console.warn('MongoDB user lookup failed:', err.message);
    }
  }
  
  // 2. Fallback to in-memory users
  const fbUser = fallbackUsers.find(u => u.username === username);
  if (fbUser) return { user: fbUser, source: 'fallback' };
  
  return null;
}

// ---------- Simple token auth ----------
const tokens = new Map(); // token -> username
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function generateToken(username) {
  const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString('base64');
  tokens.set(token, { username, createdAt: Date.now() });
  return token;
}

function validateToken(token) {
  const rec = tokens.get(token);
  if (!rec) return null;
  if (Date.now() - rec.createdAt > TOKEN_TTL_MS) {
    tokens.delete(token);
    return null;
  }
  return rec.username;
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  const username = validateToken(token);
  if (!username) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.auth = { token, username };
  next();
}

// ---------- Helpers ----------
function safeNumber(v, fallback=0) {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

// ---------- Routes ----------

// Health
app.get('/api/health', async (req, res) => {
  let dbStatus = mongoConnected ? 'connected' : 'disconnected';
  let count = 0;
  if (mongoConnected) {
    count = await GreenhouseData.countDocuments().catch(() => 0);
  }
  res.json({ 
    success: true, 
    serverTime: new Date(), 
    database: { status: dbStatus, count, fallbackUsers: fallbackUsers.length }, 
    memoryData 
  });
});

// Plant presets (public)
app.get('/api/plant-presets', (req, res) => {
  const presets = [
    { name: 'Tomato', temperature: 24, humidity: 60, soil: 70, light: 1200 },
    { name: 'Lettuce', temperature: 18, humidity: 70, soil: 60, light: 600 },
    { name: 'Basil', temperature: 22, humidity: 65, soil: 65, light: 800 }
  ];
  res.json({ success: true, data: presets });
});

// Admin creation (works with or without MongoDB)
app.post('/api/admin/create', async (req, res) => {
  try {
    const adminSecret = process.env.ADMIN_SECRET || 'default-secret-change-me';
    const provided = req.headers['x-admin-secret'];
    if (!provided || provided !== adminSecret) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    
    // Check if user exists anywhere
    const existing = await findUserAnywhere(username);
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    // Try MongoDB first
    if (mongoConnected) {
      try {
        const user = await User.create({ name, username, password });
        return res.json({ 
          success: true, 
          message: 'Admin created in MongoDB', 
          user: { name: user.name, username: user.username },
          source: 'mongodb'
        });
      } catch (err) {
        console.warn('Failed to create in MongoDB, using fallback:', err.message);
      }
    }
    
    // Fallback to in-memory
    fallbackUsers.push({ name, username, password });
    res.json({ 
      success: true, 
      message: 'Admin created in fallback storage', 
      user: { name, username },
      source: 'fallback',
      warning: 'Data will be lost on server restart'
    });
    
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// Login (unified - checks both MongoDB and fallback)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Missing credentials' });
  }
  
  // Try to find user anywhere
  const userResult = await findUserAnywhere(username);
  
  if (!userResult || userResult.user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
  
  // Auto-migrate: If user found in fallback AND MongoDB is available → migrate to MongoDB
  if (userResult.source === 'fallback' && mongoConnected) {
    try {
      await User.create(userResult.user);
      console.log(`✅ Auto-migrated user "${username}" to MongoDB`);
      
      // Remove from fallback to avoid duplicates
      fallbackUsers = fallbackUsers.filter(u => u.username !== username);
    } catch (err) {
      if (err.code !== 11000) { // Ignore duplicate errors
        console.warn(`⚠️ Could not migrate user "${username}":`, err.message);
      }
    }
  }
  
  const token = generateToken(username);
  res.json({ 
    success: true, 
    token, 
    user: { name: userResult.user.name, username: userResult.user.username },
    source: userResult.source
  });
});

// Logout
app.post('/api/logout', requireAuth, (req, res) => {
  tokens.delete(req.auth.token);
  res.json({ success: true });
});

// ========== FIXED SENSOR DATA ENDPOINTS ==========

// Insert test sensor data (for manual testing)
app.post('/api/data/test', async (req, res) => {
  try {
    const testData = {
      temperature: 20,
      humidity: 30,
      soilMoisture: 280,
      lightLevel: 600,
      recordedAt: new Date()
    };
    
    console.log('📝 Inserting test data:', testData);
    
    let result = null;
    let source = 'fallback';
    
    // Try MongoDB first
    if (mongoConnected) {
      try {
        const doc = await GreenhouseData.create(testData);
        result = doc.toObject();
        source = 'mongodb';
        console.log('✅ Test data saved to MongoDB');
      } catch (err) {
        console.warn('Failed to save to MongoDB:', err.message);
      }
    }
    
    // Fallback to memory
    if (!result) {
      memoryData = { ...testData };
      result = memoryData;
      source = 'memory';
      console.log('⚠️ Test data saved to memory (MongoDB not available)');
    }
    
    res.json({ 
      success: true, 
      data: result, 
      source: source,
      message: 'Test data inserted successfully'
    });
    
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all sensor data (for debugging)
app.get('/api/data/all', async (req, res) => {
  try {
    let data = [];
    let count = 0;
    let mongoStatus = mongoose.connection.readyState;
    
    console.log(`🔍 Checking MongoDB (readyState: ${mongoStatus})`);
    
    if (mongoConnected && mongoStatus === 1) {
      console.log('📊 Querying GreenhouseData collection...');
      data = await GreenhouseData.find().sort({ recordedAt: -1 }).lean();
      count = data.length;
      console.log(`✅ Found ${count} documents in MongoDB`);
    }
    
    res.json({
      success: true,
      count: count,
      data: data,
      hasData: count > 0,
      mongoConnected: mongoConnected,
      mongoStatus: mongoStatus,
      memoryData: memoryData
    });
    
  } catch (err) {
    console.error('Error in /api/data/all:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Insert sensor data (with auto-population if empty)
app.post('/api/data', async (req, res) => {
  const { temperature, humidity, soilMoisture, lightLevel } = req.body;
  
  console.log('📝 Received sensor data:', { temperature, humidity, soilMoisture, lightLevel });
  
  // Use values from request or default to memoryData
  const newData = {
    temperature: safeNumber(temperature, memoryData.temperature),
    humidity: safeNumber(humidity, memoryData.humidity),
    soilMoisture: safeNumber(soilMoisture, memoryData.soilMoisture),
    lightLevel: safeNumber(lightLevel, memoryData.lightLevel),
    recordedAt: new Date()
  };
  
  console.log('📊 Processed data:', newData);
  
  // Update memory
  memoryData = { ...newData };
  
  let savedToMongo = false;
  let document = null;
  
  if (mongoConnected && mongoose.connection.readyState === 1) {
    try {
      document = await GreenhouseData.create(newData);
      savedToMongo = true;
      console.log('✅ Saved to MongoDB with ID:', document._id);
    } catch (err) {
      console.warn('Failed to save to MongoDB:', err.message);
    }
  }
  
  if (savedToMongo) {
    res.json({ 
      success: true, 
      data: document.toObject(), 
      savedToMongo: true,
      message: 'Data saved to MongoDB'
    });
  } else {
    res.json({ 
      success: true, 
      data: newData, 
      savedToMongo: false,
      message: 'Data saved to memory only'
    });
  }
});

// Sensor data - get current (with auto-insert if empty)
app.get('/api/data/current', async (req, res) => {
  console.log('📊 GET /api/data/current called');
  
  let data = { ...memoryData };
  let source = 'memory';
  let mongoStatus = mongoose.connection.readyState;
  
  console.log(`🔍 MongoDB connection state: ${mongoStatus} (1=connected)`);
  
  if (mongoStatus === 1) {
    console.log('🔍 Querying MongoDB for latest data...');
    
    try {
      const latest = await GreenhouseData.findOne().sort({ recordedAt: -1 }).lean();
      
      if (latest) {
        console.log('✅ Found MongoDB data:', {
          _id: latest._id,
          temp: latest.temperature,
          humidity: latest.humidity,
          soil: latest.soilMoisture,
          light: latest.lightLevel,
          time: latest.recordedAt
        });
        
        data = latest;
        source = 'mongodb';
        
        // Update memory with real data
        memoryData = { ...latest };
        
      } else {
        console.log('⚠️ No documents in MongoDB yet - checking if we should insert default data');
        
        // Check if this is the first time or if user wants to insert
        const shouldInsert = req.query.autoInsert !== 'false';
        
        if (shouldInsert) {
          console.log('📝 Inserting default data into MongoDB...');
          
          // Insert the exact data from your image
          const defaultData = {
            temperature: 20,
            humidity: 30,
            soilMoisture: 280,
            lightLevel: 600,
            recordedAt: new Date()
          };
          
          try {
            const newDoc = await GreenhouseData.create(defaultData);
            data = newDoc.toObject();
            source = 'mongodb (auto-inserted)';
            memoryData = { ...defaultData };
            
            console.log('✅ Auto-inserted data into MongoDB:', data._id);
          } catch (insertErr) {
            console.warn('Could not auto-insert:', insertErr.message);
          }
        }
      }
    } catch (err) {
      console.error('❌ Error querying MongoDB:', err.message);
    }
  } else {
    console.log(`⚠️ MongoDB not ready (state: ${mongoStatus}), using memory data`);
  }
  
  console.log(`📤 Returning data from ${source}:`, {
    temperature: data.temperature,
    humidity: data.humidity,
    soilMoisture: data.soilMoisture,
    lightLevel: data.lightLevel
  });
  
  res.json({ 
    success: true, 
    data: data, 
    source: source,
    mongoStatus: mongoStatus
  });
});

// Force insert specific data
app.post('/api/data/force-insert', async (req, res) => {
  try {
    const { temperature = 20, humidity = 30, soilMoisture = 280, lightLevel = 600 } = req.body;
    
    const forcedData = {
      temperature: Number(temperature),
      humidity: Number(humidity),
      soilMoisture: Number(soilMoisture),
      lightLevel: Number(lightLevel),
      recordedAt: new Date()
    };
    
    console.log('💪 Force inserting:', forcedData);
    
    let result = null;
    if (mongoConnected) {
      result = await GreenhouseData.create(forcedData);
      memoryData = { ...forcedData };
    }
    
    res.json({
      success: true,
      data: result ? result.toObject() : forcedData,
      message: 'Data force-inserted successfully'
    });
    
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Devices (unified)
app.get('/api/devices/status', requireAuth, async (req, res) => {
  let device = null;
  
  if (mongoConnected) {
    try {
      device = await Device.findOne().lean();
    } catch (err) {
      console.warn('Failed to fetch device from MongoDB:', err.message);
    }
  }
  
  if (!device) {
    device = fallbackDevices;
  }
  
  res.json({ success: true, data: device, source: device === fallbackDevices ? 'fallback' : 'mongodb' });
});

app.put('/api/devices/:device', requireAuth, async (req, res) => {
  const deviceName = req.params.device.toLowerCase();
  const { status } = req.body;
  
  if (mongoConnected) {
    try {
      let device = await Device.findOne();
      if (!device) device = await Device.create({ pumpStatus: 'OFF', coverStatus: 'CLOSED' });
      
      if (deviceName === 'pump') device.pumpStatus = status;
      if (deviceName === 'cover') device.coverStatus = status;
      device.updatedAt = new Date();
      
      await device.save();
      return res.json({ success: true, data: device, source: 'mongodb' });
    } catch (err) {
      console.warn('Failed to update device in MongoDB:', err.message);
    }
  }
  
  // Fallback
  if (deviceName === 'pump') fallbackDevices.pumpStatus = status;
  if (deviceName === 'cover') fallbackDevices.coverStatus = status;
  fallbackDevices.updatedAt = new Date();
  
  res.json({ 
    success: true, 
    data: fallbackDevices, 
    source: 'fallback',
    warning: 'Changes will be lost on server restart'
  });
});

// Targets (unified)
app.get('/api/targets', requireAuth, async (req, res) => {
  let targets = null;
  
  if (mongoConnected) {
    try {
      targets = await Target.findOne().lean();
    } catch (err) {
      console.warn('Failed to fetch targets from MongoDB:', err.message);
    }
  }
  
  if (!targets) {
    targets = fallbackTargets;
  }
  
  res.json({ success: true, data: targets, source: targets === fallbackTargets ? 'fallback' : 'mongodb' });
});

app.put('/api/targets', requireAuth, async (req, res) => {
  const { temperature, humidity, soil, light, plantType } = req.body;
  
  if (mongoConnected) {
    try {
      let t = await Target.findOne();
      if (!t) {
        t = await Target.create({ temperature, humidity, soil, light, plantType });
      } else {
        Object.assign(t, { temperature, humidity, soil, light, plantType });
        await t.save();
      }
      return res.json({ success: true, data: t, source: 'mongodb' });
    } catch (err) {
      console.warn('Failed to update targets in MongoDB:', err.message);
    }
  }
  
  // Fallback
  fallbackTargets = { temperature, humidity, soil, light, plantType };
  res.json({ 
    success: true, 
    data: fallbackTargets, 
    source: 'fallback',
    warning: 'Changes will be lost on server restart'
  });
});

// Logs (unified)
app.post('/api/logs', requireAuth, async (req, res) => {
  const { message, type = 'SYSTEM' } = req.body;
  const logEntry = { message, type, createdAt: new Date() };
  
  if (mongoConnected) {
    try {
      const log = await Log.create(logEntry);
      return res.json({ success: true, data: log, source: 'mongodb' });
    } catch (err) {
      console.warn('Failed to save log to MongoDB:', err.message);
    }
  }
  
  // Fallback
  fallbackLogs.unshift(logEntry);
  if (fallbackLogs.length > 1000) fallbackLogs.pop();
  
  res.json({ 
    success: true, 
    data: logEntry, 
    source: 'fallback',
    warning: 'Logs will be lost on server restart'
  });
});

app.get('/api/logs', requireAuth, async (req, res) => {
  const { type = 'all', limit = 20 } = req.query;
  const limitNum = Number(limit) || 20;
  
  if (mongoConnected) {
    try {
      const query = type === 'all' ? {} : { type };
      const logs = await Log.find(query).sort({ createdAt: -1 }).limit(limitNum).lean();
      return res.json({ success: true, data: logs, source: 'mongodb' });
    } catch (err) {
      console.warn('Failed to fetch logs from MongoDB:', err.message);
    }
  }
  
  // Fallback
  let logs = fallbackLogs;
  if (type !== 'all') {
    logs = fallbackLogs.filter(log => log.type === type);
  }
  const result = logs.slice(0, limitNum);
  
  res.json({ 
    success: true, 
    data: result, 
    source: 'fallback',
    warning: 'Logs will be lost on server restart'
  });
});

// Statistics (with fallback)
app.get('/api/statistics', requireAuth, async (req, res) => {
  const { period = 'day' } = req.query;
  
  if (mongoConnected) {
    try {
      const since = new Date(Date.now() - (period === 'day' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000));
      const docs = await GreenhouseData.find({ recordedAt: { $gte: since } }).lean();
      
      if (docs.length > 0) {
        const statsFor = field => {
          const vals = docs.map(d => Number(d[field]) || 0);
          const sum = vals.reduce((a, b) => a + b, 0);
          return { min: Math.min(...vals), max: Math.max(...vals), avg: sum / vals.length };
        };
        
        return res.json({
          success: true,
          data: {
            temperature: statsFor('temperature'),
            humidity: statsFor('humidity'),
            soilMoisture: statsFor('soilMoisture'),
            lightLevel: statsFor('lightLevel')
          },
          source: 'mongodb'
        });
      }
    } catch (err) {
      console.warn('Failed to fetch statistics from MongoDB:', err.message);
    }
  }
  
  // Fallback: return current data as statistics
  res.json({
    success: true,
    data: {
      temperature: { min: memoryData.temperature, max: memoryData.temperature, avg: memoryData.temperature },
      humidity: { min: memoryData.humidity, max: memoryData.humidity, avg: memoryData.humidity },
      soilMoisture: { min: memoryData.soilMoisture, max: memoryData.soilMoisture, avg: memoryData.soilMoisture },
      lightLevel: { min: memoryData.lightLevel, max: memoryData.lightLevel, avg: memoryData.lightLevel }
    },
    source: 'fallback',
    warning: 'Using current values as statistics'
  });
});

// Emergency user management endpoint
app.get('/api/users/fallback', (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET || 'default-secret-change-me';
  const provided = req.headers['x-admin-secret'];
  
  if (!provided || provided !== adminSecret) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  
  res.json({
    success: true,
    data: {
      fallbackUsers,
      mongoConnected,
      totalUsers: fallbackUsers.length + (mongoConnected ? ' (+ MongoDB users)' : '')
    }
  });
});

// Database initialization endpoint
app.post('/api/database/init', async (req, res) => {
  try {
    console.log('🔄 Initializing database with sample data...');
    
    const sampleData = {
      temperature: 20,
      humidity: 30,
      soilMoisture: 280,
      lightLevel: 600,
      recordedAt: new Date()
    };
    
    let insertedId = null;
    let source = 'memory';
    
    if (mongoConnected) {
      try {
        const doc = await GreenhouseData.create(sampleData);
        insertedId = doc._id;
        source = 'mongodb';
        memoryData = { ...sampleData };
        console.log('✅ Database initialized with sample data, ID:', insertedId);
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    }
    
    res.json({
      success: true,
      message: 'Database initialization attempted',
      data: sampleData,
      insertedId: insertedId,
      source: source,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend - FIXED PATH (was broken)
// Serve static files from multiple locations
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'Front_End'))); // Add this line
app.use(express.static(path.join(__dirname, '..', 'public')));    // And this line
app.get('/', (req, res) => {
  const possiblePaths = [
    path.join(__dirname, 'public', 'embedded.html'),
    path.join(__dirname, 'Front_End', 'embedded.html'),
    path.join(__dirname, 'embedded.html'),
    path.join(__dirname, '..', 'Front_End', 'embedded.html'), // Looks up one level
    path.join(__dirname, '..', 'embedded.html') // Looks up one level
    
  ];
  
  for (const filePath of possiblePaths) {
    if (require('fs').existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // If no file found, send simple message
  res.send(`
    <html>
      <body>
        <h1>Greenhouse Dashboard Backend</h1>
        <p>Backend is running! API available at:</p>
        <ul>
          <li><a href="/api/health">/api/health</a> - Health check</li>
          <li><a href="/api/plant-presets">/api/plant-presets</a> - Plant presets</li>
          <li><a href="/api/data/current">/api/data/current</a> - Current sensor data</li>
          <li><a href="/api/data/all">/api/data/all</a> - All sensor data</li>
          <li><a href="/api/data/test">/api/data/test</a> - Insert test data</li>
          <li><a href="/api/database/init">/api/database/init</a> - Initialize database</li>
        </ul>
        <p>Frontend file not found. Place your frontend in:</p>
        <ul>
          <li>public/embedded.html</li>
          <li>Front_End/embedded.html</li>
          <li>or directly as embedded.html</li>
        </ul>
      </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Greenhouse backend running at http://localhost:${PORT}`);
  console.log(`📊 Mode: ${mongoConnected ? 'MongoDB + Fallback' : 'Fallback Only'}`);
  console.log(`👤 Default users: ${fallbackUsers.map(u => u.username).join(', ')}`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api/health`);
  console.log(`📡 Database check: http://localhost:${PORT}/api/data/all`);
  console.log(`💡 Initialize DB: http://localhost:${PORT}/api/database/init`);
});