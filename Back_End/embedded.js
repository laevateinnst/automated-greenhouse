// =================== GLOBAL STATE ===================
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
let timeEffectsVisible = true;

const timeConfig = {
    sunrise: 6.5,    // 6:30 AM
    sunset: 19.75,   // 7:45 PM
    dawnStart: 5,    // 5:00 AM
    dawnEnd: 7,      // 7:00 AM
    duskStart: 18,   // 6:00 PM
    duskEnd: 20,     // 8:00 PM
    morningEnd: 12,  // 12:00 PM
    afternoonEnd: 17 // 5:00 PM
};

// =================== DOM ELEMENTS ===================
const elements = {
    // Time elements
    currentTimeElement: document.getElementById('current-time'),
    sunElement: document.getElementById('sun-element'),
    moonElement: document.getElementById('moon-element'),
    periodIcon: document.getElementById('period-icon'),
    periodName: document.getElementById('period-name'),
    periodTime: document.getElementById('period-time'),
    timeProgressFill: document.getElementById('time-progress-fill'),
    sunriseTimeElement: document.getElementById('sunrise-time'),
    sunsetTimeElement: document.getElementById('sunset-time'),
    daylightHoursElement: document.getElementById('daylight-hours'),
    nightHoursElement: document.getElementById('night-hours'),
    plantStateText: document.getElementById('plant-state-text'),
    plantStateDesc: document.getElementById('plant-state-desc'),
    
    // Time controls
    realTimeBtn: document.getElementById('real-time-btn'),
    speedUpBtn: document.getElementById('speed-up-btn'),
    pauseTimeBtn: document.getElementById('pause-time-btn'),
    timeSimulationSlider: document.getElementById('time-simulation-slider'),
    toggleTimeEffectsBtn: document.getElementById('toggle-time-effects'),
    
    // Login elements
    loginOverlay: document.getElementById('login-overlay'),
    loginForm: document.getElementById('login-form'),
    mainContainer: document.getElementById('main-container'),
    loggedUserElement: document.getElementById('logged-user'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Plant selection
    plantNameDisplay: document.getElementById('plant-name-display'),
    currentPlantTypeElement: document.getElementById('current-plant-type'),
    plantOptions: document.querySelectorAll('.plant-option'),
    
    // Target sliders
    tempTargetSlider: document.getElementById('temp-target'),
    humidityTargetSlider: document.getElementById('humidity-target'),
    lightTargetSlider: document.getElementById('light-target'),
    soilTargetSlider: document.getElementById('soil-target'),
    
    // Target values
    tempTargetValue: document.getElementById('temp-target-value'),
    humidityTargetValue: document.getElementById('humidity-target-value'),
    lightTargetValue: document.getElementById('light-target-value'),
    soilTargetValue: document.getElementById('soil-target-value'),
    
    // Current values
    currentTempElement: document.getElementById('current-temp'),
    currentHumidityElement: document.getElementById('current-humidity'),
    currentLightElement: document.getElementById('current-light'),
    currentSoilElement: document.getElementById('current-soil'),
    
    // Sensor values
    temperatureValueElement: document.getElementById('temperature-value'),
    humidityValueElement: document.getElementById('humidity-value'),
    soilValueElement: document.getElementById('soil-value'),
    lightValueElement: document.getElementById('light-value'),
    
    // Water pump elements
    waterpumpStatusElement: document.getElementById('waterpump-status'),
    waterpumpStateIndicator: document.getElementById('waterpump-state-indicator'),
    toggleWaterpumpButton: document.getElementById('toggle-waterpump'),
    manualModeButton: document.getElementById('manual-mode-btn'),
    reservoirFillElement: document.getElementById('reservoir-fill'),
    reservoirPercentageElement: document.getElementById('reservoir-percentage'),
    currentWaterLevelElement: document.getElementById('current-water-level'),
    lastIrrigationElement: document.getElementById('last-irrigation'),
    waterpumpDetailElement: document.getElementById('waterpump-detail'),
    currentSoilPumpElement: document.getElementById('current-soil-pump'),
    soilFillElement: document.getElementById('soil-fill'),
    soilTempElement: document.getElementById('soil-temp'),
    pumpDurationElement: document.getElementById('pump-duration'),
    pumpFlowRateElement: document.getElementById('pump-flow-rate'),
    waterTempElement: document.getElementById('water-temp'),
    autoStatusElement: document.getElementById('auto-status'),
    autoThresholdSlider: document.getElementById('auto-threshold'),
    thresholdValueElement: document.getElementById('threshold-value'),
    
    // Cover elements
    coverStatusElement: document.getElementById('cover-status'),
    coverStateElement: document.getElementById('cover-state'),
    toggleCoverButton: document.getElementById('toggle-cover'),
    
    // Chart elements
    chartButtons: document.querySelectorAll('.chart-btn'),
    logModeButtons: document.querySelectorAll('.log-mode-btn'),
    logsList: document.getElementById('logs-list'),
    refreshLogsBtn: document.getElementById('refresh-logs'),
    addLogBtn: document.getElementById('add-log'),
    exportLogsBtn: document.getElementById('export-logs'),
    
    // Theme toggle
    themeToggle: document.getElementById('theme-toggle'),
    
    // Control buttons
    savePresetBtn: document.getElementById('save-preset'),
    applyTargetsBtn: document.getElementById('apply-targets'),
    resetTargetsBtn: document.getElementById('reset-targets')
};

let environmentChart;
let currentChartType = 'temperature';
let greenhouseState = {
    coverOpen: true,
    lastIrrigation: new Date(),
    lightsOn: true,
    systemActive: true
};

const plantPresets = {
    oregano: {
        name: "Oregano",
        temperature: 24,
        humidity: 50,
        light: 1200,
        soil: 60,
        description: "Mediterranean herb that prefers dry conditions"
    },
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

// =================== INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Greenhouse System Initializing...');
    
    // Initialize all systems
    initializeDashboard();
    initializeTimeSystem();
    initializeWaterPumpSystem();
    initializePlantSelection();
    initializeChart();
    initializeEventListeners();
    
    // Start updates
    startTimeUpdates();
    startDataRefresh();
    
    // Update initial displays
    updateAllDisplays();
    
    console.log('✅ System initialized successfully');
});

