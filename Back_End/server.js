const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mock database
const users = [
    { id: 1, username: 'user', password: 'pass', name: 'Greenhouse User', role: 'user' },
    { id: 2, username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' }
];

// Greenhouse state
let greenhouseState = {
    // Current readings
    current: {
        temperature: 24.5,
        humidity: 65,
        soilMoisture: 72,
        lightLevel: 850,
        waterLevel: 85,
        phLevel: 6.8,
        co2Level: 450
    },
    
    // Targets
    targets: {
        temperature: 24,
        humidity: 65,
        light: 850,
        soil: 70,
        ph: 6.5,
        co2: 400
    },
    
    // System status
    system: {
        pump: 'READY',
        cover: 'Open',
        lights: 'Auto',
        fan: 'Off',
        heater: 'Off',
        co2Injector: 'Off'
    },
    
    // Plant info
    plant: {
        type: 'Custom',
        growthStage: 'Vegetative',
        health: 'Good',
        plantedDate: '2024-01-15'
    },
    
    // Time simulation
    timeSimulation: {
        isActive: true,
        speed: 1,
        currentHour: 12,
        isDay: true,
        sunrise: 6,
        sunset: 18
    }
};

// System logs
let systemLogs = [
    { id: 1, time: '14:32:15', message: 'Soil moisture dropped below 30% in Section B', type: 'ALERT' },
    { id: 2, time: '14:30:45', message: 'Automatic irrigation started for Tomato plants', type: 'IRRIGATION' },
    { id: 3, time: '14:28:10', message: 'Greenhouse cover opened for ventilation', type: 'CLIMATE' },
    { id: 4, time: '14:25:33', message: 'Sensor #TEMP-004 recalibrated successfully', type: 'SYSTEM' },
    { id: 5, time: '14:20:15', message: 'Light levels optimal at 850 lux', type: 'CLIMATE' },
    { id: 6, time: '14:15:42', message: 'Temperature approaching upper limit (28°C)', type: 'ALERT' },
    { id: 7, time: '14:10:05', message: 'Backup power system test completed', type: 'SYSTEM' },
    { id: 8, time: '14:05:22', message: 'Water reservoir at 85% capacity', type: 'IRRIGATION' }
];

// Plant presets
const plantPresets = {
    oregano: {
        name: 'Oregano',
        temperature: 22,
        humidity: 60,
        light: 800,
        soil: 65,
        ph: 6.0,
        co2: 380
    },
    cilantro: {
        name: 'Cilantro',
        temperature: 20,
        humidity: 70,
        light: 900,
        soil: 75,
        ph: 6.5,
        co2: 420
    },
    tomato: {
        name: 'Tomato',
        temperature: 24,
        humidity: 65,
        light: 1000,
        soil: 70,
        ph: 6.8,
        co2: 450
    },
    chilipepper: {
        name: 'Chili Pepper',
        temperature: 26,
        humidity: 55,
        light: 1100,
        soil: 60,
        ph: 5.5,
        co2: 500
    },
    custom: {
        name: 'Custom',
        temperature: 24,
        humidity: 65,
        light: 850,
        soil: 70,
        ph: 6.5,
        co2: 400
    }
};

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            error: 'Unauthorized. Please login first.' 
        });
    }
    // In a real app, verify JWT token
    next();
};

// ==================== ROUTES ====================

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ AUTHENTICATION ROUTES ============
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username });
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Generate token (in production, use JWT)
        const token = `gh-token-${Date.now()}-${user.id}`;
        
        // Log login event
        addLog(`User ${username} logged in`, 'SYSTEM');
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid username or password'
        });
    }
});

app.post('/api/logout', authenticate, (req, res) => {
    const token = req.headers.authorization;
    console.log('Logout for token:', token.substring(0, 20) + '...');
    
    res.json({ 
        success: true, 
        message: 'Logged out successfully' 
    });
});

