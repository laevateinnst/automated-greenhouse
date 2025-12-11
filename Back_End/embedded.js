// =================== GREENHOUSE DASHBOARD JS ===================
// Integrated with MongoDB backend API (with fallback support)

let panelVisibility = {
    waterpump: true,
    cover: true,
    allVisible: true
};

let waterpumpState = {
    isActive: false,
    isManualMode: false,
    lastIrrigation: new Date(Date.now() - 2 * 60 * 60 * 1000),
    waterLevel: 85,
    irrigationDuration: 15,
    flowRate: 5,
    waterTemperature: 22,
    isAutoIrrigationEnabled: true,
    autoThreshold: 40,
    reservoirCapacity: 100
};

let waterConsumptionInterval = null;
let currentSimulatedTime = new Date();
let timeSpeedMultiplier = 1;
let isTimePaused = false;
let timeMode = 'real';

const timeConfig = {
    sunrise: 6.5,
    sunset: 19.75,
    dawnStart: 5,
    dawnEnd: 7,
    duskStart: 18,
    duskEnd: 20,
    morningEnd: 12,
    afternoonEnd: 17
};

// DOM Elements
const waterpumpSection = document.querySelector('.waterpump-section');
const coverSection = document.querySelector('.cover-section');
const toggleWaterpumpVisibilityBtn = document.getElementById('toggle-waterpump-visibility');
const toggleCoverVisibilityBtn = document.getElementById('toggle-cover-visibility');
const waterpumpStatusElement = document.getElementById('waterpump-status');
const waterpumpStateIndicator = document.querySelector('#waterpump-state-indicator');
const toggleWaterpumpButton = document.getElementById('toggle-waterpump');
const manualModeButton = document.getElementById('manual-mode-btn');
const reservoirFillElement = document.getElementById('reservoir-fill');
const reservoirPercentageElement = document.getElementById('reservoir-percentage');
const currentWaterLevelElement = document.getElementById('current-water-level');
const lastIrrigationElement = document.getElementById('last-irrigation');
const waterpumpDetailElement = document.getElementById('waterpump-detail');
const currentSoilPumpElement = document.getElementById('current-soil-pump');
const soilFillElement = document.getElementById('soil-fill');
const soilTempElement = document.getElementById('soil-temp');
const pumpDurationElement = document.getElementById('pump-duration');
const pumpFlowRateElement = document.getElementById('pump-flow-rate');
const waterTempElement = document.getElementById('water-temp');
const autoStatusElement = document.getElementById('auto-status');
const autoThresholdSlider = document.getElementById('auto-threshold');
const thresholdValueElement = document.getElementById('threshold-value');
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const mainContainer = document.getElementById('main-container');
const loggedUserElement = document.getElementById('logged-user');
const logoutBtn = document.getElementById('logout-btn');
const plantNameDisplay = document.getElementById('plant-name-display');
const currentPlantTypeElement = document.getElementById('current-plant-type');
const plantOptions = document.querySelectorAll('.plant-option');
const tempTargetSlider = document.getElementById('temp-target');
const humidityTargetSlider = document.getElementById('humidity-target');
const lightTargetSlider = document.getElementById('light-target');
const soilTargetSlider = document.getElementById('soil-target');
const tempTargetValue = document.getElementById('temp-target-value');
const humidityTargetValue = document.getElementById('humidity-target-value');
const lightTargetValue = document.getElementById('light-target-value');
const soilTargetValue = document.getElementById('soil-target-value');
const currentTempElement = document.getElementById('current-temp');
const currentHumidityElement = document.getElementById('current-humidity');
const currentLightElement = document.getElementById('current-light');
const currentSoilElement = document.getElementById('current-soil');
const savePresetBtn = document.getElementById('save-preset');
const applyTargetsBtn = document.getElementById('apply-targets');
const resetTargetsBtn = document.getElementById('reset-targets');
const themeToggle = document.getElementById('theme-toggle');
const currentTimeElement = document.getElementById('current-time');
const temperatureValueElement = document.getElementById('temperature-value');
const humidityValueElement = document.getElementById('humidity-value');
const soilValueElement = document.getElementById('soil-value');
const lightValueElement = document.getElementById('light-value');
const coverStatusElement = document.getElementById('cover-status');
const coverStateElement = document.querySelector('.cover-state');
const toggleCoverButton = document.getElementById('toggle-cover');
const chartButtons = document.querySelectorAll('.chart-btn');
const logModeButtons = document.querySelectorAll('.log-mode-btn');
const logsList = document.querySelector('.logs-list');
const refreshLogsBtn = document.getElementById('refresh-logs');
const addLogBtn = document.getElementById('add-log');
const exportLogsBtn = document.getElementById('export-logs');
const sunElement = document.getElementById('sun-element');
const moonElement = document.getElementById('moon-element');
const periodIcon = document.getElementById('period-icon');
const periodName = document.getElementById('period-name');
const periodTime = document.getElementById('period-time');
const timeProgressFill = document.getElementById('time-progress-fill');
const realTimeBtn = document.getElementById('real-time-btn');
const speedUpBtn = document.getElementById('speed-up-btn');
const pauseTimeBtn = document.getElementById('pause-time-btn');
const timeSimulationSlider = document.getElementById('time-simulation-slider');
const toggleTimeEffectsBtn = document.getElementById('toggle-time-effects');

// New DOM Elements for Alerts/Logs
const sunriseTimeElement = document.getElementById('sunrise-time');
const sunsetTimeElement = document.getElementById('sunset-time');
const daylightHoursElement = document.getElementById('daylight-hours');
const nightHoursElement = document.getElementById('night-hours');
const plantStateText = document.getElementById('plant-state-text');
const plantStateDesc = document.getElementById('plant-state-desc');

let environmentChart;
let currentChartType = 'temperature';
let timeEffectsVisible = true;
let apiAvailable = false;
let apiBaseUrl = 'http://localhost:5001';

const plantPresets = {
    cilantro: {
        name: "Cilantro",
        temperature: 21,
        humidity: 70,
        light: 800,
        soil: 75,
        description: "Prefers cooler temperatures and moderate humidity"
    },
    tomato: {
        name: "Tomato",
        temperature: 25,
        humidity: 65,
        light: 1000,
        soil: 70,
        description: "Loves warmth and plenty of sunlight"
    },
    chilipepper: {
        name: "Chili Pepper",
        temperature: 20,
        humidity: 75,
        light: 600,
        soil: 80,
        description: "Thrives in moist soil and partial shade"
    },
    oregano: {
        name: "Oregano",
        temperature: 24,
        humidity: 50,
        light: 1200,
        soil: 60,
        description: "Mediterranean herb that prefers dry conditions"
    },
    custom: {
        name: "Custom",
        temperature: 24,
        humidity: 65,
        light: 850,
        soil: 70,
        description: "Manual settings"
    }
};

let currentSettings = {
    selectedPlant: 'custom',
    targets: {...plantPresets.custom},
    user: null,
    lastLogin: null
};

let greenhouseState = {
    coverOpen: true,
    lastIrrigation: new Date(),
    lightsOn: true,
    systemActive: true
};

// =================== INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Automated Herb Greenhouse System Initializing...');
    
    // Check if API is available
    await checkApiAvailability();
    
    if (!apiAvailable) {
        console.warn('Backend API not available. Running in simulation mode.');
        showToast('Running in simulation mode (API unavailable)', 'warning');
    } else {
        console.log('Backend API is available');
        showToast('Connected to greenhouse API', 'success');
    }
    
    // Initialize database with test data
    await initializeDatabaseWithTestData();
    
    checkLoginStatus();
});

// =================== DATABASE INITIALIZATION ===================
async function initializeDatabaseWithTestData() {
    console.log('🔄 Initializing database with test data...');
    
    try {
        // First, check if we have data
        const checkResponse = await fetch('/api/data/all');
        const checkResult = await checkResponse.json();
        
        console.log('Database status:', checkResult);
        
        if (checkResult.hasData) {
            console.log(`✅ Database already has ${checkResult.count} documents`);
            return true;
        }
        
        // If no data, insert test data
        console.log('📝 Inserting test data into database...');
        
        // Use the exact data from your image
        const testData = {
            temperature: 20,
            humidity: 30,
            soilMoisture: 280,
            lightLevel: 600
        };
        
        const insertResponse = await fetch('/api/data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(testData)
        });
        
        const insertResult = await insertResponse.json();
        
        if (insertResult.success) {
            console.log('✅ Test data inserted:', insertResult);
            showToast('Database initialized with test data', 'success');
            return true;
        } else {
            console.warn('Failed to insert test data');
            return false;
        }
        
    } catch (error) {
        console.error('Database initialization failed:', error);
        return false;
    }
}

// =================== API CHECK & SETUP ===================
async function checkApiAvailability() {
    console.log('Checking API availability...');
    
    try {
        // Try to reach the health endpoint
        const response = await fetch('/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('API is available:', data);
            apiAvailable = true;
            return true;
        }
    } catch (error) {
        console.log('API not available, using simulated data:', error.message);
        apiAvailable = false;
    }
    
    return false;
}