// =================== TIME SYSTEM FUNCTIONS ===================
function initializeTimeSystem() {
    console.log('Initializing Time System...');
    
    // Load time effects preference
    const savedEffects = localStorage.getItem('timeEffectsVisible');
    if (savedEffects !== null) timeEffectsVisible = savedEffects === 'true';
    updateTimeEffectsVisibility();
    
    // Set up time controls
    setupTimeControls();
    
    // Initial update
    updateTimeDisplay();
    updateTimeOfDay();
    updateTimeOfDayDisplay();
}

function startTimeUpdates() {
    // Update time every second
    setInterval(updateTimeDisplay, 1000);
    
    // Update time-of-day effects every minute
    setInterval(updateTimeOfDay, 60000);
    
    // Update simulated time
    setInterval(() => {
        if (timeMode === 'simulated' && !isTimePaused) {
            advanceSimulatedTime();
            updateTimeDisplay();
            updateTimeOfDay();
        }
    }, 1000);
}

function updateTimeDisplay() {
    if (!elements.currentTimeElement) return;
    
    const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    elements.currentTimeElement.textContent = timeString;
    
    // Update datetime attribute for semantic HTML
    if (elements.currentTimeElement.tagName === 'TIME') {
        elements.currentTimeElement.setAttribute('datetime', now.toISOString());
    }
}

function updateTimeOfDay() {
    const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    // Apply time effects if visible
    if (timeEffectsVisible) {
        updateCelestialPositions(currentHour);
        applyTimeEffects(currentHour);
        updateTimeProgress(currentHour);
    }
    
    // Update plant state
    updatePlantStateBasedOnTime(currentHour);
    
    console.log(`🕒 Time of day updated: ${currentHour.toFixed(2)}h`);
}

function updateCelestialPositions(currentHour) {
    if (!elements.sunElement || !elements.moonElement) return;
    
    const dayDuration = timeConfig.sunset - timeConfig.sunrise;
    
    let sunPosition = 0;
    if (currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset) {
        sunPosition = ((currentHour - timeConfig.sunrise) / dayDuration) * 100;
    } else if (currentHour > timeConfig.sunset) {
        sunPosition = 100;
    }
    
    let moonPosition = (sunPosition + 50) % 100;
    
    elements.sunElement.style.left = `${sunPosition}%`;
    elements.sunElement.style.opacity = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset ? '1' : '0';
    
    elements.moonElement.style.left = `${moonPosition}%`;
    elements.moonElement.style.opacity = currentHour < timeConfig.sunrise || currentHour > timeConfig.sunset ? '1' : '0';
    
    console.log(`☀️ Sun position: ${sunPosition.toFixed(1)}% | 🌙 Moon position: ${moonPosition.toFixed(1)}%`);
}

function applyTimeEffects(currentHour) {
    // Remove all time period classes
    const timePeriods = ['dawn-mode', 'morning-mode', 'afternoon-mode', 'dusk-mode', 'night-mode'];
    timePeriods.forEach(period => document.body.classList.remove(period));
    
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
    
    // Add the current time period class
    document.body.classList.add(`${timePeriod}-mode`);
    
    // Update period display
    if (elements.periodIcon && elements.periodName && elements.periodTime) {
        const iconElement = elements.periodIcon.querySelector('i');
        if (iconElement) {
            iconElement.className = `fas ${periodData.icon}`;
            elements.periodIcon.style.background = `linear-gradient(135deg, ${periodData.color}, ${periodData.color}80)`;
            elements.periodName.textContent = periodData.name;
            
            // Update period time range
            let timeRange = '';
            switch(timePeriod) {
                case 'dawn': timeRange = `${formatTime(timeConfig.dawnStart)} - ${formatTime(timeConfig.dawnEnd)}`; break;
                case 'morning': timeRange = `${formatTime(timeConfig.dawnEnd)} - ${formatTime(timeConfig.morningEnd)}`; break;
                case 'afternoon': timeRange = `${formatTime(timeConfig.morningEnd)} - ${formatTime(timeConfig.afternoonEnd)}`; break;
                case 'dusk': timeRange = `${formatTime(timeConfig.afternoonEnd)} - ${formatTime(timeConfig.duskEnd)}`; break;
                case 'night': timeRange = `${formatTime(timeConfig.duskEnd)} - ${formatTime(timeConfig.dawnStart)}`; break;
            }
            elements.periodTime.textContent = timeRange;
        }
    }
    
    console.log(`🌅 Time period: ${timePeriod} (${periodData.name})`);
}

function updatePlantStateBasedOnTime(currentHour) {
    if (!elements.plantStateText || !elements.plantStateDesc) return;
    
    let state = '';
    let description = '';
    
    if (currentHour >= timeConfig.dawnStart && currentHour < timeConfig.dawnEnd) {
        state = 'Photosynthesis Starting';
        description = 'Plants are waking up, stomata opening';
    } else if (currentHour >= timeConfig.dawnEnd && currentHour < timeConfig.morningEnd) {
        state = 'Photosynthesis Active';
        description = 'Maximum light absorption, rapid growth';
    } else if (currentHour >= timeConfig.morningEnd && currentHour < timeConfig.afternoonEnd) {
        state = 'Growth Peak';
        description = 'Optimal temperature for enzyme activity';
    } else if (currentHour >= timeConfig.afternoonEnd && currentHour < timeConfig.duskEnd) {
        state = 'Metabolism Slowing';
        description = 'Preparing for night, storing energy';
    } else {
        state = 'Respiration Active';
        description = 'Converting stored energy, minimal growth';
    }
    
    elements.plantStateText.textContent = state;
    elements.plantStateDesc.textContent = description;
}

