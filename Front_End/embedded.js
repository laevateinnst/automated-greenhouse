// ========== PANEL VISIBILITY SYSTEM ==========

// Panel visibility state
let panelVisibility = {
    waterpump: true,
    cover: true,
    allVisible: true
};

// ========== WATER PUMP SYSTEM ==========

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

// Water consumption interval
let waterConsumptionInterval = null;
let waterRefillInterval = null;

// ========== TIME-OF-DAY SYSTEM ==========

// Time management variables
let currentSimulatedTime = new Date();
let timeSpeedMultiplier = 1;
let isTimePaused = false;
let timeMode = 'real'; // 'real', 'simulated', 'paused'

// DOM Elements for time effects
const timeEffectsOverlay = document.getElementById('time-effects-overlay');
const sunElement = document.getElementById('sun-element');
const moonElement = document.getElementById('moon-element');
const starField = document.getElementById('star-field');
const cloudsContainer = document.getElementById('clouds-container');
const sunbeams = document.getElementById('sunbeams');
const plantStateIndicator = document.getElementById('plant-state-indicator');
const plantStateText = document.getElementById('plant-state-text');
const plantStateDesc = document.getElementById('plant-state-desc');
const periodIcon = document.getElementById('period-icon');
const periodName = document.getElementById('period-name');
const periodTime = document.getElementById('period-time');
const timeProgressFill = document.getElementById('time-progress-fill');
const sunriseTimeElement = document.getElementById('sunrise-time');
const sunsetTimeElement = document.getElementById('sunset-time');
const daylightHoursElement = document.getElementById('daylight-hours');
const nightHoursElement = document.getElementById('night-hours');
const realTimeBtn = document.getElementById('real-time-btn');
const speedUpBtn = document.getElementById('speed-up-btn');
const pauseTimeBtn = document.getElementById('pause-time-btn');
const timeSimulationSlider = document.getElementById('time-simulation-slider');

// Time configuration
const timeConfig = {
    sunrise: 6.5, // 6:30 AM
    sunset: 19.75, // 7:45 PM
    dawnStart: 5, // 5:00 AM
    dawnEnd: 7, // 7:00 AM
    duskStart: 18, // 6:00 PM
    duskEnd: 20, // 8:00 PM
    morningEnd: 12, // 12:00 PM
    afternoonEnd: 17 // 5:00 PM
};

// ========== WATER PUMP DOM ELEMENTS ==========

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

// ========== ORIGINAL SYSTEM VARIABLES ==========

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

let environmentChart;
let currentChartType = 'temperature';

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

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('Automated Herb Greenhouse System Initializing...');
    
    checkLoginStatus();
    initializeDashboard();
    initializeTimeSystem();
    initializeWaterPumpSystem();
    setupPanelVisibilityControls();
});

// ========== PANEL VISIBILITY FUNCTIONS ==========

function setupPanelVisibilityControls() {
    // Toggle water pump visibility
    if (toggleWaterpumpVisibilityBtn) {
        toggleWaterpumpVisibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanelVisibility('waterpump');
        });
        
        // Make waterpump section title clickable
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
    
    // Toggle cover visibility
    if (toggleCoverVisibilityBtn) {
        toggleCoverVisibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanelVisibility('cover');
        });
        
        // Make cover section title clickable
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
    
    // Load saved visibility state
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
    // Update waterpump section
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
    
    // Update cover section
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
    
    // Update all panels state
    panelVisibility.allVisible = panelVisibility.waterpump && panelVisibility.cover;
    
    // Save state
    saveVisibilityState();
}

function togglePanelVisibility(panelType) {
    // Toggle the specific panel
    panelVisibility[panelType] = !panelVisibility[panelType];
    
    // Update the display
    updatePanelVisibility();
    
    // Show feedback
    const panelName = panelType === 'waterpump' ? 'Water Pump' : 'Greenhouse Cover';
    showToast(`${panelName} panel ${panelVisibility[panelType] ? 'shown' : 'hidden'}`, 'info');
}

// ========== WATER PUMP FUNCTIONS ==========