// ============ GREENHOUSE DATA ROUTES ============
app.get('/api/greenhouse/status', authenticate, (req, res) => {
    res.json({
        success: true,
        data: {
            current: greenhouseState.current,
            targets: greenhouseState.targets,
            system: greenhouseState.system,
            plant: greenhouseState.plant,
            timeSimulation: greenhouseState.timeSimulation
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/greenhouse/history', authenticate, (req, res) => {
    const { hours = 24 } = req.query;
    const history = generateHistoryData(parseInt(hours));
    
    res.json({
        success: true,
        data: history,
        hours: parseInt(hours)
    });
});

// ============ CONTROL ROUTES ============
app.post('/api/greenhouse/targets', authenticate, (req, res) => {
    const updates = req.body;
    
    Object.keys(updates).forEach(key => {
        if (greenhouseState.targets.hasOwnProperty(key)) {
            greenhouseState.targets[key] = updates[key];
        }
    });
    
    addLog(`Targets updated: ${JSON.stringify(updates)}`, 'SYSTEM');
    
    res.json({
        success: true,
        message: 'Targets updated successfully',
        data: greenhouseState.targets
    });
});

app.post('/api/greenhouse/preset', authenticate, (req, res) => {
    const { plantType } = req.body;
    
    if (plantPresets[plantType]) {
        greenhouseState.targets = { ...greenhouseState.targets, ...plantPresets[plantType] };
        greenhouseState.plant.type = plantPresets[plantType].name;
        
        addLog(`Applied ${plantType} preset`, 'SYSTEM');
        
        res.json({
            success: true,
            message: `Applied ${plantType} preset`,
            data: greenhouseState.targets,
            plant: greenhouseState.plant
        });
    } else {
        res.status(400).json({
            success: false,
            error: 'Invalid plant type'
        });
    }
});

// ============ DEVICE CONTROL ROUTES ============
app.post('/api/device/pump', authenticate, (req, res) => {
    const { action } = req.body;
    
    if (action === 'toggle') {
        const newStatus = greenhouseState.system.pump === 'RUNNING' ? 'READY' : 'RUNNING';
        greenhouseState.system.pump = newStatus;
        
        addLog(`Water pump ${newStatus === 'RUNNING' ? 'started' : 'stopped'}`, 'IRRIGATION');
        
        res.json({
            success: true,
            message: `Pump ${newStatus === 'RUNNING' ? 'started' : 'stopped'}`,
            status: newStatus
        });
    } else if (action === 'status') {
        res.json({
            success: true,
            status: greenhouseState.system.pump
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid action' 
        });
    }
});

app.post('/api/device/cover', authenticate, (req, res) => {
    const { action } = req.body;
    
    if (action === 'toggle') {
        const newStatus = greenhouseState.system.cover === 'Open' ? 'Closed' : 'Open';
        greenhouseState.system.cover = newStatus;
        
        addLog(`Greenhouse cover ${newStatus.toLowerCase()}`, 'CLIMATE');
        
        res.json({
            success: true,
            message: `Cover ${newStatus}`,
            status: newStatus
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid action' 
        });
    }
});

app.post('/api/device/lights', authenticate, (req, res) => {
    const { action } = req.body;
    
    if (['On', 'Off', 'Auto'].includes(action)) {
        greenhouseState.system.lights = action;
        
        addLog(`Lights set to ${action}`, 'SYSTEM');
        
        res.json({
            success: true,
            message: `Lights set to ${action}`,
            status: action
        });
    } else {
        res.status(400).json({ 
            success: false, 
            error: 'Invalid action' 
        });
    }
});

// ============ TIME SIMULATION ROUTES ============
app.post('/api/time/simulation', authenticate, (req, res) => {
    const { speed, currentHour, isActive } = req.body;
    
    if (speed !== undefined) {
        greenhouseState.timeSimulation.speed = speed;
        addLog(`Time simulation speed set to ${speed}x`, 'SYSTEM');
    }
    
    if (currentHour !== undefined) {
        greenhouseState.timeSimulation.currentHour = currentHour;
        greenhouseState.timeSimulation.isDay = 
            currentHour >= greenhouseState.timeSimulation.sunrise && 
            currentHour < greenhouseState.timeSimulation.sunset;
    }
    
    if (isActive !== undefined) {
        greenhouseState.timeSimulation.isActive = isActive;
        addLog(`Time simulation ${isActive ? 'resumed' : 'paused'}`, 'SYSTEM');
    }
    
    res.json({
        success: true,
        data: greenhouseState.timeSimulation
    });
});

// ============ LOGS ROUTES ============
app.get('/api/logs', authenticate, (req, res) => {
    const { type, limit = 50 } = req.query;
    
    let filteredLogs = systemLogs;
    if (type && type !== 'all') {
        filteredLogs = systemLogs.filter(log => 
            log.type.toLowerCase() === type.toLowerCase()
        );
    }
    
    // Apply limit
    filteredLogs = filteredLogs.slice(0, parseInt(limit));
    
    res.json({
        success: true,
        logs: filteredLogs,
        total: systemLogs.length,
        filtered: filteredLogs.length
    });
});

app.post('/api/logs', authenticate, (req, res) => {
    const { message, type = 'SYSTEM' } = req.body;
    
    if (!message || message.trim() === '') {
        return res.status(400).json({ 
            success: false, 
            error: 'Message is required' 
        });
    }
    
    const newLog = addLog(message, type);
    
    res.json({
        success: true,
        log: newLog,
        message: 'Log added successfully'
    });
});

app.delete('/api/logs', authenticate, (req, res) => {
    systemLogs = [];
    addLog('All logs cleared', 'SYSTEM');
    
    res.json({
        success: true,
        message: 'All logs cleared'
    });
});

// ============ SYSTEM ROUTES ============
app.get('/api/system/health', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        greenhouse: {
            connected: true,
            sensors: 8,
            devices: 6
        }
    });
});