function updateTimeProgress(currentHour) {
    if (!elements.timeProgressFill) return;
    
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
    
    elements.timeProgressFill.style.width = `${progress * 100}%`;
    const hue = 200 + (progress * 160);
    elements.timeProgressFill.style.background = `linear-gradient(to right, hsl(${hue}, 70%, 50%), hsl(${hue + 20}, 80%, 60%))`;
}

function updateTimeOfDayDisplay() {
    if (!elements.sunriseTimeElement || !elements.sunsetTimeElement || 
        !elements.daylightHoursElement || !elements.nightHoursElement) return;
    
    // Format sunrise time
    const sunriseHour = Math.floor(timeConfig.sunrise);
    const sunriseMinute = Math.floor((timeConfig.sunrise % 1) * 60);
    const sunrisePeriod = sunriseHour >= 12 ? 'PM' : 'AM';
    const sunriseDisplayHour = sunriseHour > 12 ? sunriseHour - 12 : sunriseHour === 0 ? 12 : sunriseHour;
    elements.sunriseTimeElement.textContent = `${sunriseDisplayHour}:${sunriseMinute.toString().padStart(2, '0')} ${sunrisePeriod}`;
    
    // Format sunset time
    const sunsetHour = Math.floor(timeConfig.sunset);
    const sunsetMinute = Math.floor((timeConfig.sunset % 1) * 60);
    const sunsetPeriod = sunsetHour >= 12 ? 'PM' : 'AM';
    const sunsetDisplayHour = sunsetHour > 12 ? sunsetHour - 12 : sunsetHour === 0 ? 12 : sunsetHour;
    elements.sunsetTimeElement.textContent = `${sunsetDisplayHour}:${sunsetMinute.toString().padStart(2, '0')} ${sunsetPeriod}`;
    
    // Calculate daylight hours
    const daylightHours = timeConfig.sunset - timeConfig.sunrise;
    const daylightHoursInt = Math.floor(daylightHours);
    const daylightMinutes = Math.floor((daylightHours % 1) * 60);
    elements.daylightHoursElement.textContent = `${daylightHoursInt}h ${daylightMinutes}m`;
    
    // Calculate night hours
    const nightHours = 24 - daylightHours;
    const nightHoursInt = Math.floor(nightHours);
    const nightMinutes = Math.floor((nightHours % 1) * 60);
    elements.nightHoursElement.textContent = `${nightHoursInt}h ${nightMinutes}m`;
}

function formatTime(hourDecimal) {
    const hour = Math.floor(hourDecimal);
    const minute = Math.floor((hourDecimal % 1) * 60);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function setupTimeControls() {
    // Real time button
    if (elements.realTimeBtn) {
        elements.realTimeBtn.addEventListener('click', () => {
            timeMode = 'real';
            isTimePaused = false;
            updateTimeControlsUI();
            updateTimeDisplay();
            updateTimeOfDay();
            showToast('Switched to real time mode', 'success');
        });
    }
    
    // Speed up button
    if (elements.speedUpBtn) {
        elements.speedUpBtn.addEventListener('click', () => {
            timeMode = 'simulated';
            timeSpeedMultiplier = 10;
            isTimePaused = false;
            updateTimeControlsUI();
            showToast('Time simulation 10x speed', 'info');
        });
    }
    
    // Pause button
    if (elements.pauseTimeBtn) {
        elements.pauseTimeBtn.addEventListener('click', () => {
            isTimePaused = !isTimePaused;
            updateTimeControlsUI();
            showToast(isTimePaused ? 'Time paused' : 'Time resumed', 'info');
        });
    }
    
    // Time simulation slider
    if (elements.timeSimulationSlider) {
        elements.timeSimulationSlider.addEventListener('input', function() {
            const hourValue = parseFloat(this.value);
            currentSimulatedTime.setHours(Math.floor(hourValue));
            currentSimulatedTime.setMinutes((hourValue % 1) * 60);
            currentSimulatedTime.setSeconds(0);
            
            updateTimeDisplay();
            updateTimeOfDay();
        });
    }
    
    // Time effects toggle
    if (elements.toggleTimeEffectsBtn) {
        elements.toggleTimeEffectsBtn.addEventListener('click', () => {
            timeEffectsVisible = !timeEffectsVisible;
            updateTimeEffectsVisibility();
            localStorage.setItem('timeEffectsVisible', timeEffectsVisible);
            showToast(`Time effects ${timeEffectsVisible ? 'shown' : 'hidden'}`, 'info');
            
            // Update time display when effects are toggled
            if (timeEffectsVisible) {
                updateTimeOfDay();
            }
        });
    }
    
    updateTimeControlsUI();
}

function updateTimeControlsUI() {
    // Update real time button
    if (elements.realTimeBtn) {
        elements.realTimeBtn.classList.toggle('active', timeMode === 'real');
        elements.realTimeBtn.style.opacity = timeMode === 'real' ? '1' : '0.6';
    }
    
    // Update speed up button
    if (elements.speedUpBtn) {
        elements.speedUpBtn.classList.toggle('active', timeMode === 'simulated' && !isTimePaused);
        elements.speedUpBtn.style.opacity = timeMode === 'simulated' && !isTimePaused ? '1' : '0.6';
    }
    
    // Update pause button
    if (elements.pauseTimeBtn) {
        const icon = elements.pauseTimeBtn.querySelector('i');
        if (icon) {
            icon.className = isTimePaused ? 'fas fa-play' : 'fas fa-pause';
            elements.pauseTimeBtn.classList.toggle('active', isTimePaused);
            elements.pauseTimeBtn.style.opacity = isTimePaused ? '1' : '0.6';
        }
    }
}

function updateTimeEffectsVisibility() {
    if (timeEffectsVisible) {
        document.body.classList.remove('time-effects-hidden');
        if (elements.toggleTimeEffectsBtn) {
            elements.toggleTimeEffectsBtn.classList.add('active');
            elements.toggleTimeEffectsBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Hide Time Effects</span>';
        }
    } else {
        document.body.classList.add('time-effects-hidden');
        if (elements.toggleTimeEffectsBtn) {
            elements.toggleTimeEffectsBtn.classList.remove('active');
            elements.toggleTimeEffectsBtn.innerHTML = '<i class="fas fa-eye"></i><span>Show Time Effects</span>';
        }
    }
}

function advanceSimulatedTime() {
    const advanceMinutes = timeSpeedMultiplier;
    currentSimulatedTime.setMinutes(currentSimulatedTime.getMinutes() + advanceMinutes);
    
    if (currentSimulatedTime.getHours() >= 24) {
        currentSimulatedTime.setDate(currentSimulatedTime.getDate() + 1);
        currentSimulatedTime.setHours(currentSimulatedTime.getHours() - 24);
    }
    
    if (elements.timeSimulationSlider) {
        const currentHour = currentSimulatedTime.getHours() + currentSimulatedTime.getMinutes() / 60;
        elements.timeSimulationSlider.value = currentHour;
    }
}

// =================== DASHBOARD FUNCTIONS ===================
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Set theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Load saved settings
    loadSavedSettings();
    loadWaterPumpState();
    
    // Skip login for now (demo mode)
    if (elements.mainContainer) {
        elements.mainContainer.style.display = 'block';
    }
    if (elements.loginOverlay) {
        elements.loginOverlay.style.display = 'none';
    }
    
    // Set default user
    if (elements.loggedUserElement) {
        elements.loggedUserElement.textContent = 'Demo User';
    }
    
    // Update initial displays
    updateTargetDisplays();
    updateCurrentValues();
    checkAllTargetStatuses();
    
    // Add initial logs
    addInitialLogs();
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (elements.themeToggle) elements.themeToggle.checked = true;
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        if (elements.themeToggle) elements.themeToggle.checked = false;
        localStorage.setItem('theme', 'light');
    }
    
    if (environmentChart) {
        updateChartColors();
    }
}