// =================== API FUNCTIONS ===================
const greenhouseAPI = {
    authToken: localStorage.getItem('authToken') || null,
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    
    // REAL login to backend
    login: async function(username, password) {
        try {
            console.log('🔐 Attempting login to backend...');
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            
            const data = await response.json();
            console.log('Login response:', data);
            
            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                localStorage.setItem('plantCareUser', username);
                
                console.log('✅ Login successful, token:', this.authToken.substring(0, 20) + '...');
                return data;
            }
            
            return data;
            
        } catch (error) {
            console.error('Login failed:', error);
            return {success: false, error: 'Connection failed'};
        }
    },
    
    logout: async function() {
        try {
            if (this.authToken) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {'Authorization': `Bearer ${this.authToken}`}
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('plantCareUser');
        return {success: true};
    },
    
    checkApiSession: function() {
        return !!this.authToken && !!localStorage.getItem('plantCareUser');
    },
    
    // REAL data fetch
    getCurrentData: async function() {
        console.log('📡 Fetching REAL data from /api/data/current...');
        
        try {
            const response = await fetch('/api/data/current');
            const result = await response.json();
            
            console.log('API response:', result);
            
            if (result.success && result.data) {
                console.log('✅ Got REAL data from backend. Source:', result.source);
                return result.data;
            } else {
                console.warn('⚠️ API returned no data');
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to fetch data:', error);
            return null;
        }
    },
    
    // REAL device status fetch
    getDeviceStatus: async function() {
        if (!this.authToken) {
            console.log('No auth token, skipping device status');
            return null;
        }
        
        try {
            const response = await fetch('/api/devices/status', {
                headers: {'Authorization': `Bearer ${this.authToken}`}
            });
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Failed to get device status:', error);
            return null;
        }
    },
    
    // REAL API request function
    apiRequest: async function(endpoint, method = 'GET', data = null, requireAuth = true) {
        const headers = {'Content-Type': 'application/json'};
        
        if (requireAuth && this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        const options = {method, headers};
        if (data) options.body = JSON.stringify(data);
        
        try {
            const response = await fetch(endpoint, options);
            return await response.json();
        } catch (error) {
            console.error(`API Request failed (${method} ${endpoint}):`, error);
            throw error;
        }
    }
};

// Expose to window
window.greenhouseAPI = greenhouseAPI;

// =================== LOGIN & AUTHENTICATION ===================
async function checkLoginStatus() {
    console.log('Checking login status...');
    
    // Check session
    if (greenhouseAPI.checkApiSession()) {
        console.log('User authenticated');
        const user = greenhouseAPI.currentUser || JSON.parse(localStorage.getItem('currentUser'));
        currentSettings.user = user?.name || localStorage.getItem('plantCareUser') || 'User';
        
        if (loggedUserElement) loggedUserElement.textContent = currentSettings.user;
        
        showDashboard();
        initializeEverything();
        
        // Try to fetch data from database if API is available
        await fetchInitialDataFromDB();
        return;
    }
    
    // Check local storage fallback
    const savedUser = localStorage.getItem('plantCareUser');
    if (savedUser) {
        console.log('User found in localStorage (fallback):', savedUser);
        currentSettings.user = savedUser;
        if (loggedUserElement) loggedUserElement.textContent = savedUser;
        showDashboard();
        initializeEverything();
    } else {
        console.log('No user found, showing login');
        showLogin();
    }
}

async function fetchInitialDataFromDB() {
    try {
        console.log('Fetching initial data...');
        
        // Fetch and display current sensor data
        await updateSensorReadings();
        
        // Fetch and display device status (only if logged in)
        if (greenhouseAPI.authToken) {
            const deviceStatus = await greenhouseAPI.getDeviceStatus();
            if (deviceStatus) {
                waterpumpState.isActive = deviceStatus.pumpStatus === 'ON';
                updateWaterPumpDisplay();
                
                greenhouseState.coverOpen = deviceStatus.coverStatus === 'OPEN';
                updateCoverDisplay();
            }
            
            // Fetch and display user targets
            await greenhouseAPI.apiRequest('/api/targets', 'GET', null, true)
                .then(result => {
                    if (result.success && result.data) {
                        currentSettings.targets = result.data;
                        updateTargetSlidersFromSettings();
                        updateTargetDisplays();
                    }
                })
                .catch(err => console.error('Failed to fetch targets:', err));
        }
        
        console.log('Database data loaded successfully');
        showToast('Connected to database successfully', 'success');
        
    } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fall back to simulated data
        updateSensorReadingsSimulated();
        loadSavedSettings();
        showToast('Using simulated data', 'info');
    }
}

function showLogin() {
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (mainContainer) mainContainer.style.display = 'none';
}

function showDashboard() {
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'block';
    
    // Add login log
    addSystemLog(`User "${currentSettings.user}" logged in`);
    
    loadSavedSettings();
}

function initializeEverything() {
    initializeDashboard();
    initializeTimeSystem();
    initializeWaterPumpSystem();
    setupPanelVisibilityControls();
    initializeTimeEffectsToggle();
    initializeNotesFunctions();
    updateTimeOfDayDisplay();
}

// =================== LOGIN FORM HANDLER ===================
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        if (username && password) {
            try {
                const result = await greenhouseAPI.login(username, password);
                
                if (result.success) {
                    currentSettings.user = result.user?.name || username;
                    if (loggedUserElement) loggedUserElement.textContent = currentSettings.user;
                    
                    showDashboard();
                    initializeEverything();
                    
                    // Fetch data
                    await fetchInitialDataFromDB();
                    
                    showToast(`Welcome back, ${currentSettings.user}!`, 'success');
                    
                    // Clear form
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    showToast('Invalid username or password', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed. Please try again.', 'error');
            }
        } else {
            showToast('Please enter both username and password', 'error');
        }
    });
}

// =================== LOGOUT HANDLER ===================
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
        try {
            await greenhouseAPI.logout();
            
            // Clear local storage
            localStorage.removeItem('plantCareUser');
            localStorage.removeItem('plantCareSettings');
            localStorage.removeItem('waterPumpState');
            localStorage.removeItem('greenhouseLogs');
            
            currentSettings.user = null;
            showLogin();
            showToast('Successfully logged out', 'success');
            
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Logout failed', 'error');
        }
    });
}

// =================== DASHBOARD FUNCTIONS ===================
function initializeDashboard() {
    console.log('Initializing dashboard...');

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    updateTime();
    setInterval(updateTime, 1000);
    
    // Load logs from localStorage
    loadLogsFromLocalStorage();
    
    // Start data refresh
    startDataRefresh();
    
    setTimeout(() => {
        initializeChart();
    }, 500);
    
    setupEventListeners();
    
    // Add initial alerts
    addInitialAlerts();
}

function startDataRefresh() {
    // Refresh data every 10 seconds
    setInterval(async () => {
        await updateSensorReadings();
    }, 10000);
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.checked = false;
        localStorage.setItem('theme', 'light');
    }
    
    if (environmentChart) {
        updateChartColors();
    }
}

function updateTime() {
    if (!currentTimeElement) return;
    
    const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
    const timeString = now.toLocaleTimeString();
    currentTimeElement.textContent = timeString;
}

// =================== WATER PUMP SYSTEM ===================
function initializeWaterPumpSystem() {
    console.log('Initializing Water Pump System...');
    
    loadWaterPumpState();
    updateWaterPumpDisplay();
    setupWaterPumpListeners();
    startWaterLevelSimulation();
    startAutoIrrigationMonitoring();
    updateSoilMoistureDisplay();
}

function loadWaterPumpState() {
    const savedState = localStorage.getItem('waterPumpState');
    if (savedState) {
        const state = JSON.parse(savedState);
        waterpumpState = {
            ...waterpumpState,
            ...state,
            lastIrrigation: new Date(state.lastIrrigation)
        };
    }
}

function saveWaterPumpState() {
    const stateToSave = {
        ...waterpumpState,
        lastIrrigation: waterpumpState.lastIrrigation.toISOString()
    };
    localStorage.setItem('waterPumpState', JSON.stringify(stateToSave));
}

function updateWaterPumpDisplay() {
    if (waterpumpState.isActive) {
        waterpumpStatusElement.textContent = 'IRRIGATING';
        waterpumpStatusElement.classList.add('active');
        if (waterpumpStateIndicator) {
            waterpumpStateIndicator.className = 'status-indicator warning';
            waterpumpStateIndicator.style.animation = 'pulse 0.5s infinite';
        }
        
        if (toggleWaterpumpButton) {
            toggleWaterpumpButton.innerHTML = '<i class="fas fa-stop"></i> Stop Irrigation';
            toggleWaterpumpButton.classList.add('active');
        }
    } else {
        waterpumpStatusElement.textContent = 'READY';
        waterpumpStatusElement.classList.remove('active');
        if (waterpumpStateIndicator) {
            waterpumpStateIndicator.className = 'status-indicator optimal';
            waterpumpStateIndicator.style.animation = 'pulse 2s infinite';
        }
        
        if (toggleWaterpumpButton) {
            toggleWaterpumpButton.innerHTML = '<i class="fas fa-play"></i> Start Irrigation';
            toggleWaterpumpButton.classList.remove('active');
        }
    }
    
    updateIrrigationTime();
    updateWaterReservoir();
    
    if (manualModeButton) {
        if (waterpumpState.isManualMode) {
            manualModeButton.classList.add('active');
            manualModeButton.innerHTML = '<i class="fas fa-hand-paper"></i> Manual Mode ON';
        } else {
            manualModeButton.classList.remove('active');
            manualModeButton.innerHTML = '<i class="fas fa-hand-paper"></i> Manual Mode';
        }
    }
    
    if (pumpDurationElement) pumpDurationElement.textContent = `${waterpumpState.irrigationDuration} min`;
    if (pumpFlowRateElement) pumpFlowRateElement.textContent = `${waterpumpState.flowRate} L/min`;
    if (waterTempElement) waterTempElement.textContent = `${waterpumpState.waterTemperature}°C`;
    
    if (autoStatusElement) {
        if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode) {
            autoStatusElement.textContent = 'Enabled';
            autoStatusElement.className = 'setting-value auto-status';
        } else {
            autoStatusElement.textContent = 'Disabled';
            autoStatusElement.className = 'setting-value auto-status disabled';
        }
    }
    
    if (thresholdValueElement) thresholdValueElement.textContent = `${waterpumpState.autoThreshold}%`;
    if (autoThresholdSlider) autoThresholdSlider.value = waterpumpState.autoThreshold;
}

