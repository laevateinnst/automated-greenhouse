// ========== API INTEGRATION MODULE ==========

// API Configuration
const API_BASE_URL = window.location.origin;
const API_ENDPOINTS = {
    login: '/api/login',
    logout: '/api/logout',
    greenhouseStatus: '/api/greenhouse/status',
    greenhouseHistory: '/api/greenhouse/history',
    greenhouseTargets: '/api/greenhouse/targets',
    greenhousePreset: '/api/greenhouse/preset',
    devicePump: '/api/device/pump',
    deviceCover: '/api/device/cover',
    deviceLights: '/api/device/lights',
    timeSimulation: '/api/time/simulation',
    logs: '/api/logs',
    systemHealth: '/api/system/health',
    systemReset: '/api/system/reset',
    simulateUpdate: '/api/simulate/update'
};

// Authentication token
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// ========== API REQUEST FUNCTIONS ==========

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = API_BASE_URL + endpoint;
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Add auth token if available
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
        method,
        headers,
        credentials: 'same-origin'
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        console.log(`API Request: ${method} ${url}`, data);
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            // Token expired or invalid
            handleUnauthorized();
            throw new Error('Session expired. Please login again.');
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `API Error: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error('API Request Failed:', error);
        showToast(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

function handleUnauthorized() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Redirect to login or show login overlay
    if (window.location.pathname !== '/') {
        window.location.href = '/';
    } else {
        showLogin();
    }
}

// ========== AUTHENTICATION FUNCTIONS ==========

async function apiLogin(username, password) {
    try {
        const result = await apiRequest(API_ENDPOINTS.login, 'POST', {
            username,
            password
        });
        
        if (result.success) {
            authToken = result.token;
            currentUser = result.user;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            return result;
        }
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

async function apiLogout() {
    try {
        await apiRequest(API_ENDPOINTS.logout, 'POST');
    } finally {
        // Clear local storage regardless of API response
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

// ========== GREENHOUSE DATA FUNCTIONS ==========

async function getGreenhouseStatus() {
    try {
        return await apiRequest(API_ENDPOINTS.greenhouseStatus);
    } catch (error) {
        console.error('Failed to get greenhouse status:', error);
        return null;
    }
}

async function getGreenhouseHistory(hours = 24) {
    try {
        return await apiRequest(`${API_ENDPOINTS.greenhouseHistory}?hours=${hours}`);
    } catch (error) {
        console.error('Failed to get greenhouse history:', error);
        return null;
    }
}

async function updateGreenhouseTargets(targets) {
    try {
        return await apiRequest(API_ENDPOINTS.greenhouseTargets, 'POST', targets);
    } catch (error) {
        console.error('Failed to update targets:', error);
        throw error;
    }
}

async function applyPlantPreset(plantType) {
    try {
        return await apiRequest(API_ENDPOINTS.greenhousePreset, 'POST', { plantType });
    } catch (error) {
        console.error('Failed to apply preset:', error);
        throw error;
    }
}

// ========== DEVICE CONTROL FUNCTIONS ==========

async function controlPump(action = 'toggle') {
    try {
        return await apiRequest(API_ENDPOINTS.devicePump, 'POST', { action });
    } catch (error) {
        console.error('Failed to control pump:', error);
        throw error;
    }
}

async function controlCover(action = 'toggle') {
    try {
        return await apiRequest(API_ENDPOINTS.deviceCover, 'POST', { action });
    } catch (error) {
        console.error('Failed to control cover:', error);
        throw error;
    }
}

async function controlLights(action = 'Auto') {
    try {
        return await apiRequest(API_ENDPOINTS.deviceLights, 'POST', { action });
    } catch (error) {
        console.error('Failed to control lights:', error);
        throw error;
    }
}

// ========== TIME SIMULATION FUNCTIONS ==========

async function updateTimeSimulation(data) {
    try {
        return await apiRequest(API_ENDPOINTS.timeSimulation, 'POST', data);
    } catch (error) {
        console.error('Failed to update time simulation:', error);
        throw error;
    }
}

// ========== LOGS FUNCTIONS ==========

async function getLogs(type = 'all', limit = 50) {
    try {
        return await apiRequest(`${API_ENDPOINTS.logs}?type=${type}&limit=${limit}`);
    } catch (error) {
        console.error('Failed to get logs:', error);
        return null;
    }
}

async function addLog(message, type = 'SYSTEM') {
    try {
        return await apiRequest(API_ENDPOINTS.logs, 'POST', { message, type });
    } catch (error) {
        console.error('Failed to add log:', error);
        throw error;
    }
}

// ========== SYSTEM FUNCTIONS ==========

async function getSystemHealth() {
    try {
        return await apiRequest(API_ENDPOINTS.systemHealth);
    } catch (error) {
        console.error('Failed to get system health:', error);
        return null;
    }
}

async function resetSystem() {
    try {
        return await apiRequest(API_ENDPOINTS.systemReset, 'POST');
    } catch (error) {
        console.error('Failed to reset system:', error);
        throw error;
    }
}

async function simulateSensorUpdate() {
    try {
        return await apiRequest(API_ENDPOINTS.simulateUpdate, 'POST');
    } catch (error) {
        console.error('Failed to simulate update:', error);
        throw error;
    }
}

// ========== DATA SYNCHRONIZATION ==========

let syncInterval = null;

function startDataSync(interval = 10000) {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    syncInterval = setInterval(async () => {
        if (authToken) {
            try {
                const status = await getGreenhouseStatus();
                if (status && status.success) {
                    updateLocalData(status.data);
                }
            } catch (error) {
                console.error('Data sync failed:', error);
            }
        }
    }, interval);
}

function stopDataSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

function updateLocalData(serverData) {
    // Update your local state with server data
    greenhouseState = {
        ...greenhouseState,
        coverOpen: serverData.system.cover === 'Open',
        lastIrrigation: new Date() // Update with actual from server if available
    };
    
    // Update current readings
    if (serverData.current) {
        if (temperatureValueElement) temperatureValueElement.textContent = `${serverData.current.temperature}°C`;
        if (humidityValueElement) humidityValueElement.textContent = `${serverData.current.humidity}%`;
        if (soilValueElement) soilValueElement.textContent = `${serverData.current.soilMoisture}%`;
        if (lightValueElement) lightValueElement.textContent = `${serverData.current.lightLevel} lux`;
    }
    
    // Update water pump state
    if (serverData.system) {
        waterpumpState.isActive = serverData.system.pump === 'RUNNING';
        updateWaterPumpDisplay();
    }
    
    // Update targets
    if (serverData.targets) {
        currentSettings.targets = { ...serverData.targets };
        updateTargetDisplays();
    }
    
    // Update plant info
    if (serverData.plant) {
        currentSettings.selectedPlant = serverData.plant.type.toLowerCase();
        updatePlantDisplay(currentSettings.selectedPlant);
    }
}

// ========== INTEGRATION WITH EXISTING CODE ==========

// Modify your existing login function
async function handleLogin(username, password) {
    try {
        const result = await apiLogin(username, password);
        
        if (result.success) {
            currentSettings.user = result.user.name;
            currentSettings.lastLogin = new Date();
            
            localStorage.setItem('plantCareUser', result.user.name);
            localStorage.setItem('lastLogin', currentSettings.lastLogin.toISOString());
            
            if (loggedUserElement) loggedUserElement.textContent = result.user.name;
            showDashboard();
            
            showToast(`Welcome back, ${result.user.name}!`, 'success');
            
            // Start data synchronization
            startDataSync();
            
            // Load initial data
            await loadInitialData();
            
            return true;
        }
    } catch (error) {
        showToast('Login failed: Invalid credentials', 'error');
        return false;
    }
}

// Modify logout function
async function handleLogout() {
    try {
        await apiLogout();
    } finally {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
        
        const logoutLog = document.createElement('div');
        logoutLog.className = 'log-entry system';
        logoutLog.innerHTML = `
            <div class="log-time">${timeString}</div>
            <div class="log-message">User "${currentSettings.user}" logged out</div>
            <div class="log-type">SYSTEM</div>
        `;
        if (logsList) logsList.prepend(logoutLog);
        
        localStorage.removeItem('plantCareUser');
        localStorage.removeItem('lastLogin');
        currentSettings.user = null;
        
        // Stop data synchronization
        stopDataSync();
        
        showLogin();
        showToast('Successfully logged out', 'success');
    }
}

// Load initial data from server
async function loadInitialData() {
    try {
        const [status, logs] = await Promise.all([
            getGreenhouseStatus(),
            getLogs('all', 20)
        ]);
        
        if (status && status.success) {
            updateLocalData(status.data);
        }
        
        if (logs && logs.success) {
            updateLogsDisplay(logs.logs);
        }
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
}

// Update logs display with server data
function updateLogsDisplay(logs) {
    if (!logsList) return;
    
    logsList.innerHTML = '';
    
    logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${log.type.toLowerCase()}`;
        logEntry.innerHTML = `
            <div class="log-time">${log.time}</div>
            <div class="log-message">${log.message}</div>
            <div class="log-type">${log.type}</div>
        `;
        logsList.appendChild(logEntry);
    });
}