// =================== WATER PUMP SYSTEM ===================
function initializeWaterPumpSystem() {
    console.log('Initializing Water Pump System...');
    
    // Load saved state
    loadWaterPumpState();
    
    // Update displays
    updateWaterPumpDisplay();
    
    // Start simulations
    startWaterLevelSimulation();
    startAutoIrrigationMonitoring();
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
    // Update status
    if (elements.waterpumpStatusElement) {
        if (waterpumpState.isActive) {
            elements.waterpumpStatusElement.textContent = 'IRRIGATING';
            elements.waterpumpStatusElement.classList.add('active');
        } else {
            elements.waterpumpStatusElement.textContent = 'READY';
            elements.waterpumpStatusElement.classList.remove('active');
        }
    }
    
    // Update state indicator
    if (elements.waterpumpStateIndicator) {
        if (waterpumpState.isActive) {
            elements.waterpumpStateIndicator.className = 'status-indicator warning';
            elements.waterpumpStateIndicator.style.animation = 'pulse 0.5s infinite';
        } else {
            elements.waterpumpStateIndicator.className = 'status-indicator optimal';
            elements.waterpumpStateIndicator.style.animation = 'pulse 2s infinite';
        }
    }
    
    // Update toggle button
    if (elements.toggleWaterpumpButton) {
        if (waterpumpState.isActive) {
            elements.toggleWaterpumpButton.innerHTML = '<i class="fas fa-stop"></i> Stop Irrigation';
            elements.toggleWaterpumpButton.classList.add('active');
        } else {
            elements.toggleWaterpumpButton.innerHTML = '<i class="fas fa-play"></i> Start Irrigation';
            elements.toggleWaterpumpButton.classList.remove('active');
        }
    }
    
    // Update manual mode button
    if (elements.manualModeButton) {
        if (waterpumpState.isManualMode) {
            elements.manualModeButton.classList.add('active');
            elements.manualModeButton.innerHTML = '<i class="fas fa-hand-paper"></i> Manual Mode ON';
        } else {
            elements.manualModeButton.classList.remove('active');
            elements.manualModeButton.innerHTML = '<i class="fas fa-hand-paper"></i> Manual Mode';
        }
    }
    
    // Update irrigation time
    updateIrrigationTime();
    
    // Update water reservoir
    updateWaterReservoir();
    
    // Update pump details
    if (elements.pumpDurationElement) elements.pumpDurationElement.textContent = `${waterpumpState.irrigationDuration} min`;
    if (elements.pumpFlowRateElement) elements.pumpFlowRateElement.textContent = `${waterpumpState.flowRate} L/min`;
    if (elements.waterTempElement) elements.waterTempElement.textContent = `${waterpumpState.waterTemperature}°C`;
    
    // Update auto irrigation status
    if (elements.autoStatusElement) {
        if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode) {
            elements.autoStatusElement.textContent = 'Enabled';
            elements.autoStatusElement.className = 'setting-value auto-status';
        } else {
            elements.autoStatusElement.textContent = 'Disabled';
            elements.autoStatusElement.className = 'setting-value auto-status disabled';
        }
    }
    
    // Update threshold display
    if (elements.thresholdValueElement) elements.thresholdValueElement.textContent = `${waterpumpState.autoThreshold}%`;
    if (elements.autoThresholdSlider) elements.autoThresholdSlider.value = waterpumpState.autoThreshold;
}