function updateIrrigationTime() {
    if (!lastIrrigationElement || !waterpumpDetailElement) return;
    
    const now = new Date();
    const timeDiff = now - waterpumpState.lastIrrigation;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (waterpumpState.isActive) {
        waterpumpDetailElement.textContent = 'Currently irrigating plants...';
        lastIrrigationElement.textContent = 'Now';
    } else if (hours > 0) {
        waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        lastIrrigationElement.textContent = `${hours}h ago`;
    } else if (minutes > 0) {
        waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        lastIrrigationElement.textContent = `${minutes}m ago`;
    } else {
        waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        lastIrrigationElement.textContent = 'Just now';
    }
}

function updateWaterReservoir() {
    const waterLevel = waterpumpState.waterLevel;
    
    if (reservoirFillElement) {
        reservoirFillElement.style.width = `${waterLevel}%`;
        
        if (waterLevel < 20) {
            reservoirFillElement.style.background = 'linear-gradient(to right, var(--danger-color), #ef5350)';
        } else if (waterLevel < 50) {
            reservoirFillElement.style.background = 'linear-gradient(to right, var(--warning-color), #ffb74d)';
        } else {
            reservoirFillElement.style.background = 'linear-gradient(to right, var(--water-color), #64b5f6)';
        }
    }
    
    if (reservoirPercentageElement) {
        reservoirPercentageElement.textContent = `${Math.round(waterLevel)}%`;
        
        if (waterLevel < 20) {
            reservoirPercentageElement.style.color = 'var(--danger-color)';
        } else if (waterLevel < 50) {
            reservoirPercentageElement.style.color = 'var(--warning-color)';
        } else {
            reservoirPercentageElement.style.color = 'var(--water-color)';
        }
    }
    
    if (currentWaterLevelElement) {
        const currentWater = Math.round((waterLevel / 100) * waterpumpState.reservoirCapacity);
        currentWaterLevelElement.textContent = `${currentWater}L`;
    }
}

function setupWaterPumpListeners() {
    if (toggleWaterpumpButton) {
        toggleWaterpumpButton.addEventListener('click', async function() {
            try {
                const newStatus = waterpumpState.isActive ? 'OFF' : 'ON';
                
                // Update device
                await greenhouseAPI.apiRequest(`/api/devices/pump`, 'PUT', { 
                    status: newStatus 
                }, true);
                
                waterpumpState.isActive = !waterpumpState.isActive;
                waterpumpState.lastIrrigation = new Date();
                
                // Add log entry
                await greenhouseAPI.apiRequest('/api/logs', 'POST', {
                    message: `Water pump ${waterpumpState.isActive ? 'started' : 'stopped'}`,
                    type: 'IRRIGATION'
                }, true);
                
                updateWaterPumpDisplay();
                
                showToast(waterpumpState.isActive ? 'Irrigation started' : 'Irrigation stopped', 'success');
                
                saveWaterPumpState();
                
            } catch (error) {
                console.error('Failed to toggle water pump:', error);
                showToast('Failed to control water pump. Using local mode.', 'warning');
                
                // Local fallback
                waterpumpState.isActive = !waterpumpState.isActive;
                waterpumpState.lastIrrigation = new Date();
                updateWaterPumpDisplay();
                saveWaterPumpState();
                showToast(waterpumpState.isActive ? 'Irrigation started (local)' : 'Irrigation stopped (local)', 'info');
            }
        });
    }
    
    if (manualModeButton) {
        manualModeButton.addEventListener('click', function() {
            waterpumpState.isManualMode = !waterpumpState.isManualMode;
            waterpumpState.isAutoIrrigationEnabled = !waterpumpState.isManualMode;
            
            addSystemLog(`Manual mode ${waterpumpState.isManualMode ? 'enabled' : 'disabled'}`);
            showToast(`Manual mode ${waterpumpState.isManualMode ? 'ON' : 'OFF'}`, 'info');
            updateWaterPumpDisplay();
            saveWaterPumpState();
        });
    }
    
    if (autoThresholdSlider) {
        autoThresholdSlider.addEventListener('input', function() {
            waterpumpState.autoThreshold = parseInt(this.value);
            if (thresholdValueElement) thresholdValueElement.textContent = `${waterpumpState.autoThreshold}%`;
            saveWaterPumpState();
            showToast(`Auto-irrigation threshold set to ${waterpumpState.autoThreshold}%`, 'info');
        });
    }
}

function startWaterLevelSimulation() {
    setInterval(() => {
        if (!waterpumpState.isActive) {
            if (waterpumpState.waterLevel > 0) {
                waterpumpState.waterLevel -= Math.random() * 0.01;
            }
            
            if (waterpumpState.waterLevel < 50 && Math.random() < 0.1) {
                waterpumpState.waterLevel += Math.random() * 10;
                waterpumpState.waterLevel = Math.min(100, waterpumpState.waterLevel);
                addIrrigationLog('Water reservoir auto-refilled');
            }
            
            updateWaterReservoir();
        }
        
        updateSoilMoistureDisplay();
    }, 30000);
}

function startAutoIrrigationMonitoring() {
    setInterval(() => {
        if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode && !waterpumpState.isActive) {
            const soilValueElement = document.getElementById('soil-value');
            if (soilValueElement) {
                const soilText = soilValueElement.textContent;
                const soilValue = parseFloat(soilText.replace(/[^\d.]/g, ''));
                
                if (soilValue < waterpumpState.autoThreshold && waterpumpState.waterLevel > 20) {
                    startIrrigation('auto');
                }
            }
        }
        
        if (waterpumpState.isActive) {
            const soilValueElement = document.getElementById('soil-value');
            if (soilValueElement) {
                const soilText = soilValueElement.textContent;
                const soilValue = parseFloat(soilText.replace(/[^\d.]/g, ''));
                
                if (soilValue > 70 || waterpumpState.waterLevel <= 5) {
                    stopIrrigation('auto');
                }
            }
        }
    }, 60000);
}

function updateSoilMoistureDisplay() {
    const soilValueElement = document.getElementById('soil-value');
    if (soilValueElement && currentSoilPumpElement && soilFillElement) {
        const soilText = soilValueElement.textContent;
        const soilValue = parseFloat(soilText.replace(/[^\d.]/g, ''));
        
        currentSoilPumpElement.textContent = `${soilValue}%`;
        soilFillElement.style.width = `${soilValue}%`;
        
        if (soilValue < 40) {
            soilFillElement.style.background = 'linear-gradient(to right, var(--danger-color), #ef5350)';
            currentSoilPumpElement.style.color = 'var(--danger-color)';
        } else if (soilValue < 60) {
            soilFillElement.style.background = 'linear-gradient(to right, var(--warning-color), #ffb74d)';
            currentSoilPumpElement.style.color = 'var(--warning-color)';
        } else {
            soilFillElement.style.background = 'linear-gradient(to right, var(--soil-color), #a1887f)';
            currentSoilPumpElement.style.color = 'var(--soil-color)';
        }
    }
    
    if (soilTempElement) {
        const currentHour = timeMode === 'real' ? 
            new Date().getHours() + new Date().getMinutes() / 60 : 
            currentSimulatedTime.getHours() + currentSimulatedTime.getMinutes() / 60;
        
        const isDaytime = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset;
        const baseTemp = isDaytime ? 22 : 18;
        const tempVariation = Math.random() * 3;
        soilTempElement.textContent = `${(baseTemp + tempVariation).toFixed(1)}°C`;
    }
}

function startIrrigation(source = 'manual') {
    if (waterpumpState.waterLevel < 10) {
        showToast('Cannot start irrigation: Water level too low!', 'error');
        addAlertLog('Irrigation failed: Water level too low!');
        return;
    }
    
    waterpumpState.isActive = true;
    waterpumpState.lastIrrigation = new Date();
    
    const logType = source === 'auto' ? 'Auto irrigation started (soil too dry)' : 'Manual irrigation started';
    addIrrigationLog(logType);
    
    showToast(source === 'auto' ? 'Auto irrigation started' : 'Irrigation started', 'success');
    updateWaterPumpDisplay();
    startWaterConsumption();
    saveWaterPumpState();
}

function stopIrrigation(source = 'manual') {
    waterpumpState.isActive = false;
    stopWaterConsumption();
    
    const logType = source === 'auto' ? 'Auto irrigation stopped (soil moist enough)' : 'Irrigation stopped';
    addIrrigationLog(logType);
    
    showToast(source === 'auto' ? 'Auto irrigation stopped' : 'Irrigation stopped', 'info');
    updateWaterPumpDisplay();
    saveWaterPumpState();
}

function startWaterConsumption() {
    if (waterConsumptionInterval) clearInterval(waterConsumptionInterval);
    
    waterConsumptionInterval = setInterval(() => {
        if (waterpumpState.isActive && waterpumpState.waterLevel > 0) {
            waterpumpState.waterLevel -= 0.5;
            waterpumpState.waterLevel = Math.max(0, waterpumpState.waterLevel);
            updateWaterReservoir();
            
            if (waterpumpState.waterLevel <= 0) {
                stopIrrigation('auto');
                showToast('Irrigation stopped: Water reservoir empty!', 'error');
                addAlertLog('Irrigation stopped: Water reservoir empty!');
            }
        } else {
            stopWaterConsumption();
        }
    }, 1000);
}