function initializeWaterPumpSystem() {
    console.log('Initializing Water Pump System...');
    
    // Load saved state
    loadWaterPumpState();
    
    // Update initial display
    updateWaterPumpDisplay();
    
    // Setup event listeners
    setupWaterPumpListeners();
    
    // Start water level simulation
    startWaterLevelSimulation();
    
    // Start auto irrigation monitoring
    startAutoIrrigationMonitoring();
    
    // Update soil moisture display
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
    // Update pump status
    if (waterpumpState.isActive) {
        waterpumpStatusElement.textContent = 'IRRIGATING';
        waterpumpStatusElement.classList.add('active');
        if (waterpumpStateIndicator) {
            waterpumpStateIndicator.className = 'status-indicator warning';
            waterpumpStateIndicator.style.animation = 'pulse 0.5s infinite';
        }
        
        // Update button
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
        
        // Update button
        if (toggleWaterpumpButton) {
            toggleWaterpumpButton.innerHTML = '<i class="fas fa-play"></i> Start Irrigation';
            toggleWaterpumpButton.classList.remove('active');
        }
    }
    
    // Update irrigation time
    updateIrrigationTime();
    
    // Update water reservoir
    updateWaterReservoir();
    
    // Update manual mode button
    if (manualModeButton) {
        if (waterpumpState.isManualMode) {
            manualModeButton.classList.add('active');
            manualModeButton.innerHTML = '<i class="fas fa-hand-paper"></i> Manual Mode ON';
        } else {
            manualModeButton.classList.remove('active');
            manualModeButton.innerHTML = '<i class="fas fa-hand-paper"></i> Manual Mode';
        }
    }
    
    // Update pump info
    if (pumpDurationElement) {
        pumpDurationElement.textContent = `${waterpumpState.irrigationDuration} min`;
    }
    
    if (pumpFlowRateElement) {
        pumpFlowRateElement.textContent = `${waterpumpState.flowRate} L/min`;
    }
    
    if (waterTempElement) {
        waterTempElement.textContent = `${waterpumpState.waterTemperature}°C`;
    }
    
    // Update auto irrigation status
    if (autoStatusElement) {
        if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode) {
            autoStatusElement.textContent = 'Enabled';
            autoStatusElement.className = 'setting-value auto-status';
        } else {
            autoStatusElement.textContent = 'Disabled';
            autoStatusElement.className = 'setting-value auto-status disabled';
        }
    }
    
    // Update threshold value
    if (thresholdValueElement) {
        thresholdValueElement.textContent = `${waterpumpState.autoThreshold}%`;
    }
    
    if (autoThresholdSlider) {
        autoThresholdSlider.value = waterpumpState.autoThreshold;
    }
}

function updateIrrigationTime() {
    if (!lastIrrigationElement || !waterpumpDetailElement) return;
    
    const now = new Date();
    const timeDiff = now - waterpumpState.lastIrrigation;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (waterpumpState.isActive) {
        waterpumpDetailElement.textContent = 'Currently irrigating plants...';
        if (lastIrrigationElement) {
            lastIrrigationElement.textContent = 'Now';
        }
    } else if (hours > 0) {
        waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        if (lastIrrigationElement) {
            lastIrrigationElement.textContent = `${hours}h ago`;
        }
    } else if (minutes > 0) {
        waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        if (lastIrrigationElement) {
            lastIrrigationElement.textContent = `${minutes}m ago`;
        }
    } else {
        waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        if (lastIrrigationElement) {
            lastIrrigationElement.textContent = 'Just now';
        }
    }
}