function updateIrrigationTime() {
    if (!elements.lastIrrigationElement || !elements.waterpumpDetailElement) return;
    
    const now = new Date();
    const timeDiff = now - waterpumpState.lastIrrigation;
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (waterpumpState.isActive) {
        elements.waterpumpDetailElement.textContent = 'Currently irrigating plants...';
        elements.lastIrrigationElement.textContent = 'Now';
    } else if (hours > 0) {
        elements.waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        elements.lastIrrigationElement.textContent = `${hours}h ago`;
    } else if (minutes > 0) {
        elements.waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        elements.lastIrrigationElement.textContent = `${minutes}m ago`;
    } else {
        elements.waterpumpDetailElement.textContent = `Auto mode: irrigate when soil < ${waterpumpState.autoThreshold}%`;
        elements.lastIrrigationElement.textContent = 'Just now';
    }
}

function updateWaterReservoir() {
    const waterLevel = waterpumpState.waterLevel;
    
    if (elements.reservoirFillElement) {
        elements.reservoirFillElement.style.width = `${waterLevel}%`;
        
        if (waterLevel < 20) {
            elements.reservoirFillElement.style.background = 'linear-gradient(to right, var(--danger-color), #ef5350)';
        } else if (waterLevel < 50) {
            elements.reservoirFillElement.style.background = 'linear-gradient(to right, var(--warning-color), #ffb74d)';
        } else {
            elements.reservoirFillElement.style.background = 'linear-gradient(to right, var(--water-color), #64b5f6)';
        }
    }
    
    if (elements.reservoirPercentageElement) {
        elements.reservoirPercentageElement.textContent = `${Math.round(waterLevel)}%`;
        
        if (waterLevel < 20) {
            elements.reservoirPercentageElement.style.color = 'var(--danger-color)';
        } else if (waterLevel < 50) {
            elements.reservoirPercentageElement.style.color = 'var(--warning-color)';
        } else {
            elements.reservoirPercentageElement.style.color = 'var(--water-color)';
        }
    }
    
    if (elements.currentWaterLevelElement) {
        const currentWater = Math.round((waterLevel / 100) * waterpumpState.reservoirCapacity);
        elements.currentWaterLevelElement.textContent = `${currentWater}L`;
    }
}

function startWaterLevelSimulation() {
    setInterval(() => {
        if (!waterpumpState.isActive) {
            // Slow water evaporation
            if (waterpumpState.waterLevel > 0) {
                waterpumpState.waterLevel -= Math.random() * 0.01;
            }
            
            // Occasional auto-refill
            if (waterpumpState.waterLevel < 50 && Math.random() < 0.1) {
                waterpumpState.waterLevel += Math.random() * 10;
                waterpumpState.waterLevel = Math.min(100, waterpumpState.waterLevel);
                addLogEntry('Water reservoir auto-refilled', 'IRRIGATION');
            }
            
            updateWaterReservoir();
        }
        
        updateSoilMoistureDisplay();
    }, 30000);
}

function startAutoIrrigationMonitoring() {
    setInterval(() => {
        if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode && !waterpumpState.isActive) {
            const soilValue = parseFloat(elements.soilValueElement?.textContent) || 72;
            
            if (soilValue < waterpumpState.autoThreshold && waterpumpState.waterLevel > 20) {
                startIrrigation('auto');
            }
        }
        
        if (waterpumpState.isActive) {
            const soilValue = parseFloat(elements.soilValueElement?.textContent) || 72;
            
            if (soilValue > 70 || waterpumpState.waterLevel <= 5) {
                stopIrrigation('auto');
            }
        }
    }, 60000);
}

function updateSoilMoistureDisplay() {
    const soilValue = parseFloat(elements.soilValueElement?.textContent) || 72;
    
    if (elements.currentSoilPumpElement) {
        elements.currentSoilPumpElement.textContent = `${soilValue}%`;
    }
    
    if (elements.soilFillElement) {
        elements.soilFillElement.style.width = `${soilValue}%`;
        
        if (soilValue < 40) {
            elements.soilFillElement.style.background = 'linear-gradient(to right, var(--danger-color), #ef5350)';
        } else if (soilValue < 60) {
            elements.soilFillElement.style.background = 'linear-gradient(to right, var(--warning-color), #ffb74d)';
        } else {
            elements.soilFillElement.style.background = 'linear-gradient(to right, var(--soil-color), #a1887f)';
        }
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
    
    const logMessage = source === 'auto' ? 'Auto irrigation started (soil too dry)' : 'Manual irrigation started';
    addLogEntry(logMessage, 'IRRIGATION');
    
    showToast(source === 'auto' ? 'Auto irrigation started' : 'Irrigation started', 'success');
    updateWaterPumpDisplay();
    startWaterConsumption();
    saveWaterPumpState();
}

function stopIrrigation(source = 'manual') {
    waterpumpState.isActive = false;
    stopWaterConsumption();
    
    const logMessage = source === 'auto' ? 'Auto irrigation stopped (soil moist enough)' : 'Irrigation stopped';
    addLogEntry(logMessage, 'IRRIGATION');
    
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

// =================== PLANT SELECTION & TARGETS ===================
function initializePlantSelection() {
    if (!elements.plantOptions || elements.plantOptions.length === 0) return;
    
    elements.plantOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            elements.plantOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Get plant type and apply preset
            const plantType = this.dataset.plant;
            currentSettings.selectedPlant = plantType;
            applyPlantPreset(plantType);
            
            // Save settings
            saveSettings();
        });
    });
}

function applyPlantPreset(plantType) {
    const preset = plantPresets[plantType];
    
    // Update sliders
    if (elements.tempTargetSlider) elements.tempTargetSlider.value = preset.temperature;
    if (elements.humidityTargetSlider) elements.humidityTargetSlider.value = preset.humidity;
    if (elements.lightTargetSlider) elements.lightTargetSlider.value = preset.light;
    if (elements.soilTargetSlider) elements.soilTargetSlider.value = preset.soil;
    
    // Update displays
    updateTargetDisplays();
    updatePlantDisplay(plantType);
    
    // Update current settings
    currentSettings.targets = {...preset};
    
    // Show notification
    if (plantType !== 'custom') {
        showToast(`${preset.name} preset applied`, 'success');
    } else {
        showToast('Custom mode activated', 'info');
    }
    
    // Check target statuses
    checkAllTargetStatuses();
}