function stopWaterConsumption() {
    if (waterConsumptionInterval) {
        clearInterval(waterConsumptionInterval);
        waterConsumptionInterval = null;
    }
}

function addIrrigationLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    // Add to local display
    addLogEntry(message, 'IRRIGATION', timeString);
    
    // Try to save to database
    if (apiAvailable && greenhouseAPI.authToken) {
        greenhouseAPI.apiRequest('/api/logs', 'POST', {
            message: message,
            type: 'IRRIGATION'
        }, true).catch(err => console.error('Failed to save log:', err));
    }
}

// =================== COVER DISPLAY ===================
function updateCoverDisplay() {
    if (!coverStatusElement || !coverStateElement) return;
    
    if (greenhouseState.coverOpen) {
        coverStatusElement.classList.remove('closed');
        coverStateElement.textContent = 'Open';
        coverStateElement.style.color = '#4caf50';
    } else {
        coverStatusElement.classList.add('closed');
        coverStateElement.textContent = 'Closed';
        coverStateElement.style.color = '#8d6e63';
    }
}

// =================== SENSOR READINGS ===================
async function updateSensorReadings() {
    console.log('🔄 Fetching LIVE data from MongoDB...');
    
    try {
        const response = await fetch('/api/data/current');
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API result:', result);
        
        if (result.success) {
            if (result.data) {
                console.log('✅ Got REAL data from MongoDB');
                
                // Check if data is in the right format
                if (result.data.temperature !== undefined || result.data.temp !== undefined) {
                    displaySensorData(result.data);
                    
                    // Store in localStorage for debugging
                    localStorage.setItem('lastSensorData', JSON.stringify({
                        ...result.data,
                        fetchedAt: new Date().toISOString(),
                        source: result.source
                    }));
                    
                } else {
                    console.warn('❌ Data missing temperature field:', result.data);
                    updateSensorReadingsSimulated();
                }
            } else {
                console.warn('⚠️ No data returned from API');
                updateSensorReadingsSimulated();
            }
        } else {
            console.error('❌ API returned error:', result);
            updateSensorReadingsSimulated();
        }
    } catch (error) {
        console.error('❌ Failed to fetch from MongoDB:', error);
        showToast('Cannot connect to database. Using simulated data.', 'warning');
        updateSensorReadingsSimulated();
    }
}

function updateSensorReadingsSimulated() {
    const currentHour = timeMode === 'real' ? 
        new Date().getHours() + new Date().getMinutes() / 60 : 
        currentSimulatedTime.getHours() + currentSimulatedTime.getMinutes() / 60;
    
    const isDaytime = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset;
    
    let tempValue;
    if (isDaytime) {
        tempValue = greenhouseState.coverOpen ? 
            (Math.random() * 6 + 22 + (currentHour - 12) * 0.5) :
            (Math.random() * 4 + 24);
    } else {
        tempValue = greenhouseState.coverOpen ?
            (Math.random() * 4 + 18 - (currentHour > 12 ? currentHour - 12 : currentHour) * 0.3) :
            (Math.random() * 3 + 20);
    }
    
    let humidityValue = greenhouseState.coverOpen ?
        (Math.random() * 20 + 55 + (isDaytime ? -10 : 10)) :
        (Math.random() * 15 + 70);
    
    let soilDryingRate = isDaytime ? 0.8 : 0.3;
    let soilValue = soilValueElement ? parseFloat(soilValueElement.textContent) || 72 : 72;
    
    if (!waterpumpState.isActive) soilValue -= Math.random() * soilDryingRate;
    if (waterpumpState.isActive) soilValue += Math.random() * 1.5;
    
    if (soilValue < 30) soilValue = 70; 
    if (soilValue > 90) soilValue = 70;
    
    let lightValue;
    if (isDaytime) {
        const sunPosition = (currentHour - timeConfig.sunrise) / (timeConfig.sunset - timeConfig.sunrise);
        const lightIntensity = Math.sin(sunPosition * Math.PI) * 600 + 400;
        
        lightValue = greenhouseState.coverOpen ?
            Math.floor(lightIntensity + Math.random() * 200) :
            Math.floor(lightIntensity * 0.5 + Math.random() * 100);
    } else {
        lightValue = greenhouseState.lightsOn ?
            Math.floor(Math.random() * 100 + 50) :
            Math.floor(Math.random() * 10);
    }
    
    displaySensorData({
        temperature: tempValue,
        humidity: humidityValue,
        soilMoisture: soilValue,
        lightLevel: lightValue
    });
}

function displaySensorData(data) {
    console.log('📊 Displaying sensor data from MongoDB:', data);
    
    // Extract values from MongoDB document
    const temperature = data.temperature || data.temp || 24.5;
    const humidity = data.humidity || 65;
    const soilMoisture = data.soilMoisture || data.soil || 72;
    const lightLevel = data.lightLevel || data.light || 850;
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    
    // Format values
    const displayTemp = parseFloat(temperature).toFixed(1);
    const displayHumidity = parseFloat(humidity).toFixed(0);
    const displaySoil = parseFloat(soilMoisture).toFixed(1);
    const displayLight = parseFloat(lightLevel).toFixed(0);
    
    console.log(`🌡️ ${displayTemp}°C | 💧 ${displayHumidity}% | 🌱 ${displaySoil}% | ☀️ ${displayLight} lux`);
    
    // Update the display elements
    if (temperatureValueElement) temperatureValueElement.textContent = `${displayTemp}°C`;
    if (humidityValueElement) humidityValueElement.textContent = `${displayHumidity}%`;
    if (soilValueElement) soilValueElement.textContent = `${displaySoil}%`;
    if (lightValueElement) lightValueElement.textContent = `${displayLight} lux`;
    
    // Convert to numbers for calculations
    const tempNum = parseFloat(displayTemp);
    const humidityNum = parseFloat(displayHumidity);
    const soilNum = parseFloat(displaySoil);
    const lightNum = parseFloat(displayLight);
    
    updateCurrentValues();
    updateStatusIndicators(tempNum, humidityNum, soilNum, lightNum);
    checkAllTargetStatuses();
    
    if (environmentChart) addChartData(tempNum, humidityNum, soilNum, lightNum);
    checkForAlerts(tempNum, humidityNum, soilNum, lightNum);
    updateSoilMoistureForWaterPump(soilNum);
    
    // Update timestamp display
    const timeString = timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    console.log('🕒 Data timestamp:', timeString);
    
    showToast('Live sensor data loaded from database', 'success');
}

function updateSoilMoistureForWaterPump(soilMoisture) {
    if (currentSoilPumpElement) currentSoilPumpElement.textContent = `${soilMoisture.toFixed(1)}%`;
    if (soilFillElement) {
        soilFillElement.style.width = `${soilMoisture}%`;
        
        if (soilMoisture < 40) {
            soilFillElement.style.background = 'linear-gradient(to right, var(--danger-color), #ef5350)';
        } else if (soilMoisture < 60) {
            soilFillElement.style.background = 'linear-gradient(to right, var(--warning-color), #ffb74d)';
        } else {
            soilFillElement.style.background = 'linear-gradient(to right, var(--soil-color), #a1887f)';
        }
    }
}

// =================== TIME SYSTEM ===================
function initializeTimeSystem() {
    console.log('Initializing Time-of-Day System...');
    updateTimeOfDay();
    setInterval(updateTimeOfDay, 60000);
    setupTimeControls();
}

function updateTimeOfDay() {
    const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    updateCelestialPositions(currentHour);
    applyTimeEffects(currentHour);
    updateTimeProgress(currentHour);
    
    if (currentTimeElement) currentTimeElement.textContent = now.toLocaleTimeString();
    
    if (timeMode === 'simulated' && !isTimePaused) advanceSimulatedTime();
}

function updateCelestialPositions(currentHour) {
    const dayDuration = timeConfig.sunset - timeConfig.sunrise;
    
    let sunPosition = 0;
    if (currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset) {
        sunPosition = ((currentHour - timeConfig.sunrise) / dayDuration) * 100;
    } else if (currentHour > timeConfig.sunset) {
        sunPosition = 100;
    }
    
    let moonPosition = (sunPosition + 50) % 100;
    
    if (sunElement) {
        sunElement.style.left = `${sunPosition}%`;
        sunElement.style.opacity = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset ? '1' : '0';
    }
    
    if (moonElement) {
        moonElement.style.left = `${moonPosition}%`;
        moonElement.style.opacity = currentHour < timeConfig.sunrise || currentHour > timeConfig.sunset ? '1' : '0';
    }
}