// Modify apply targets function
async function applyTargets() {
    const targets = {
        temperature: tempTargetSlider ? parseFloat(tempTargetSlider.value) : 24,
        humidity: humidityTargetSlider ? parseFloat(humidityTargetSlider.value) : 65,
        light: lightTargetSlider ? parseFloat(lightTargetSlider.value) : 850,
        soil: soilTargetSlider ? parseFloat(soilTargetSlider.value) : 70
    };
    
    try {
        const result = await updateGreenhouseTargets(targets);
        
        if (result.success) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry climate';
            logEntry.innerHTML = `
                <div class="log-time">${timeString}</div>
                <div class="log-message">Targets applied: Temp: ${targets.temperature}°C, Humidity: ${targets.humidity}%, Light: ${targets.light} lux, Soil: ${targets.soil}%</div>
                <div class="log-type">CLIMATE</div>
            `;
            if (logsList) logsList.prepend(logEntry);
            
            // Also add log to server
            await addLog(`Targets applied: ${JSON.stringify(targets)}`, 'CLIMATE');
            
            showToast('Target settings applied to greenhouse system', 'success');
        }
    } catch (error) {
        console.error('Failed to apply targets:', error);
    }
}

// Modify plant preset function
async function applyPlantPresetWithAPI(plantType) {
    try {
        const result = await applyPlantPreset(plantType);
        
        if (result.success) {
            updatePlantDisplay(plantType);
            showToast(`${plantPresets[plantType].name} preset applied`, 'success');
            
            // Also update local sliders
            const preset = plantPresets[plantType];
            if (tempTargetSlider) tempTargetSlider.value = preset.temperature;
            if (humidityTargetSlider) humidityTargetSlider.value = preset.humidity;
            if (lightTargetSlider) lightTargetSlider.value = preset.light;
            if (soilTargetSlider) soilTargetSlider.value = preset.soil;
            
            updateTargetDisplays();
            currentSettings.targets = {...preset};
        }
    } catch (error) {
        console.error('Failed to apply preset:', error);
    }
}