function updatePlantDisplay(plantType) {
    const preset = plantPresets[plantType];
    
    if (elements.plantNameDisplay) {
        elements.plantNameDisplay.textContent = `${preset.name} Settings`;
        elements.plantNameDisplay.title = preset.description;
    }
    
    if (elements.currentPlantTypeElement) {
        elements.currentPlantTypeElement.textContent = preset.name;
    }
}

function setupTargetSliders() {
    // Temperature slider
    if (elements.tempTargetSlider) {
        elements.tempTargetSlider.addEventListener('input', function() {
            if (elements.tempTargetValue) elements.tempTargetValue.textContent = `${this.value}°C`;
            currentSettings.targets.temperature = parseFloat(this.value);
            checkTargetStatus('temperature');
        });
    }
    
    // Humidity slider
    if (elements.humidityTargetSlider) {
        elements.humidityTargetSlider.addEventListener('input', function() {
            if (elements.humidityTargetValue) elements.humidityTargetValue.textContent = `${this.value}%`;
            currentSettings.targets.humidity = parseFloat(this.value);
            checkTargetStatus('humidity');
        });
    }
    
    // Light slider
    if (elements.lightTargetSlider) {
        elements.lightTargetSlider.addEventListener('input', function() {
            if (elements.lightTargetValue) elements.lightTargetValue.textContent = `${this.value} lux`;
            currentSettings.targets.light = parseFloat(this.value);
            checkTargetStatus('light');
        });
    }
    
    // Soil slider
    if (elements.soilTargetSlider) {
        elements.soilTargetSlider.addEventListener('input', function() {
            if (elements.soilTargetValue) elements.soilTargetValue.textContent = `${this.value}%`;
            currentSettings.targets.soil = parseFloat(this.value);
            checkTargetStatus('soil');
        });
    }
}

function updateTargetDisplays() {
    if (elements.tempTargetValue && elements.tempTargetSlider) {
        elements.tempTargetValue.textContent = `${elements.tempTargetSlider.value}°C`;
    }
    if (elements.humidityTargetValue && elements.humidityTargetSlider) {
        elements.humidityTargetValue.textContent = `${elements.humidityTargetSlider.value}%`;
    }
    if (elements.lightTargetValue && elements.lightTargetSlider) {
        elements.lightTargetValue.textContent = `${elements.lightTargetSlider.value} lux`;
    }
    if (elements.soilTargetValue && elements.soilTargetSlider) {
        elements.soilTargetValue.textContent = `${elements.soilTargetSlider.value}%`;
    }
}