function applyTimeEffects(currentHour = new Date().getHours() + new Date().getMinutes() / 60) {
    document.body.classList.remove('dawn-mode', 'morning-mode', 'afternoon-mode', 'dusk-mode', 'night-mode');
    
    let timePeriod = '';
    let periodData = {};
    
    if (currentHour >= timeConfig.dawnStart && currentHour < timeConfig.dawnEnd) {
        timePeriod = 'dawn';
        periodData = {
            name: 'Dawn',
            icon: 'fa-cloud-sun',
            color: '#FFB74D',
            description: 'Plants are waking up'
        };
    } else if (currentHour >= timeConfig.dawnEnd && currentHour < timeConfig.morningEnd) {
        timePeriod = 'morning';
        periodData = {
            name: 'Morning',
            icon: 'fa-sun',
            color: '#FFC107',
            description: 'Optimal growth period'
        };
    } else if (currentHour >= timeConfig.morningEnd && currentHour < timeConfig.afternoonEnd) {
        timePeriod = 'afternoon';
        periodData = {
            name: 'Afternoon',
            icon: 'fa-sun',
            color: '#FF9800',
            description: 'Warmest part of the day'
        };
    } else if (currentHour >= timeConfig.afternoonEnd && currentHour < timeConfig.duskEnd) {
        timePeriod = 'dusk';
        periodData = {
            name: 'Evening',
            icon: 'fa-cloud-moon',
            color: '#FF5722',
            description: 'Cooling down period'
        };
    } else {
        timePeriod = 'night';
        periodData = {
            name: 'Night',
            icon: 'fa-moon',
            color: '#673AB7',
            description: 'Rest and recovery'
        };
    }
    
    document.body.classList.add(`${timePeriod}-mode`);
    
    if (periodIcon && periodName && periodTime) {
        const iconElement = periodIcon.querySelector('i');
        if (iconElement) {
            iconElement.className = `fas ${periodData.icon}`;
            periodIcon.style.background = `linear-gradient(135deg, ${periodData.color}, ${periodData.color}80)`;
            periodName.textContent = periodData.name;
        }
    }
    
    // Update plant state based on time
    updatePlantState(timePeriod);
}

function updatePlantState(timePeriod) {
    if (!plantStateText || !plantStateDesc) return;
    
    const plantStates = {
        dawn: {text: 'Photosynthesis Starting', desc: 'Plants are waking up'},
        morning: {text: 'Photosynthesis Active', desc: 'Plants are producing energy'},
        afternoon: {text: 'Growth Peak', desc: 'Maximum photosynthesis activity'},
        dusk: {text: 'Metabolism Slowing', desc: 'Plants are preparing for night'},
        night: {text: 'Respiration Active', desc: 'Plants are consuming oxygen'}
    };
    
    const state = plantStates[timePeriod] || plantStates.morning;
    plantStateText.textContent = state.text;
    plantStateDesc.textContent = state.desc;
}

function updateTimeProgress(currentHour) {
    if (!timeProgressFill) return;
    
    let progress = 0;
    if (currentHour >= timeConfig.dawnStart && currentHour < timeConfig.dawnEnd) {
        progress = (currentHour - timeConfig.dawnStart) / (timeConfig.dawnEnd - timeConfig.dawnStart);
    } else if (currentHour >= timeConfig.dawnEnd && currentHour < timeConfig.morningEnd) {
        progress = (currentHour - timeConfig.dawnEnd) / (timeConfig.morningEnd - timeConfig.dawnEnd);
    } else if (currentHour >= timeConfig.morningEnd && currentHour < timeConfig.afternoonEnd) {
        progress = (currentHour - timeConfig.morningEnd) / (timeConfig.afternoonEnd - timeConfig.morningEnd);
    } else if (currentHour >= timeConfig.afternoonEnd && currentHour < timeConfig.duskEnd) {
        progress = (currentHour - timeConfig.afternoonEnd) / (timeConfig.duskEnd - timeConfig.afternoonEnd);
    } else {
        if (currentHour >= timeConfig.duskEnd) {
            progress = (currentHour - timeConfig.duskEnd) / (24 - timeConfig.duskEnd + timeConfig.dawnStart);
        } else {
            progress = (currentHour + (24 - timeConfig.duskEnd)) / (24 - timeConfig.duskEnd + timeConfig.dawnStart);
        }
    }
    
    timeProgressFill.style.width = `${progress * 100}%`;
    const hue = 200 + (progress * 160);
    timeProgressFill.style.background = `linear-gradient(to right, hsl(${hue}, 70%, 50%), hsl(${hue + 20}, 80%, 60%))`;
}

function updateTimeOfDayDisplay() {
    if (sunriseTimeElement) {
        sunriseTimeElement.textContent = `${Math.floor(timeConfig.sunrise)}:${(timeConfig.sunrise % 1) * 60}0 AM`;
    }
    
    if (sunsetTimeElement) {
        const hour = Math.floor(timeConfig.sunset);
        const minute = (timeConfig.sunset % 1) * 60;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        sunsetTimeElement.textContent = `${displayHour}:${minute.toFixed(0).padStart(2, '0')} ${period}`;
    }
    
    if (daylightHoursElement) {
        const daylightHours = timeConfig.sunset - timeConfig.sunrise;
        const hours = Math.floor(daylightHours);
        const minutes = Math.floor((daylightHours % 1) * 60);
        daylightHoursElement.textContent = `${hours}h ${minutes}m`;
    }
    
    if (nightHoursElement) {
        const nightHours = 24 - (timeConfig.sunset - timeConfig.sunrise);
        const hours = Math.floor(nightHours);
        const minutes = Math.floor((nightHours % 1) * 60);
        nightHoursElement.textContent = `${hours}h ${minutes}m`;
    }
}

function setupTimeControls() {
    if (realTimeBtn) {
        realTimeBtn.addEventListener('click', () => {
            timeMode = 'real';
            isTimePaused = false;
            updateButtonStates();
            showToast('Switched to real time mode', 'success');
        });
    }
    
    if (speedUpBtn) {
        speedUpBtn.addEventListener('click', () => {
            timeMode = 'simulated';
            timeSpeedMultiplier = 10;
            isTimePaused = false;
            updateButtonStates();
            showToast('Time simulation 10x speed', 'info');
        });
    }
    
    if (pauseTimeBtn) {
        pauseTimeBtn.addEventListener('click', () => {
            isTimePaused = !isTimePaused;
            updateButtonStates();
            showToast(isTimePaused ? 'Time paused' : 'Time resumed', 'info');
        });
    }
    
    updateTimeOfDayDisplay();
}

function updateButtonStates() {
    if (realTimeBtn) realTimeBtn.style.opacity = timeMode === 'real' ? '1' : '0.6';
    if (speedUpBtn) speedUpBtn.style.opacity = timeMode === 'simulated' && !isTimePaused ? '1' : '0.6';
    if (pauseTimeBtn) {
        const icon = pauseTimeBtn.querySelector('i');
        if (icon) icon.className = isTimePaused ? 'fas fa-play' : 'fas fa-pause';
        pauseTimeBtn.style.opacity = isTimePaused ? '1' : '0.6';
    }
}

function advanceSimulatedTime() {
    const advanceMinutes = timeSpeedMultiplier;
    currentSimulatedTime.setMinutes(currentSimulatedTime.getMinutes() + advanceMinutes);
    
    if (currentSimulatedTime.getHours() >= 24) {
        currentSimulatedTime.setDate(currentSimulatedTime.getDate() + 1);
        currentSimulatedTime.setHours(currentSimulatedTime.getHours() - 24);
    }
    
    if (timeSimulationSlider) {
        const currentHour = currentSimulatedTime.getHours() + currentSimulatedTime.getMinutes() / 60;
        timeSimulationSlider.value = currentHour;
    }
}

// =================== PLANT SETTINGS ===================
function initializePlantSelection() {
    plantOptions.forEach(option => {
        option.addEventListener('click', function() {
            plantOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const plantType = this.dataset.plant;
            currentSettings.selectedPlant = plantType;
            
            updatePlantDisplay(plantType);
            applyPlantPreset(plantType);
            saveSettings();
        });
    });
}

function updatePlantDisplay(plantType) {
    const preset = plantPresets[plantType];
    if (plantNameDisplay) plantNameDisplay.textContent = `${preset.name} Settings`;
    if (currentPlantTypeElement) currentPlantTypeElement.textContent = preset.name;
    if (plantNameDisplay) plantNameDisplay.title = preset.description;
}

function applyPlantPreset(plantType) {
    const preset = plantPresets[plantType];
    
    if (tempTargetSlider) tempTargetSlider.value = preset.temperature;
    if (humidityTargetSlider) humidityTargetSlider.value = preset.humidity;
    if (lightTargetSlider) lightTargetSlider.value = preset.light;
    if (soilTargetSlider) soilTargetSlider.value = preset.soil;
    
    updateTargetDisplays();
    currentSettings.targets = {...preset};
    
    if (plantType !== 'custom') {
        showToast(`${preset.name} preset applied`, 'success');
    } else {
        showToast('Custom mode activated', 'info');
    }
}

function setupTargetSliders() {
    if (tempTargetSlider) {
        tempTargetSlider.addEventListener('input', function() {
            if (tempTargetValue) tempTargetValue.textContent = `${this.value}°C`;
            currentSettings.targets.temperature = parseFloat(this.value);
            checkTargetStatus('temperature');
        });
    }
    
    if (humidityTargetSlider) {
        humidityTargetSlider.addEventListener('input', function() {
            if (humidityTargetValue) humidityTargetValue.textContent = `${this.value}%`;
            currentSettings.targets.humidity = parseFloat(this.value);
            checkTargetStatus('humidity');
        });
    }
    
    if (lightTargetSlider) {
        lightTargetSlider.addEventListener('input', function() {
            if (lightTargetValue) lightTargetValue.textContent = `${this.value} lux`;
            currentSettings.targets.light = parseFloat(this.value);
            checkTargetStatus('light');
        });
    }
    
    if (soilTargetSlider) {
        soilTargetSlider.addEventListener('input', function() {
            if (soilTargetValue) soilTargetValue.textContent = `${this.value}%`;
            currentSettings.targets.soil = parseFloat(this.value);
            checkTargetStatus('soil');
        });
    }
}

function updateTargetDisplays() {
    if (tempTargetValue && tempTargetSlider) tempTargetValue.textContent = `${tempTargetSlider.value}°C`;
    if (humidityTargetValue && humidityTargetSlider) humidityTargetValue.textContent = `${humidityTargetSlider.value}%`;
    if (lightTargetValue && lightTargetSlider) lightTargetValue.textContent = `${lightTargetSlider.value} lux`;
    if (soilTargetValue && soilTargetSlider) soilTargetValue.textContent = `${soilTargetSlider.value}%`;
}