function updateWaterReservoir() {
    const waterLevel = waterpumpState.waterLevel;
    
    if (reservoirFillElement) {
        reservoirFillElement.style.width = `${waterLevel}%`;
        
        // Update color based on water level
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
        
        // Color coding based on water level
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

function updateSoilMoistureDisplay() {
    // Get current soil moisture from the main dashboard
    const soilValueElement = document.getElementById('soil-value');
    if (soilValueElement && currentSoilPumpElement && soilFillElement) {
        const soilText = soilValueElement.textContent;
        const soilValue = parseFloat(soilText.replace(/[^\d.]/g, ''));
        
        currentSoilPumpElement.textContent = `${soilValue}%`;
        soilFillElement.style.width = `${soilValue}%`;
        
        // Color coding based on soil moisture
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
    
    // Update soil temperature based on time of day
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

function startWaterLevelSimulation() {
    // Simulate natural water evaporation and replenishment
    setInterval(() => {
        if (!waterpumpState.isActive) {
            // Natural evaporation when pump is off
            if (waterpumpState.waterLevel > 0) {
                waterpumpState.waterLevel -= Math.random() * 0.01;
            }
            
            // Auto-refill when water is low (simulating rain/refill system)
            if (waterpumpState.waterLevel < 50 && Math.random() < 0.1) {
                waterpumpState.waterLevel += Math.random() * 10;
                waterpumpState.waterLevel = Math.min(100, waterpumpState.waterLevel);
                addIrrigationLog('Water reservoir auto-refilled');
            }
            
            updateWaterReservoir();
        }
        
        // Update soil moisture display
        updateSoilMoistureDisplay();
    }, 30000); // Every 30 seconds
}

function startAutoIrrigationMonitoring() {
    setInterval(() => {
        if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode && !waterpumpState.isActive) {
            const soilValueElement = document.getElementById('soil-value');
            if (soilValueElement) {
                const soilText = soilValueElement.textContent;
                const soilValue = parseFloat(soilText.replace(/[^\d.]/g, ''));
                
                // Check if soil is too dry
                if (soilValue < waterpumpState.autoThreshold && 
                    waterpumpState.waterLevel > 20) {
                    
                    // Auto start irrigation
                    startIrrigation('auto');
                }
            }
        }
        
        // Auto stop irrigation when soil is moist enough or water is low
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
    }, 60000); // Check every minute
}

function setupWaterPumpListeners() {
    // Toggle water pump
    if (toggleWaterpumpButton) {
        toggleWaterpumpButton.addEventListener('click', toggleWaterPump);
    }
    
    // Toggle manual mode
    if (manualModeButton) {
        manualModeButton.addEventListener('click', toggleManualMode);
    }
    
    // Auto threshold slider
    if (autoThresholdSlider) {
        autoThresholdSlider.addEventListener('input', function() {
            waterpumpState.autoThreshold = parseInt(this.value);
            if (thresholdValueElement) {
                thresholdValueElement.textContent = `${waterpumpState.autoThreshold}%`;
            }
            saveWaterPumpState();
            showToast(`Auto-irrigation threshold set to ${waterpumpState.autoThreshold}%`, 'info');
        });
    }
}

function toggleWaterPump() {
    if (waterpumpState.isActive) {
        stopIrrigation('manual');
    } else {
        startIrrigation('manual');
    }
}

function startIrrigation(source = 'manual') {
    if (waterpumpState.waterLevel < 10) {
        showToast('Cannot start irrigation: Water level too low!', 'error');
        return;
    }
    
    waterpumpState.isActive = true;
    waterpumpState.lastIrrigation = new Date();
    
    // Add log entry
    const logType = source === 'auto' ? 'Auto irrigation started (soil too dry)' : 'Manual irrigation started';
    addIrrigationLog(logType);
    
    // Show toast notification
    showToast(source === 'auto' ? 'Auto irrigation started' : 'Irrigation started', 'success');
    
    // Update display
    updateWaterPumpDisplay();
    
    // Start water consumption
    startWaterConsumption();
    
    // Save state
    saveWaterPumpState();
}

function stopIrrigation(source = 'manual') {
    waterpumpState.isActive = false;
    
    // Stop water consumption
    stopWaterConsumption();
    
    // Add log entry
    const logType = source === 'auto' ? 'Auto irrigation stopped (soil moist enough)' : 'Irrigation stopped';
    addIrrigationLog(logType);
    
    // Show toast notification
    showToast(source === 'auto' ? 'Auto irrigation stopped' : 'Irrigation stopped', 'info');
    
    // Update display
    updateWaterPumpDisplay();
    
    // Save state
    saveWaterPumpState();
}

function startWaterConsumption() {
    if (waterConsumptionInterval) {
        clearInterval(waterConsumptionInterval);
    }
    
    waterConsumptionInterval = setInterval(() => {
        if (waterpumpState.isActive && waterpumpState.waterLevel > 0) {
            // Consume water while irrigating
            waterpumpState.waterLevel -= 0.5; // 0.5% per second
            waterpumpState.waterLevel = Math.max(0, waterpumpState.waterLevel);
            updateWaterReservoir();
            
            // Auto stop if water runs out
            if (waterpumpState.waterLevel <= 0) {
                stopIrrigation('auto');
                showToast('Irrigation stopped: Water reservoir empty!', 'error');
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

function toggleManualMode() {
    waterpumpState.isManualMode = !waterpumpState.isManualMode;
    
    // Update auto irrigation status
    waterpumpState.isAutoIrrigationEnabled = !waterpumpState.isManualMode;
    
    // Add log entry
    addSystemLog(`Manual mode ${waterpumpState.isManualMode ? 'enabled' : 'disabled'}`);
    
    // Show toast notification
    showToast(`Manual mode ${waterpumpState.isManualMode ? 'ON' : 'OFF'}`, 'info');
    
    // Update display
    updateWaterPumpDisplay();
    
    // Save state
    saveWaterPumpState();
}

function addIrrigationLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const newLog = document.createElement('div');
    newLog.className = 'log-entry irrigation';
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${message}</div>
        <div class="log-type">IRRIGATION</div>
    `;
    
    if (logsList) {
        logsList.prepend(newLog);
        
        // Keep only last 20 logs
        const allLogs = logsList.querySelectorAll('.log-entry');
        if (allLogs.length > 20) {
            logsList.removeChild(allLogs[allLogs.length - 1]);
        }
    }
}

// ========== TIME-OF-DAY FUNCTIONS ==========


function initializeTimeSystem() {
    console.log('Initializing Time-of-Day System...');
    
    // Calculate initial times
    updateSunriseSunsetTimes();
    
    // Start time updates
    updateTimeOfDay();
    setInterval(updateTimeOfDay, 60000); // Update every minute
    
    // Initialize time controls
    setupTimeControls();
    
    // Initial time effect
    applyTimeEffects();
}

function updateSunriseSunsetTimes() {
    const sunrise = new Date();
    sunrise.setHours(Math.floor(timeConfig.sunrise), (timeConfig.sunrise % 1) * 60, 0);
    
    const sunset = new Date();
    sunset.setHours(Math.floor(timeConfig.sunset), (timeConfig.sunset % 1) * 60, 0);
    
    if (sunriseTimeElement) sunriseTimeElement.textContent = sunrise.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    if (sunsetTimeElement) sunsetTimeElement.textContent = sunset.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    
    // Calculate daylight hours
    const daylightHours = timeConfig.sunset - timeConfig.sunrise;
    const daylightHoursFormatted = Math.floor(daylightHours) + 'h ' + Math.floor((daylightHours % 1) * 60) + 'm';
    const nightHoursFormatted = Math.floor(24 - daylightHours) + 'h ' + Math.floor(((24 - daylightHours) % 1) * 60) + 'm';
    
    if (daylightHoursElement) daylightHoursElement.textContent = daylightHoursFormatted;
    if (nightHoursElement) nightHoursElement.textContent = nightHoursFormatted;
}

function updateTimeOfDay() {
    const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    // Update sun/moon position
    updateCelestialPositions(currentHour);
    
    // Apply time-based visual effects
    applyTimeEffects(currentHour);
    
    // Update plant state based on time
    updatePlantState(currentHour);
    
    // Update time progress
    updateTimeProgress(currentHour);
    
    // Update displayed time
    if (currentTimeElement) {
        currentTimeElement.textContent = now.toLocaleTimeString();
    }
    
    // Advance simulated time if applicable
    if (timeMode === 'simulated' && !isTimePaused) {
        advanceSimulatedTime();
    }
}

function updateCelestialPositions(currentHour) {
    const trackWidth = 190;
    const dayDuration = timeConfig.sunset - timeConfig.sunrise;
    
    // Calculate sun position (0-100%)
    let sunPosition = 0;
    if (currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset) {
        sunPosition = ((currentHour - timeConfig.sunrise) / dayDuration) * 100;
    } else if (currentHour > timeConfig.sunset) {
        sunPosition = 100;
    }
    
    // Calculate moon position (opposite of sun)
    let moonPosition = (sunPosition + 50) % 100;
    
    // Apply positions
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
    // Remove all time classes
    document.body.classList.remove('dawn-mode', 'morning-mode', 'afternoon-mode', 'dusk-mode', 'night-mode');
    
    let timePeriod = '';
    let periodData = {};
    
    // Determine time period
    if (currentHour >= timeConfig.dawnStart && currentHour < timeConfig.dawnEnd) {
        timePeriod = 'dawn';
        periodData = {
            name: 'Dawn',
            icon: 'fa-cloud-sun',
            color: '#FFB74D',
            description: 'Plants are waking up',
            plantState: 'Awakening',
            plantDesc: 'Beginning photosynthesis'
        };
    } else if (currentHour >= timeConfig.dawnEnd && currentHour < timeConfig.morningEnd) {
        timePeriod = 'morning';
        periodData = {
            name: 'Morning',
            icon: 'fa-sun',
            color: '#FFC107',
            description: 'Optimal growth period',
            plantState: 'Photosynthesis Peak',
            plantDesc: 'Maximum energy production'
        };
    } else if (currentHour >= timeConfig.morningEnd && currentHour < timeConfig.afternoonEnd) {
        timePeriod = 'afternoon';
        periodData = {
            name: 'Afternoon',
            icon: 'fa-sun',
            color: '#FF9800',
            description: 'Warmest part of the day',
            plantState: 'Active Growth',
            plantDesc: 'Cell division and expansion'
        };
    } else if (currentHour >= timeConfig.afternoonEnd && currentHour < timeConfig.duskEnd) {
        timePeriod = 'dusk';
        periodData = {
            name: 'Evening',
            icon: 'fa-cloud-moon',
            color: '#FF5722',
            description: 'Cooling down period',
            plantState: 'Preparing for Night',
            plantDesc: 'Storing energy reserves'
        };
    } else {
        timePeriod = 'night';
        periodData = {
            name: 'Night',
            icon: 'fa-moon',
            color: '#673AB7',
            description: 'Rest and recovery',
            plantState: 'Respiration',
            plantDesc: 'Consuming stored energy'
        };
    }
    
    // Apply time period class
    document.body.classList.add(`${timePeriod}-mode`);
    
    // Update period display
    if (periodIcon && periodName && periodTime) {
        const iconElement = periodIcon.querySelector('i');
        if (iconElement) {
            iconElement.className = `fas ${periodData.icon}`;
            periodIcon.style.background = `linear-gradient(135deg, ${periodData.color}, ${periodData.color}80)`;
            
            periodName.textContent = periodData.name;
            periodTime.textContent = `${getTimeRange(currentHour, timePeriod)}`;
        }
    }
    
    // Update plant state
    if (plantStateText && plantStateDesc) {
        plantStateText.textContent = periodData.plantState;
        plantStateDesc.textContent = periodData.plantDesc;
        
        // Update plant icon color
        const plantIcon = plantStateIndicator.querySelector('.plant-state-icon i');
        if (plantIcon) {
            plantIcon.style.color = periodData.color;
        }
        
        // Update glow color
        const plantGlow = plantStateIndicator.querySelector('.plant-state-glow');
        if (plantGlow) {
            plantGlow.style.background = periodData.color;
        }
    }
}

function getTimeRange(currentHour, period) {
    switch(period) {
        case 'dawn':
            return '5:00 AM - 7:00 AM';
        case 'morning':
            return '7:00 AM - 12:00 PM';
        case 'afternoon':
            return '12:00 PM - 5:00 PM';
        case 'dusk':
            return '5:00 PM - 8:00 PM';
        case 'night':
            return '8:00 PM - 5:00 AM';
        default:
            return '24/7';
    }
}

function updatePlantState(currentHour) {
    const plantCards = document.querySelectorAll('.plant-card');
    
    plantCards.forEach(card => {
        if (currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset) {
            card.classList.remove('sleeping');
            card.classList.add('active');
        } else {
            card.classList.remove('active');
            card.classList.add('sleeping');
        }
    });
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
    
    if (timeSimulationSlider) {
        timeSimulationSlider.addEventListener('input', function() {
            if (timeMode !== 'simulated') {
                timeMode = 'simulated';
                isTimePaused = true;
            }
            
            const hour = parseFloat(this.value);
            currentSimulatedTime = new Date();
            currentSimulatedTime.setHours(Math.floor(hour), (hour % 1) * 60, 0);
            
            updateTimeOfDay();
        });
    }
}

function updateButtonStates() {
    if (realTimeBtn) {
        realTimeBtn.style.opacity = timeMode === 'real' ? '1' : '0.6';
        realTimeBtn.style.transform = timeMode === 'real' ? 'scale(1.05)' : 'scale(1)';
    }
    
    if (speedUpBtn) {
        speedUpBtn.style.opacity = timeMode === 'simulated' && !isTimePaused ? '1' : '0.6';
        speedUpBtn.style.transform = timeMode === 'simulated' && !isTimePaused ? 'scale(1.05)' : 'scale(1)';
    }
    
    if (pauseTimeBtn) {
        const icon = pauseTimeBtn.querySelector('i');
        if (icon) {
            icon.className = isTimePaused ? 'fas fa-play' : 'fas fa-pause';
        }
        pauseTimeBtn.style.opacity = isTimePaused ? '1' : '0.6';
        pauseTimeBtn.style.transform = isTimePaused ? 'scale(1.05)' : 'scale(1)';
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

// ========== ORIGINAL SYSTEM FUNCTIONS ==========

function initializeDashboard() {
    console.log('Initializing dashboard...');

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    updateTime();
    setInterval(updateTime, 1000);
    
    updateSensorReadings();
    setInterval(updateSensorReadings, 3000);
    
    setTimeout(() => {
        initializeChart();
    }, 500);
    
    setupEventListeners();
}

function setTheme(theme) {
    console.log('Setting theme to:', theme);
    
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

function checkLoginStatus() {
    const savedUser = localStorage.getItem('plantCareUser');
    if (savedUser) {
        currentSettings.user = savedUser;
        if (loggedUserElement) loggedUserElement.textContent = savedUser;
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    if (loginOverlay) loginOverlay.style.display = 'flex';
    if (mainContainer) mainContainer.style.display = 'none';
}

function showDashboard() {
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'block';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const welcomeLog = document.createElement('div');
    welcomeLog.className = 'log-entry system';
    welcomeLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">User "${currentSettings.user}" logged in</div>
        <div class="log-type">SYSTEM</div>
    `;
    if (logsList) logsList.prepend(welcomeLog);
    
    loadSavedSettings();
}

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        
        if (username && password) {
            const usernameValue = username.value;
            const passwordValue = password.value;
            
            if (usernameValue && passwordValue) {
                const success = await handleLogin(usernameValue, passwordValue);
                
                if (success) {
                    username.value = '';
                    password.value = '';
                }
            } else {
                showToast('Please enter both username and password', 'error');
            }
        }
    });
}

if (applyTargetsBtn) {
    applyTargetsBtn.addEventListener('click', async function() {
        await applyTargets();
    });
}
function initializePlantSelection() {
    plantOptions.forEach(option => {
        option.addEventListener('click', async function() {
            plantOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const plantType = this.dataset.plant;
            currentSettings.selectedPlant = plantType;
            
            updatePlantDisplay(plantType);
            await applyPlantPresetWithAPI(plantType);
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
    if (currentTempElement && temperatureValueElement) currentTempElement.textContent = temperatureValueElement.textContent;
    if (currentHumidityElement && humidityValueElement) currentHumidityElement.textContent = humidityValueElement.textContent;
    if (currentLightElement && lightValueElement) currentLightElement.textContent = lightValueElement.textContent;
    if (currentSoilElement && soilValueElement) currentSoilElement.textContent = soilValueElement.textContent;
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
    applyTargetsBtn.addEventListener('click', function() {
        const temp = tempTargetSlider ? parseFloat(tempTargetSlider.value) : 24;
        const humidity = humidityTargetSlider ? parseFloat(humidityTargetSlider.value) : 65;
        const light = lightTargetSlider ? parseFloat(lightTargetSlider.value) : 850;
        const soil = soilTargetSlider ? parseFloat(soilTargetSlider.value) : 70;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry climate';
        logEntry.innerHTML = `
            <div class="log-time">${timeString}</div>
            <div class="log-message">Targets applied: Temp: ${temp}°C, Humidity: ${humidity}%, Light: ${light} lux, Soil: ${soil}%</div>
            <div class="log-type">CLIMATE</div>
        `;
        if (logsList) logsList.prepend(logEntry);
        
        showToast('Target settings applied to greenhouse system', 'success');
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
    if (savedCustomPreset) {
        plantPresets.custom = JSON.parse(savedCustomPreset);
    }
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

function updateSensorReadings() {
    const currentHour = timeMode === 'real' ? 
        new Date().getHours() + new Date().getMinutes() / 60 : 
        currentSimulatedTime.getHours() + currentSimulatedTime.getMinutes() / 60;
    
    const isDaytime = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset;
    
    // Time-based sensor readings
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
    
    // Simulate soil moisture decrease (faster if water pump is off)
    if (!waterpumpState.isActive) {
        soilValue -= Math.random() * soilDryingRate;
    }
    
    // If water pump is active, increase soil moisture
    if (waterpumpState.isActive) {
        soilValue += Math.random() * 1.5;
    }
    
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
    
    // Update displays
    if (temperatureValueElement) temperatureValueElement.textContent = `${tempValue.toFixed(1)}°C`;
    if (humidityValueElement) humidityValueElement.textContent = `${Math.floor(humidityValue)}%`;
    if (soilValueElement) soilValueElement.textContent = `${Math.max(0, soilValue).toFixed(1)}%`;
    if (lightValueElement) lightValueElement.textContent = `${lightValue} lux`;
    
    updateCurrentValues();
    updateStatusIndicators(tempValue, humidityValue, soilValue, lightValue);
    checkAllTargetStatuses();
    
    if (environmentChart) {
        addChartData(tempValue, humidityValue, soilValue, lightValue);
    }
    
    checkForAlerts(tempValue, humidityValue, soilValue, lightValue);
}

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
            new Date().getHours() : 
            currentSimulatedTime.getHours();
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
    if (light < 300 && now.getHours() >= 6 && now.getHours() <= 18) {
        alerts.push('Insufficient light for photosynthesis');
    }
    
    // Water pump alerts
    if (waterpumpState.waterLevel < 20) {
        alerts.push('Water reservoir low - consider refilling');
    }
    if (waterpumpState.waterLevel < 10) {
        alerts.push('Water reservoir critically low!');
    }
    
    if (alerts.length > 0 && Math.random() < 0.3) {
        addAlertLog(alerts[Math.floor(Math.random() * alerts.length)]);
    }
}

function addAlertLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const newLog = document.createElement('div');
    newLog.className = 'log-entry alert';
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${message}</div>
        <div class="log-type">ALERT</div>
    `;
    
    if (logsList) {
        logsList.prepend(newLog);
        
        const allLogs = logsList.querySelectorAll('.log-entry');
        if (allLogs.length > 20) {
            logsList.removeChild(allLogs[allLogs.length - 1]);
        }
    }
    
    if (message.includes('critical') || message.includes('risk')) {
        showToast(`⚠️ ${message}`, 'warning');
    }
}

function toggleGreenhouseCover() {
    greenhouseState.coverOpen = !greenhouseState.coverOpen;
    
    if (greenhouseState.coverOpen) {
        if (coverStatusElement) coverStatusElement.classList.remove('closed');
        if (coverStateElement) {
            coverStateElement.textContent = 'Open';
            coverStateElement.style.color = '#4caf50';
        }
        showToast('Greenhouse cover opened for ventilation', 'success');
        
        addSystemLog('Greenhouse cover opened for ventilation and sunlight');
    } else {
        if (coverStatusElement) coverStatusElement.classList.add('closed');
        if (coverStateElement) {
            coverStateElement.textContent = 'Closed';
            coverStateElement.style.color = '#8d6e63';
        }
        showToast('Greenhouse cover closed for protection', 'info');
        
        addSystemLog('Greenhouse cover closed for temperature and humidity control');
    }
}

function addSystemLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const newLog = document.createElement('div');
    newLog.className = 'log-entry system';
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${message}</div>
        <div class="log-type">SYSTEM</div>
    `;
    
    if (logsList) logsList.prepend(newLog);
}

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
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
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
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
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

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    if (themeToggle) {
        console.log('Theme toggle found');
        themeToggle.addEventListener('change', () => {
            console.log('Theme toggle changed:', themeToggle.checked);
            if (themeToggle.checked) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        });
    }
    
    if (toggleCoverButton) {
        toggleCoverButton.addEventListener('click', toggleGreenhouseCover);
    }
    
    if (chartButtons.length > 0) {
        chartButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('Chart button clicked:', button.dataset.chart);
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
                console.log('Log mode button clicked:', button.dataset.mode);
                logModeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterLogs(button.dataset.mode);
            });
        });
    }
    
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', () => {
            addSystemLog('Sensor data refreshed manually');
            showToast('Sensor data refreshed', 'info');
        });
    }
    
    if (addLogBtn) {
        addLogBtn.addEventListener('click', addManualLog);
    }
    
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', () => {
            showToast('Greenhouse logs exported as CSV', 'success');
        });
    }
    
    // Initialize plant selection
    initializePlantSelection();
    
    // Setup target sliders
    setupTargetSliders();
    
    // Update current values initially
    updateCurrentValues();
}