function updateCurrentValues() {
    if (elements.currentTempElement && elements.temperatureValueElement) {
        elements.currentTempElement.textContent = elements.temperatureValueElement.textContent;
    }
    if (elements.currentHumidityElement && elements.humidityValueElement) {
        elements.currentHumidityElement.textContent = elements.humidityValueElement.textContent;
    }
    if (elements.currentLightElement && elements.lightValueElement) {
        elements.currentLightElement.textContent = elements.lightValueElement.textContent;
    }
    if (elements.currentSoilElement && elements.soilValueElement) {
        elements.currentSoilElement.textContent = elements.soilValueElement.textContent;
    }
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

// =================== COVER CONTROL ===================
function updateCoverDisplay() {
    if (!elements.coverStatusElement || !elements.coverStateElement) return;
    
    if (greenhouseState.coverOpen) {
        elements.coverStatusElement.classList.remove('closed');
        elements.coverStateElement.textContent = 'Open';
        elements.coverStateElement.style.color = '#4caf50';
    } else {
        elements.coverStatusElement.classList.add('closed');
        elements.coverStateElement.textContent = 'Closed';
        elements.coverStateElement.style.color = '#8d6e63';
    }
}

// =================== SENSOR DATA ===================
function startDataRefresh() {
    // Update sensor readings every 10 seconds
    setInterval(updateSensorReadings, 10000);
    
    // Initial update
    updateSensorReadings();
}

function updateSensorReadings() {
    const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    updateSensorReadingsBasedOnTime(currentHour);
}

function updateSensorReadingsBasedOnTime(currentHour) {
    const isDaytime = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset;
    
    // Calculate temperature
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
    
    // Calculate humidity
    let humidityValue = greenhouseState.coverOpen ?
        (Math.random() * 20 + 55 + (isDaytime ? -10 : 10)) :
        (Math.random() * 15 + 70);
    
    // Calculate soil moisture
    let soilDryingRate = isDaytime ? 0.8 : 0.3;
    let soilValue = elements.soilValueElement ? parseFloat(elements.soilValueElement.textContent) || 72 : 72;
    
    if (!waterpumpState.isActive) soilValue -= Math.random() * soilDryingRate;
    if (waterpumpState.isActive) soilValue += Math.random() * 1.5;
    
    if (soilValue < 30) soilValue = 70; 
    if (soilValue > 90) soilValue = 70;
    
    // Calculate light level
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
    
    // Update display
    if (elements.temperatureValueElement) elements.temperatureValueElement.textContent = `${tempValue.toFixed(1)}°C`;
    if (elements.humidityValueElement) elements.humidityValueElement.textContent = `${humidityValue.toFixed(0)}%`;
    if (elements.soilValueElement) elements.soilValueElement.textContent = `${soilValue.toFixed(1)}%`;
    if (elements.lightValueElement) elements.lightValueElement.textContent = `${lightValue} lux`;
    
    // Update current values display
    updateCurrentValues();
    
    // Update status indicators
    updateStatusIndicators(tempValue, humidityValue, soilValue, lightValue);
    
    // Check target statuses
    checkAllTargetStatuses();
    
    // Add to chart
    if (environmentChart) {
        addChartData(tempValue, humidityValue, soilValue, lightValue);
    }
    
    // Check for alerts
    checkForAlerts(tempValue, humidityValue, soilValue, lightValue);
    
    // Update water pump soil display
    updateSoilMoistureDisplay();
}

function updateStatusIndicators(temp, humidity, soil, light) {
    // Temperature status
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
    
    // Humidity status
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

    // Soil status
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
    
    // Light status
    const lightIndicator = document.querySelector('.light .status-indicator');
    const lightStatus = document.querySelector('.light .status-text');
    if (lightIndicator && lightStatus) {
        const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
        const currentHour = now.getHours();
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

// =================== CHART FUNCTIONS ===================
function initializeChart() {
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
function initializeEventListeners() {
    console.log('Setting up event listeners...');
    
    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('change', () => {
            setTheme(elements.themeToggle.checked ? 'dark' : 'light');
        });
    }
    
    // Water pump toggle
    if (elements.toggleWaterpumpButton) {
        elements.toggleWaterpumpButton.addEventListener('click', function() {
            if (waterpumpState.isActive) {
                stopIrrigation('manual');
            } else {
                startIrrigation('manual');
            }
        });
    }
    
    // Manual mode toggle
    if (elements.manualModeButton) {
        elements.manualModeButton.addEventListener('click', function() {
            waterpumpState.isManualMode = !waterpumpState.isManualMode;
            waterpumpState.isAutoIrrigationEnabled = !waterpumpState.isManualMode;
            
            addLogEntry(`Manual mode ${waterpumpState.isManualMode ? 'enabled' : 'disabled'}`, 'SYSTEM');
            showToast(`Manual mode ${waterpumpState.isManualMode ? 'ON' : 'OFF'}`, 'info');
            updateWaterPumpDisplay();
            saveWaterPumpState();
        });
    }
    
    // Auto threshold slider
    if (elements.autoThresholdSlider) {
        elements.autoThresholdSlider.addEventListener('input', function() {
            waterpumpState.autoThreshold = parseInt(this.value);
            if (elements.thresholdValueElement) elements.thresholdValueElement.textContent = `${waterpumpState.autoThreshold}%`;
            saveWaterPumpState();
            showToast(`Auto-irrigation threshold set to ${waterpumpState.autoThreshold}%`, 'info');
        });
    }
    
    // Cover toggle
    if (elements.toggleCoverButton) {
        elements.toggleCoverButton.addEventListener('click', function() {
            greenhouseState.coverOpen = !greenhouseState.coverOpen;
            updateCoverDisplay();
            
            const action = greenhouseState.coverOpen ? 'opened' : 'closed';
            addLogEntry(`Greenhouse cover ${action}`, 'CLIMATE');
            showToast(`Greenhouse cover ${action}`, 'success');
        });
    }
    
    // Chart buttons
    if (elements.chartButtons && elements.chartButtons.length > 0) {
        elements.chartButtons.forEach(button => {
            button.addEventListener('click', () => {
                elements.chartButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentChartType = button.dataset.chart;
                updateChartVisibility();
            });
        });
    }
    
    // Log mode buttons
    if (elements.logModeButtons && elements.logModeButtons.length > 0) {
        elements.logModeButtons.forEach(button => {
            button.addEventListener('click', () => {
                elements.logModeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                filterLogs(button.dataset.mode);
            });
        });
    }
    
    // Save preset button
    if (elements.savePresetBtn) {
        elements.savePresetBtn.addEventListener('click', function() {
            if (currentSettings.selectedPlant === 'custom') {
                plantPresets.custom = {
                    name: "Custom",
                    temperature: elements.tempTargetSlider ? parseFloat(elements.tempTargetSlider.value) : 24,
                    humidity: elements.humidityTargetSlider ? parseFloat(elements.humidityTargetSlider.value) : 65,
                    light: elements.lightTargetSlider ? parseFloat(elements.lightTargetSlider.value) : 850,
                    soil: elements.soilTargetSlider ? parseFloat(elements.soilTargetSlider.value) : 70,
                    description: "Custom settings saved by user"
                };
                localStorage.setItem('customPreset', JSON.stringify(plantPresets.custom));
                showToast('Custom settings saved', 'success');
            } else {
                showToast('Select "Custom" to save your own preset', 'warning');
            }
        });
    }
    
    // Apply targets button
    if (elements.applyTargetsBtn) {
        elements.applyTargetsBtn.addEventListener('click', function() {
            const temp = elements.tempTargetSlider ? parseFloat(elements.tempTargetSlider.value) : 24;
            const humidity = elements.humidityTargetSlider ? parseFloat(elements.humidityTargetSlider.value) : 65;
            const light = elements.lightTargetSlider ? parseFloat(elements.lightTargetSlider.value) : 850;
            const soil = elements.soilTargetSlider ? parseFloat(elements.soilTargetSlider.value) : 70;
            
            addLogEntry(`Targets applied: Temp: ${temp}°C, Humidity: ${humidity}%, Light: ${light} lux, Soil: ${soil}%`, 'CLIMATE');
            showToast('Target settings applied', 'success');
        });
    }
    
    // Reset targets button
    if (elements.resetTargetsBtn) {
        elements.resetTargetsBtn.addEventListener('click', function() {
            applyPlantPreset(currentSettings.selectedPlant);
            showToast('Targets reset to plant defaults', 'info');
        });
    }
    
    // Log buttons
    if (elements.refreshLogsBtn) {
        elements.refreshLogsBtn.addEventListener('click', refreshLogs);
    }
    
    if (elements.addLogBtn) {
        elements.addLogBtn.addEventListener('click', addManualLog);
    }
    
    if (elements.exportLogsBtn) {
        elements.exportLogsBtn.addEventListener('click', exportLogsToCSV);
    }
    
    // Setup target sliders
    setupTargetSliders();
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

// =================== LOG SYSTEM ===================
function addInitialLogs() {
    if (elements.logsList && elements.logsList.children.length === 0) {
        const initialLogs = [
            {message: 'System initialized successfully', type: 'SYSTEM'},
            {message: 'Greenhouse sensors calibrated', type: 'SYSTEM'},
            {message: 'All systems operational', type: 'SYSTEM'},
            {message: 'Temperature control active', type: 'CLIMATE'},
            {message: 'Irrigation system ready', type: 'IRRIGATION'}
        ];
        
        initialLogs.forEach(log => {
            addLogEntry(log.message, log.type);
        });
    }
}

function addLogEntry(message, type = 'SYSTEM', customTime = null) {
    const now = new Date();
    const timeString = customTime || now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    const newLog = document.createElement('div');
    newLog.className = `log-entry ${type.toLowerCase()}`;
    newLog.innerHTML = `
        <div class="log-time">${timeString}</div>
        <div class="log-message">${message}</div>
        <div class="log-type">${type}</div>
    `;
    
    if (elements.logsList) {
        elements.logsList.prepend(newLog);
        
        const allLogs = elements.logsList.querySelectorAll('.log-entry');
        if (allLogs.length > 20) {
            elements.logsList.removeChild(allLogs[allLogs.length - 1]);
        }
    }
    
    saveLogToLocalStorage({time: timeString, message, type});
}

function addAlertLog(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    addLogEntry(message, 'ALERT', timeString);
    showToast(`⚠️ ${message}`, 'warning');
    playAlertSound();
}

function playAlertSound() {
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

function filterLogs(mode) {
    const logEntries = document.querySelectorAll('.log-entry');
    logEntries.forEach(entry => {
        if (mode === 'all') {
            entry.style.display = 'flex';
        } else if (mode === 'alerts') {
            const typeElement = entry.querySelector('.log-type');
            if (typeElement && typeElement.textContent === 'ALERT') {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        } else {
            const typeElement = entry.querySelector('.log-type');
            if (typeElement && typeElement.textContent.toLowerCase() === mode.toUpperCase()) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        }
    });
}

function refreshLogs() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    
    addLogEntry(`Logs manually refreshed at ${timeString}`, 'SYSTEM');
    showToast('Logs refreshed', 'info');
}

function addManualLog() {
    const noteText = prompt('Enter your note/message:');
    
    if (noteText && noteText.trim()) {
        const noteTypes = ['CLIMATE', 'OBSERVATION', 'PLANT_CARE', 'MAINTENANCE'];
        const selectedType = noteTypes[Math.floor(Math.random() * noteTypes.length)];
        
        addLogEntry(noteText, selectedType);
        showToast('Note added successfully', 'success');
    } else {
        showToast('Note cannot be empty', 'warning');
    }
}

function exportLogsToCSV() {
    const logEntries = elements.logsList ? elements.logsList.querySelectorAll('.log-entry') : [];
    
    if (logEntries.length === 0) {
        showToast('No logs to export', 'warning');
        return;
    }
    
    let csvContent = "Time,Message,Type\n";
    
    logEntries.forEach((entry) => {
        const time = entry.querySelector('.log-time').textContent;
        const message = entry.querySelector('.log-message').textContent.replace(/"/g, '""');
        const type = entry.querySelector('.log-type').textContent;
        
        csvContent += `"${time}","${message}","${type}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenhouse_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast(`Exported ${logEntries.length} logs`, 'success');
}

function saveLogToLocalStorage(log) {
    try {
        const logs = JSON.parse(localStorage.getItem('greenhouseLogs') || '[]');
        logs.unshift(log);
        if (logs.length > 100) logs.pop();
        localStorage.setItem('greenhouseLogs', JSON.stringify(logs));
    } catch (error) {
        console.error('Failed to save log to localStorage:', error);
    }
}

// =================== SETTINGS MANAGEMENT ===================
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
        
        // Update UI
        updatePlantSelectionUI();
        updateTargetSlidersFromSettings();
    }
    
    // Load custom preset
    const savedCustomPreset = localStorage.getItem('customPreset');
    if (savedCustomPreset) plantPresets.custom = JSON.parse(savedCustomPreset);
}

function updatePlantSelectionUI() {
    if (!elements.plantOptions) return;
    
    elements.plantOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.plant === currentSettings.selectedPlant) {
            option.classList.add('active');
        }
    });
    
    updatePlantDisplay(currentSettings.selectedPlant);
}

function updateTargetSlidersFromSettings() {
    if (elements.tempTargetSlider) elements.tempTargetSlider.value = currentSettings.targets.temperature;
    if (elements.humidityTargetSlider) elements.humidityTargetSlider.value = currentSettings.targets.humidity;
    if (elements.lightTargetSlider) elements.lightTargetSlider.value = currentSettings.targets.light;
    if (elements.soilTargetSlider) elements.soilTargetSlider.value = currentSettings.targets.soil;
    
    updateTargetDisplays();
}

// =================== UTILITY FUNCTIONS ===================
function updateAllDisplays() {
    updateTimeDisplay();
    updateTimeOfDay();
    updateWaterPumpDisplay();
    updateCoverDisplay();
    updateCurrentValues();
    updateSoilMoistureDisplay();
    updateTimeOfDayDisplay();
    checkAllTargetStatuses();
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create new toast
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
    
    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
}

// =================== GLOBAL ACCESS ===================
window.debug = {
    updateAllDisplays,
    updateSensorReadings: () => updateSensorReadingsBasedOnTime(
        timeMode === 'real' ? 
        new Date().getHours() + new Date().getMinutes() / 60 : 
        currentSimulatedTime.getHours() + currentSimulatedTime.getMinutes() / 60
    ),
    startIrrigation,
    stopIrrigation,
    showToast,
    elements
};

console.log('🌿 Greenhouse System Loaded Successfully!');
console.log('Debug functions available at window.debug');