function updateCurrentValues() {
    const tempText = temperatureValueElement ? temperatureValueElement.textContent : '24.5°C';
    const humidityText = humidityValueElement ? humidityValueElement.textContent : '65%';
    const lightText = lightValueElement ? lightValueElement.textContent : '850 lux';
    const soilText = soilValueElement ? soilValueElement.textContent : '72%';
    
    if (currentTempElement) currentTempElement.textContent = tempText;
    if (currentHumidityElement) currentHumidityElement.textContent = humidityText;
    if (currentLightElement) currentLightElement.textContent = lightText;
    if (currentSoilElement) currentSoilElement.textContent = soilText;
}

function checkTargetStatus(type) {
    const currentElement = document.getElementById(`${type}-value`);
    const targetSlider = document.getElementById(`${type}-target`);
    
    if (!currentElement || !targetSlider) return;
    
    const currentText = currentElement.textContent;
    const currentValue = parseFloat(currentText.replace(/[^\d.-]/g, ''));
    const targetValue = parseFloat(targetSlider.value);
    const diff = Math.abs(currentValue - targetValue);
    const tolerance = getTolerance(type);

    const targetCard = targetSlider.closest('.target-card');
    if (!targetCard) return;
    
    const statusIndicator = targetCard.querySelector('.status-indicator');
    if (!statusIndicator) return;
    
    if (diff <= tolerance) {
        statusIndicator.className = 'status-indicator optimal';
        statusIndicator.title = 'Within target range';
    } else if (diff <= tolerance * 2) {
        statusIndicator.className = 'status-indicator warning';
        statusIndicator.title = 'Approaching target limits';
    } else {
        statusIndicator.className = 'status-indicator critical';
        statusIndicator.title = 'Outside target range';
    }
}

function getTolerance(type) {
    switch(type) {
        case 'temperature': return 2.0;
        case 'humidity': return 10;
        case 'light': return 150;
        case 'soil': return 15;
        default: return 10;
    }
}

function checkAllTargetStatuses() {
    checkTargetStatus('temperature');
    checkTargetStatus('humidity');
    checkTargetStatus('light');
    checkTargetStatus('soil');
}

if (savePresetBtn) {
    savePresetBtn.addEventListener('click', function() {
        if (currentSettings.selectedPlant === 'custom') {
            plantPresets.custom = {
                name: "Custom",
                temperature: tempTargetSlider ? parseFloat(tempTargetSlider.value) : 24,
                humidity: humidityTargetSlider ? parseFloat(humidityTargetSlider.value) : 65,
                light: lightTargetSlider ? parseFloat(lightTargetSlider.value) : 850,
                soil: soilTargetSlider ? parseFloat(soilTargetSlider.value) : 70,
                description: "Custom settings saved by user"
            };
            localStorage.setItem('customPreset', JSON.stringify(plantPresets.custom));
            showToast('Custom settings saved', 'success');
        } else {
            showToast('Select "Custom" to save your own preset', 'warning');
        }
    });
}

if (applyTargetsBtn) {
    applyTargetsBtn.addEventListener('click', async function() {
        const temp = tempTargetSlider ? parseFloat(tempTargetSlider.value) : 24;
        const humidity = humidityTargetSlider ? parseFloat(humidityTargetSlider.value) : 65;
        const light = lightTargetSlider ? parseFloat(lightTargetSlider.value) : 850;
        const soil = soilTargetSlider ? parseFloat(soilTargetSlider.value) : 70;
        
        try {
            // Save targets to database if API is available
            if (apiAvailable && greenhouseAPI.authToken) {
                await greenhouseAPI.apiRequest('/api/targets', 'PUT', {
                    temperature: temp,
                    humidity: humidity,
                    light: light,
                    soil: soil,
                    plantType: currentSettings.selectedPlant
                }, true);
                
                showToast('Target settings saved to database', 'success');
            } else {
                showToast('Target settings saved locally', 'info');
            }
            
            // Add log
            if (apiAvailable && greenhouseAPI.authToken) {
                await greenhouseAPI.apiRequest('/api/logs', 'POST', {
                    message: `Targets applied: Temp: ${temp}°C, Humidity: ${humidity}%, Light: ${light} lux, Soil: ${soil}%`,
                    type: 'CLIMATE'
                }, true);
            }
            
        } catch (error) {
            console.error('Failed to save targets:', error);
            showToast('Failed to save targets', 'error');
        }
    });
}

if (resetTargetsBtn) {
    resetTargetsBtn.addEventListener('click', function() {
        applyPlantPreset(currentSettings.selectedPlant);
        showToast('Targets reset to plant defaults', 'info');
    });
}

function saveSettings() {
    const settingsToSave = {
        selectedPlant: currentSettings.selectedPlant,
        targets: currentSettings.targets,
        user: currentSettings.user
    };
    localStorage.setItem('plantCareSettings', JSON.stringify(settingsToSave));
}

function loadSavedSettings() {
    const savedSettings = localStorage.getItem('plantCareSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        currentSettings.selectedPlant = settings.selectedPlant || 'custom';
        currentSettings.targets = settings.targets || {...plantPresets.custom};
        updatePlantSelectionUI();
        updateTargetSlidersFromSettings();
        updateTargetDisplays();
    }
    const savedCustomPreset = localStorage.getItem('customPreset');
    if (savedCustomPreset) plantPresets.custom = JSON.parse(savedCustomPreset);
}

function updatePlantSelectionUI() {
    plantOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.plant === currentSettings.selectedPlant) {
            option.classList.add('active');
        }
    });
    updatePlantDisplay(currentSettings.selectedPlant);
}

function updateTargetSlidersFromSettings() {
    if (tempTargetSlider) tempTargetSlider.value = currentSettings.targets.temperature;
    if (humidityTargetSlider) humidityTargetSlider.value = currentSettings.targets.humidity;
    if (lightTargetSlider) lightTargetSlider.value = currentSettings.targets.light;
    if (soilTargetSlider) soilTargetSlider.value = currentSettings.targets.soil;
}

// =================== CHART FUNCTIONS ===================
function initializeChart() {
    console.log('Initializing chart...');
    const chartCanvas = document.getElementById('environment-chart');
    
    if (!chartCanvas) {
        console.error('Chart canvas not found!');
        return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    const timeLabels = [];
    const now = new Date();
    
    for (let i = 9; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        timeLabels.push(time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}));
    }
    
    const temperatureData = Array(10).fill(0).map(() => Math.random() * 6 + 22);
    const humidityData = Array(10).fill(0).map(() => Math.random() * 20 + 60);
    const soilData = Array(10).fill(0).map(() => Math.random() * 20 + 60);
    const lightData = Array(10).fill(0).map(() => Math.random() * 500 + 500);
    
    try {
        environmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: temperatureData,
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Humidity (%)',
                        data: humidityData,
                        borderColor: '#2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Soil Moisture (%)',
                        data: soilData,
                        borderColor: '#8d6e63',
                        backgroundColor: 'rgba(141, 110, 99, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Light Level (lux)',
                        data: lightData,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color')
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color')
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color')
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color')
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color')
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color')
                        }
                    }
                }
            }
        });
        console.log('Chart initialized successfully');
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

function updateChartColors() {
    if (!environmentChart) return;
    
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
    const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
    
    environmentChart.options.plugins.legend.labels.color = textColor;
    environmentChart.options.scales.x.ticks.color = textColor;
    environmentChart.options.scales.x.grid.color = borderColor;
    environmentChart.options.scales.y.ticks.color = textColor;
    environmentChart.options.scales.y.grid.color = borderColor;
    environmentChart.options.scales.y1.ticks.color = textColor;
    environmentChart.update();
}

function addChartData(tempValue, humidityValue, soilValue, lightValue) {
    if (!environmentChart) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    
    environmentChart.data.labels.shift();
    environmentChart.data.labels.push(timeString);
    
    environmentChart.data.datasets[0].data.shift();
    environmentChart.data.datasets[0].data.push(parseFloat(tempValue));
    
    environmentChart.data.datasets[1].data.shift();
    environmentChart.data.datasets[1].data.push(parseFloat(humidityValue));
    
    environmentChart.data.datasets[2].data.shift();
    environmentChart.data.datasets[2].data.push(parseFloat(soilValue));
    
    environmentChart.data.datasets[3].data.shift();
    environmentChart.data.datasets[3].data.push(parseFloat(lightValue));
    
    environmentChart.update();
}