// Modify water pump control
async function toggleWaterPump() {
    try {
        const result = await controlPump('toggle');
        
        if (result.success) {
            waterpumpState.isActive = result.status === 'RUNNING';
            waterpumpState.lastIrrigation = new Date();
            
            // Update display
            updateWaterPumpDisplay();
            
            // Add log
            await addLog(`Water pump ${waterpumpState.isActive ? 'started' : 'stopped'}`, 'IRRIGATION');
            
            showToast(waterpumpState.isActive ? 'Irrigation started' : 'Irrigation stopped', 'success');
        }
    } catch (error) {
        console.error('Failed to control pump:', error);
    }
}

// Modify greenhouse cover control
async function toggleGreenhouseCover() {
    try {
        const result = await controlCover('toggle');
        
        if (result.success) {
            greenhouseState.coverOpen = result.status === 'Open';
            
            if (greenhouseState.coverOpen) {
                if (coverStatusElement) coverStatusElement.classList.remove('closed');
                if (coverStateElement) {
                    coverStateElement.textContent = 'Open';
                    coverStateElement.style.color = '#4caf50';
                }
                showToast('Greenhouse cover opened for ventilation', 'success');
                
                await addLog('Greenhouse cover opened for ventilation and sunlight', 'CLIMATE');
            } else {
                if (coverStatusElement) coverStatusElement.classList.add('closed');
                if (coverStateElement) {
                    coverStateElement.textContent = 'Closed';
                    coverStateElement.style.color = '#8d6e63';
                }
                showToast('Greenhouse cover closed for protection', 'info');
                
                await addLog('Greenhouse cover closed for temperature and humidity control', 'CLIMATE');
            }
        }
    } catch (error) {
        console.error('Failed to control cover:', error);
    }
}

// ========== INITIALIZATION ==========

// Check for existing session on page load
function checkApiSession() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        
        if (loggedUserElement) loggedUserElement.textContent = currentUser.name;
        showDashboard();
        
        // Start data synchronization
        startDataSync();
        
        // Load initial data
        loadInitialData();
        
        showToast(`Welcome back, ${currentUser.name}!`, 'success');
    } else {
        showLogin();
    }
}

// Update your existing initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Automated Herb Greenhouse System Initializing...');
    
    // Check API session first
    checkApiSession();
    
    initializeDashboard();
    initializeTimeSystem();
    initializeWaterPumpSystem();
    setupPanelVisibilityControls();
});