function updateChartVisibility() {
    if (!environmentChart) return;
    
    environmentChart.data.datasets.forEach((dataset, index) => {
        if (currentChartType === 'temperature') {
            dataset.hidden = index !== 0;
        } else if (currentChartType === 'humidity') {
            dataset.hidden = index !== 1;
        } else if (currentChartType === 'soil') {
            dataset.hidden = index !== 2;
        } else if (currentChartType === 'light') {
            dataset.hidden = index !== 3;
        } else if (currentChartType === 'all') {
            dataset.hidden = false;
        }
    });
    
    environmentChart.update();
}

function filterLogs(mode) {
    const logEntries = document.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        if (mode === 'all') {
            entry.style.display = 'flex';
        } else {
            if (entry.classList.contains(mode)) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        }
    });
}

function addManualLog() {
    const notes = [
        'Manual irrigation applied to tomato plants',
        'Pruned lower leaves for better air circulation',
        'Added organic fertilizer to vegetable beds',
        'Checked pH levels - all within optimal range',
        'Harvested mature lettuce leaves',
        'Inspected for pests - none detected'
    ];
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const newLog = document.createElement('div');
    newLog.className = 'log-entry climate';
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${notes[Math.floor(Math.random() * notes.length)]}</div>
        <div class="log-type">CLIMATE</div>
    `;
    
    if (logsList) logsList.prepend(newLog);
    
    showToast('Manual log entry added', 'info');
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    switch(type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
    }
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
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
// ========== TIME EFFECTS TOGGLE FUNCTIONALITY ==========

// DOM Elements
const toggleTimeEffectsBtn = document.getElementById('toggle-time-effects');

// State
let timeEffectsVisible = true;

// Initialize time effects toggle
function initializeTimeEffectsToggle() {
    // Load saved state
    const savedState = localStorage.getItem('timeEffectsVisible');
    if (savedState !== null) {
        timeEffectsVisible = savedState === 'true';
    }
    
    // Set initial state
    updateTimeEffectsVisibility();
    
    // Setup event listener
    if (toggleTimeEffectsBtn) {
        toggleTimeEffectsBtn.addEventListener('click', toggleTimeEffects);
    }
}

// Toggle time effects visibility
function toggleTimeEffects() {
    timeEffectsVisible = !timeEffectsVisible;
    updateTimeEffectsVisibility();
    
    // Save state
    localStorage.setItem('timeEffectsVisible', timeEffectsVisible);
    
    // Show feedback
    showToast(`Time effects ${timeEffectsVisible ? 'shown' : 'hidden'}`, 'info');
}

// Update time effects visibility
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

// Update the initialization function to include the toggle
function initializeDashboard() {
    console.log('Initializing dashboard...');

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    updateTime();
    setInterval(updateTime, 1000);
    
    updateSensorReadings();
    setInterval(updateSensorReadings, 3000);
    
    setTimeout(() => {
        initializeChart();
    }, 500);
    
    setupEventListeners();
    
    // Initialize time effects toggle
    initializeTimeEffectsToggle();
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log('Automated Herb Greenhouse System Initializing...');
    
    checkLoginStatus();
    initializeDashboard();
    initializeTimeSystem();
    initializeWaterPumpSystem();
    setupPanelVisibilityControls();
});