app.post('/api/system/reset', authenticate, (req, res) => {
    // Reset to defaults
    greenhouseState.targets = { ...plantPresets.custom };
    greenhouseState.plant.type = 'Custom';
    
    addLog('System reset to defaults', 'SYSTEM');
    
    res.json({
        success: true,
        message: 'System reset to defaults',
        data: greenhouseState.targets
    });
});

// ============ SIMULATION UPDATE ROUTE ============
app.post('/api/simulate/update', authenticate, (req, res) => {
    // Simulate sensor readings changes
    simulateSensorReadings();
    
    res.json({
        success: true,
        data: greenhouseState.current,
        message: 'Sensor data updated'
    });
});

// ============ HELPER FUNCTIONS ============
function addLog(message, type) {
    const newLog = {
        id: systemLogs.length + 1,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message: message,
        type: type.toUpperCase()
    };
    
    systemLogs.unshift(newLog);
    
    // Keep only last 1000 logs
    if (systemLogs.length > 1000) {
        systemLogs = systemLogs.slice(0, 1000);
    }
    
    return newLog;
}

function simulateSensorReadings() {
    // Simulate realistic changes
    greenhouseState.current.temperature = parseFloat(
        (greenhouseState.targets.temperature + (Math.random() * 2 - 1)).toFixed(1)
    );
    
    greenhouseState.current.humidity = Math.max(30, Math.min(90,
        greenhouseState.targets.humidity + Math.floor(Math.random() * 10 - 5)
    ));
    
    greenhouseState.current.soilMoisture = Math.max(30, Math.min(90,
        greenhouseState.targets.soil + Math.floor(Math.random() * 10 - 5)
    ));
    
    // Light depends on time of day
    const hour = greenhouseState.timeSimulation.currentHour;
    const isDay = hour >= 6 && hour < 18;
    greenhouseState.current.lightLevel = isDay ? 
        Math.floor(800 + Math.random() * 400) : 
        Math.floor(50 + Math.random() * 50);
    
    // Water level slowly decreases
    if (greenhouseState.system.pump === 'RUNNING') {
        greenhouseState.current.waterLevel = Math.max(0, 
            greenhouseState.current.waterLevel - 0.5
        );
    }
    
    // Add alerts if conditions are poor
    checkConditions();
}

function checkConditions() {
    const { current, targets } = greenhouseState;
    
    if (current.soilMoisture < targets.soil - 10) {
        addLog(`Low soil moisture: ${current.soilMoisture}% (target: ${targets.soil}%)`, 'ALERT');
    }
    
    if (Math.abs(current.temperature - targets.temperature) > 3) {
        addLog(`Temperature deviation: ${current.temperature}°C (target: ${targets.temperature}°C)`, 'ALERT');
    }
    
    if (current.waterLevel < 20) {
        addLog(`Low water level: ${current.waterLevel}%`, 'ALERT');
    }
}

function generateHistoryData(hours) {
    const history = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        history.push({
            timestamp: time.toISOString(),
            temperature: greenhouseState.targets.temperature + (Math.random() * 4 - 2),
            humidity: greenhouseState.targets.humidity + (Math.random() * 10 - 5),
            soilMoisture: greenhouseState.targets.soil + (Math.random() * 10 - 5),
            lightLevel: time.getHours() >= 6 && time.getHours() < 18 ? 
                800 + Math.random() * 400 : 50 + Math.random() * 50
        });
    }
    
    return history;
}

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🌱 AUTOMATED HERB GREENHOUSE BACKEND');
    console.log('='.repeat(50));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Static files served from: ./public`);
    console.log('\n🔌 AVAILABLE API ENDPOINTS:');
    console.log('   POST   /api/login              - User authentication');
    console.log('   POST   /api/logout             - User logout');
    console.log('   GET    /api/greenhouse/status  - Get current greenhouse data');
    console.log('   GET    /api/greenhouse/history - Get historical data');
    console.log('   POST   /api/greenhouse/targets - Update target values');
    console.log('   POST   /api/greenhouse/preset  - Apply plant preset');
    console.log('   POST   /api/device/pump        - Control water pump');
    console.log('   POST   /api/device/cover       - Control greenhouse cover');
    console.log('   POST   /api/device/lights      - Control lights');
    console.log('   POST   /api/time/simulation    - Control time simulation');
    console.log('   GET    /api/logs              - Get system logs');
    console.log('   POST   /api/logs              - Add new log');
    console.log('   GET    /api/system/health     - System health check');
    console.log('   POST   /api/simulate/update   - Update sensor readings');
    console.log('\n🔧 DEMO CREDENTIALS:');
    console.log('   Username: user / admin');
    console.log('   Password: pass / admin123');
    console.log('='.repeat(50));
});

// Auto-update simulation every 30 seconds
setInterval(() => {
    if (greenhouseState.timeSimulation.isActive) {
        simulateSensorReadings();
    }
}, 30000);