// =================== EVENT LISTENERS ===================
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        });
    }
    
    // Cover toggle
    if (toggleCoverButton) {
        toggleCoverButton.addEventListener('click', async function() {
            try {
                const newStatus = greenhouseState.coverOpen ? 'CLOSED' : 'OPEN';
                
                // Update device
                await greenhouseAPI.apiRequest(`/api/devices/cover`, 'PUT', { 
                    status: newStatus 
                }, true);
                
                greenhouseState.coverOpen = !greenhouseState.coverOpen;
                updateCoverDisplay();
                
                // Add log
                await greenhouseAPI.apiRequest('/api/logs', 'POST', {
                    message: `Greenhouse cover ${greenhouseState.coverOpen ? 'opened' : 'closed'}`,
                    type: 'CLIMATE'
                }, true);
                
                showToast(`Greenhouse cover ${greenhouseState.coverOpen ? 'opened' : 'closed'}`, 'success');
                
            } catch (error) {
                console.error('Failed to toggle cover:', error);
                showToast('Failed to control cover. Using local mode.', 'warning');
                
                // Local fallback
                greenhouseState.coverOpen = !greenhouseState.coverOpen;
                updateCoverDisplay();
                showToast(`Greenhouse cover ${greenhouseState.coverOpen ? 'opened (local)' : 'closed (local)'}`, 'info');
            }
        });
    }
    
    if (chartButtons.length > 0) {
        chartButtons.forEach(button => {
            button.addEventListener('click', () => {
                chartButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentChartType = button.dataset.chart;
                updateChartVisibility();
            });
        });
    }
    
    if (logModeButtons.length > 0) {
        logModeButtons.forEach(button => {
            button.addEventListener('click', () => {
                logModeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterLogs(button.dataset.mode);
            });
        });
    }
    
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', refreshLogs);
    }
    
    if (addLogBtn) {
        addLogBtn.addEventListener('click', addManualLog);
    }
    
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', exportLogsToCSV);
    }
    
    initializePlantSelection();
    setupTargetSliders();
    updateCurrentValues();
}

function updateChartVisibility() {
    if (!environmentChart) return;
    
    environmentChart.data.datasets.forEach((dataset, index) => {
        if (currentChartType === 'temperature') dataset.hidden = index !== 0;
        else if (currentChartType === 'humidity') dataset.hidden = index !== 1;
        else if (currentChartType === 'soil') dataset.hidden = index !== 2;
        else if (currentChartType === 'light') dataset.hidden = index !== 3;
        else if (currentChartType === 'all') dataset.hidden = false;
    });
    
    environmentChart.update();
}

function filterLogs(mode) {
    const logEntries = document.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
        if (mode === 'all') {
            entry.style.display = 'flex';
        } else if (mode === 'alerts') {
            // Show only alerts
            const typeElement = entry.querySelector('.log-type');
            if (typeElement && typeElement.textContent === 'ALERT') {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        } else {
            // Show other types (irrigation, climate, system)
            const typeElement = entry.querySelector('.log-type');
            if (typeElement && typeElement.textContent.toLowerCase() === mode.toUpperCase()) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        }
    });
}

// =================== NOTES/LOGS FUNCTIONS ===================
function initializeNotesFunctions() {
    console.log('Initializing notes and logs functions...');
}

async function addManualLog() {
    // Create a modal or prompt for note input
    const noteText = prompt('Enter your note/message:');
    
    if (noteText && noteText.trim()) {
        const noteTypes = ['CLIMATE', 'OBSERVATION', 'PLANT_CARE', 'MAINTENANCE'];
        const selectedType = noteTypes[Math.floor(Math.random() * noteTypes.length)];
        
        try {
            // Save to database if API is available
            if (apiAvailable && greenhouseAPI.authToken) {
                await greenhouseAPI.apiRequest('/api/logs', 'POST', {
                    message: noteText,
                    type: selectedType
                }, true);
            }
            
            // Add to local display
            addLogEntry(noteText, selectedType);
            
            showToast('Note added successfully', 'success');
            
        } catch (error) {
            console.error('Failed to add note:', error);
            // Local fallback
            addLogEntry(noteText, selectedType);
            showToast('Note added locally', 'info');
        }
    } else {
        showToast('Note cannot be empty', 'warning');
    }
}

function addLogEntry(message, type = 'SYSTEM', customTime = null) {
    const now = new Date();
    const timeString = customTime || now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    // Create log entry
    const newLog = document.createElement('div');
    newLog.className = `log-entry ${type.toLowerCase()}`;
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${message}</div>
        <div class="log-type">${type}</div>
    `;
    
    // Add to the top of the logs list
    if (logsList) {
        logsList.prepend(newLog);
        
        // Keep only last 20 logs
        const allLogs = logsList.querySelectorAll('.log-entry');
        if (allLogs.length > 20) {
            logsList.removeChild(allLogs[allLogs.length - 1]);
        }
    }
    
    // Also add to localStorage for persistence
    saveLogToLocalStorage({time: timeString, message, type});
}

async function refreshLogs() {
    console.log('Refreshing logs...');
    
    try {
        if (apiAvailable && greenhouseAPI.authToken) {
            // Fetch latest logs from database
            const response = await greenhouseAPI.apiRequest('/api/logs?limit=20', 'GET', null, true);
            
            if (response.success && response.data) {
                // Clear current logs
                if (logsList) logsList.innerHTML = '';
                
                // Add fetched logs
                response.data.forEach(log => {
                    const logDate = new Date(log.createdAt || log.timestamp || Date.now());
                    const timeString = logDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
                    
                    const newLog = document.createElement('div');
                    newLog.className = `log-entry ${log.type.toLowerCase()}`;
                    newLog.innerHTML = `
                        <div class="log-time">${timeString}</div>
                        <div class="log-message">${log.message}</div>
                        <div class="log-type">${log.type || 'SYSTEM'}</div>
                    `;
                    
                    if (logsList) logsList.appendChild(newLog);
                });
                
                showToast('Logs refreshed from database', 'success');
                return;
            }
        }
    } catch (error) {
        console.error('Failed to fetch logs:', error);
    }
    
    // Fallback: Just show a message
    showToast('Logs refreshed', 'info');
    
    // Add a new system log entry
    addLogEntry('Logs manually refreshed', 'SYSTEM');
}

function exportLogsToCSV() {
    console.log('Exporting logs to CSV...');
    
    // Collect logs from the DOM
    const logEntries = logsList ? logsList.querySelectorAll('.log-entry') : [];
    
    if (logEntries.length === 0) {
        showToast('No logs to export', 'warning');
        return;
    }
    
    // Create CSV content
    let csvContent = "Time,Message,Type\n";
    
    logEntries.forEach(entry => {
        const time = entry.querySelector('.log-time').textContent;
        const message = entry.querySelector('.log-message').textContent;
        const type = entry.querySelector('.log-type').textContent;
        
        // Escape quotes and commas in message
        const escapedMessage = `"${message.replace(/"/g, '""')}"`;
        
        csvContent += `${time},${escapedMessage},${type}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `greenhouse_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${logEntries.length} logs as CSV`, 'success');
    
    // Add a log entry for the export
    addLogEntry('Logs exported to CSV', 'SYSTEM');
}

function saveLogToLocalStorage(log) {
    try {
        const logs = JSON.parse(localStorage.getItem('greenhouseLogs') || '[]');
        logs.unshift(log); // Add to beginning
        if (logs.length > 100) logs.pop(); // Keep only 100 logs
        localStorage.setItem('greenhouseLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('Failed to save log to localStorage:', error);
    }
}

function loadLogsFromLocalStorage() {
    try {
        const logs = JSON.parse(localStorage.getItem('greenhouseLogs') || '[]');
        logs.forEach(log => {
            const newLog = document.createElement('div');
            newLog.className = `log-entry ${log.type.toLowerCase()}`;
            newLog.innerHTML = `
                <div class="log-time">${log.time}</div>
                <div class="log-message">${log.message}</div>
                <div class="log-type">${log.type}</div>
            `;
            if (logsList) logsList.appendChild(newLog);
        });
    } catch (error) {
        console.error('Failed to load logs from localStorage:', error);
    }
}

function addInitialAlerts() {
    // Add some initial alerts if logs are empty
    if (logsList && logsList.children.length === 0) {
        const initialAlerts = [
            {message: 'System initialized successfully', type: 'SYSTEM', time: '00:00:00'},
            {message: 'Greenhouse sensors calibrated', type: 'SYSTEM', time: '00:00:05'},
            {message: 'All systems operational', type: 'SYSTEM', time: '00:00:10'},
            {message: 'Temperature control active', type: 'CLIMATE', time: '00:00:15'},
            {message: 'Irrigation system ready', type: 'IRRIGATION', time: '00:00:20'}
        ];
        
        initialAlerts.forEach(alert => {
            addLogEntry(alert.message, alert.type, alert.time);
        });
    }
}

// =================== STATUS INDICATORS & ALERTS ===================
function updateStatusIndicators(temp, humidity, soil, light) {
    const tempIndicator = document.querySelector('.temperature .status-indicator');
    const tempStatus = document.querySelector('.temperature .status-text');
    if (tempIndicator && tempStatus) {
        if (temp < 18 || temp > 30) {
            tempIndicator.className = 'status-indicator critical';
            tempStatus.textContent = temp < 18 ? 'Too Cold' : 'Too Hot';
        } else if (temp < 20 || temp > 28) {
            tempIndicator.className = 'status-indicator warning';
            tempStatus.textContent = temp < 20 ? 'Cool' : 'Warm';
        } else {
            tempIndicator.className = 'status-indicator optimal';
            tempStatus.textContent = 'Optimal';
        }
    }
    
    const humidityIndicator = document.querySelector('.humidity .status-indicator');
    const humidityStatus = document.querySelector('.humidity .status-text');
    if (humidityIndicator && humidityStatus) {
        if (humidity < 50 || humidity > 85) {
            humidityIndicator.className = 'status-indicator warning';
            humidityStatus.textContent = humidity < 50 ? 'Low' : 'High';
        } else {
            humidityIndicator.className = 'status-indicator optimal';
            humidityStatus.textContent = 'Optimal';
        }
    }

    const soilIndicator = document.querySelector('.soil .status-indicator');
    const soilStatus = document.querySelector('.soil .status-text');
    if (soilIndicator && soilStatus) {
        if (soil < 40) {
            soilIndicator.className = 'status-indicator critical';
            soilStatus.textContent = 'Needs Water';
        } else if (soil < 60) {
            soilIndicator.className = 'status-indicator warning';
            soilStatus.textContent = 'Dry';
        } else {
            soilIndicator.className = 'status-indicator optimal';
            soilStatus.textContent = 'Optimal';
        }
    }
    
    const lightIndicator = document.querySelector('.light .status-indicator');
    const lightStatus = document.querySelector('.light .status-text');
    if (lightIndicator && lightStatus) {
        const currentHour = timeMode === 'real' ? 
            new Date().getHours() : currentSimulatedTime.getHours();
        const isDaytime = currentHour >= 6 && currentHour <= 20;
        
        if (isDaytime) {
            if (light < 300) {
                lightIndicator.className = 'status-indicator warning';
                lightStatus.textContent = 'Low Light';
            } else if (light > 1200) {
                lightIndicator.className = 'status-indicator warning';
                lightStatus.textContent = 'High Light';
            } else {
                lightIndicator.className = 'status-indicator optimal';
                lightStatus.textContent = 'Good';
            }
        } else {
            if (light > 100) {
                lightIndicator.className = 'status-indicator optimal';
                lightStatus.textContent = 'Lights On';
            } else {
                lightIndicator.className = 'status-indicator warning';
                lightStatus.textContent = 'Dark';
            }
        }
    }
}

function checkForAlerts(temp, humidity, soil, light) {
    const now = new Date();
    const alerts = [];
    
    if (temp < 18) alerts.push('Temperature too low for optimal growth');
    if (temp > 30) alerts.push('Temperature too high, risk of plant stress');
    if (humidity < 50) alerts.push('Low humidity may cause plant dehydration');
    if (humidity > 85) alerts.push('High humidity risk of mold growth');
    if (soil < 40) alerts.push('Soil moisture critical, irrigation needed');
    if (light < 300 && now.getHours() >= 6 && now.getHours() <= 18) alerts.push('Insufficient light for photosynthesis');
    if (waterpumpState.waterLevel < 20) alerts.push('Water reservoir low - consider refilling');
    if (waterpumpState.waterLevel < 10) alerts.push('Water reservoir critically low!');
    
    if (alerts.length > 0 && Math.random() < 0.3) {
        addAlertLog(alerts[Math.floor(Math.random() * alerts.length)]);
    }
}

function addAlertLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    // Create log entry with EXACT structure needed for filtering
    const newLog = document.createElement('div');
    newLog.className = 'log-entry alert';
    newLog.setAttribute('data-log-type', 'alert'); // Add data attribute for filtering
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${message}</div>
        <div class="log-type">ALERT</div>
    `;
    
    if (logsList) {
        logsList.prepend(newLog);
        
        // Keep only last 20 logs
        const allLogs = logsList.querySelectorAll('.log-entry');
        if (allLogs.length > 20) {
            logsList.removeChild(allLogs[allLogs.length - 1]);
        }
    }
    
    // Also show as toast notification
    showToast(`⚠️ ${message}`, 'warning');
    
    // Try to save to database
    if (apiAvailable && greenhouseAPI.authToken) {
        greenhouseAPI.apiRequest('/api/logs', 'POST', {
            message: message,
            type: 'ALERT'
        }, true).catch(err => console.error('Failed to save alert:', err));
    }
    
    // Save to localStorage
    saveLogToLocalStorage({time: timeString, message, type: 'ALERT'});
    
    // Play alert sound
    playAlertSound();
}
function playAlertSound() {
    // Create a simple beep sound for alerts
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio context not supported, skipping alert sound');
    }
}

function addSystemLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    // Add to local display
    addLogEntry(message, 'SYSTEM', timeString);
    
    // Try to save to database
    if (apiAvailable && greenhouseAPI.authToken) {
        greenhouseAPI.apiRequest('/api/logs', 'POST', {
            message: message,
            type: 'SYSTEM'
        }, true).catch(err => console.error('Failed to save system log:', err));
    }
}

// =================== PANEL VISIBILITY ===================
function setupPanelVisibilityControls() {
    if (toggleWaterpumpVisibilityBtn) {
        toggleWaterpumpVisibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanelVisibility('waterpump');
        });
        
        const waterpumpTitle = waterpumpSection.querySelector('.section-title');
        if (waterpumpTitle) {
            waterpumpTitle.style.cursor = 'pointer';
            waterpumpTitle.addEventListener('click', (e) => {
                if (e.target !== toggleWaterpumpVisibilityBtn && !toggleWaterpumpVisibilityBtn.contains(e.target)) {
                    togglePanelVisibility('waterpump');
                }
            });
        }
    }
    
    if (toggleCoverVisibilityBtn) {
        toggleCoverVisibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanelVisibility('cover');
        });
        
        const coverTitle = coverSection.querySelector('.section-title');
        if (coverTitle) {
            coverTitle.style.cursor = 'pointer';
            coverTitle.addEventListener('click', (e) => {
                if (e.target !== toggleCoverVisibilityBtn && !toggleCoverVisibilityBtn.contains(e.target)) {
                    togglePanelVisibility('cover');
                }
            });
        }
    }
    
    loadVisibilityState();
}

function loadVisibilityState() {
    const savedState = localStorage.getItem('panelVisibility');
    if (savedState) {
        panelVisibility = JSON.parse(savedState);
        updatePanelVisibility();
    }
}

function saveVisibilityState() {
    localStorage.setItem('panelVisibility', JSON.stringify(panelVisibility));
}

function updatePanelVisibility() {
    if (waterpumpSection) {
        if (panelVisibility.waterpump) {
            waterpumpSection.classList.remove('hidden');
            if (toggleWaterpumpVisibilityBtn) {
                const icon = toggleWaterpumpVisibilityBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-eye-slash';
                toggleWaterpumpVisibilityBtn.title = 'Hide Water Pump';
            }
        } else {
            waterpumpSection.classList.add('hidden');
            if (toggleWaterpumpVisibilityBtn) {
                const icon = toggleWaterpumpVisibilityBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-eye';
                toggleWaterpumpVisibilityBtn.title = 'Show Water Pump';
            }
        }
    }
    
    if (coverSection) {
        if (panelVisibility.cover) {
            coverSection.classList.remove('hidden');
            if (toggleCoverVisibilityBtn) {
                const icon = toggleCoverVisibilityBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-eye-slash';
                toggleCoverVisibilityBtn.title = 'Hide Cover';
            }
        } else {
            coverSection.classList.add('hidden');
            if (toggleCoverVisibilityBtn) {
                const icon = toggleCoverVisibilityBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-eye';
                toggleCoverVisibilityBtn.title = 'Show Cover';
            }
        }
    }
    
    panelVisibility.allVisible = panelVisibility.waterpump && panelVisibility.cover;
    saveVisibilityState();
}

function togglePanelVisibility(panelType) {
    panelVisibility[panelType] = !panelVisibility[panelType];
    updatePanelVisibility();
    
    const panelName = panelType === 'waterpump' ? 'Water Pump' : 'Greenhouse Cover';
    showToast(`${panelName} panel ${panelVisibility[panelType] ? 'shown' : 'hidden'}`, 'info');
}

// =================== TIME EFFECTS TOGGLE ===================
function initializeTimeEffectsToggle() {
    const savedState = localStorage.getItem('timeEffectsVisible');
    if (savedState !== null) timeEffectsVisible = savedState === 'true';
    updateTimeEffectsVisibility();
    
    if (toggleTimeEffectsBtn) {
        toggleTimeEffectsBtn.addEventListener('click', toggleTimeEffects);
    }
}

function toggleTimeEffects() {
    timeEffectsVisible = !timeEffectsVisible;
    updateTimeEffectsVisibility();
    localStorage.setItem('timeEffectsVisible', timeEffectsVisible);
    showToast(`Time effects ${timeEffectsVisible ? 'shown' : 'hidden'}`, 'info');
}

function updateTimeEffectsVisibility() {
    if (timeEffectsVisible) {
        document.body.classList.remove('time-effects-hidden');
        if (toggleTimeEffectsBtn) {
            toggleTimeEffectsBtn.classList.add('active');
            toggleTimeEffectsBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Hide Time Effects</span>';
        }
    } else {
        document.body.classList.add('time-effects-hidden');
        if (toggleTimeEffectsBtn) {
            toggleTimeEffectsBtn.classList.remove('active');
            toggleTimeEffectsBtn.innerHTML = '<i class="fas fa-eye"></i><span>Show Time Effects</span>';
        }
    }
}

// =================== TOAST NOTIFICATIONS ===================
function showToast(message, type = 'info') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.parentNode?.removeChild(toast));
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    switch(type) {
        case 'success': icon = 'check-circle'; break;
        case 'error': icon = 'exclamation-circle'; break;
        case 'warning': icon = 'exclamation-triangle'; break;
    }
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    const autoRemove = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.parentNode?.removeChild(toast), 300);
    }, 5000);
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            toast.classList.remove('show');
            setTimeout(() => toast.parentNode?.removeChild(toast), 300);
        });
    }
}

// Add toast styles if not present
if (!document.querySelector('#toast-animations')) {
    const toastStyle = document.createElement('style');
    toastStyle.id = 'toast-animations';
    toastStyle.textContent = `
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 15px 25px;
            background-color: var(--primary-color);
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            max-width: 350px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        }
        
        .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .toast.success {
            background-color: var(--optimal-color);
        }
        
        .toast.warning {
            background-color: var(--warning-color);
        }
        
        .toast.error {
            background-color: var(--danger-color);
        }
        
        .toast.info {
            background-color: var(--info-color);
        }
        
        .toast-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: 10px;
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        
        .toast-close:hover {
            opacity: 1;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(toastStyle);
}
// =================== END OF FILE ===================