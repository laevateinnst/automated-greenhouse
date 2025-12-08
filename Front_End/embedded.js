
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
const updateTimeElement = document.getElementById('update-time');
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
    eggplant: {
        name: "Eggplant",
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Smart Plant Care System Initializing...');
    
    checkLoginStatus();
    
    initializeNewFeatures();
    
    initializeDashboard();
});

function checkLoginStatus() {
    const savedUser = localStorage.getItem('plantCareUser');
    if (savedUser) {
        currentSettings.user = savedUser;
        loggedUserElement.textContent = savedUser;
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
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        
        if (username && password) {
            const usernameValue = username.value;
            const passwordValue = password.value;
            
           
            if (usernameValue && passwordValue) {
                currentSettings.user = usernameValue;
                currentSettings.lastLogin = new Date();
                
                
                localStorage.setItem('plantCareUser', usernameValue);
                localStorage.setItem('lastLogin', currentSettings.lastLogin);
                
                if (loggedUserElement) loggedUserElement.textContent = usernameValue;
                showDashboard();
                
                showToast(`Welcome back, ${usernameValue}!`, 'success');
                
                
                username.value = '';
                password.value = '';
            } else {
                showToast('Please enter both username and password', 'error');
            }
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
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
        
        showLogin();
        showToast('Successfully logged out', 'success');
    });
}


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
    
    updateLastUpdated();
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
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    currentTimeElement.textContent = timeString;
}

function updateLastUpdated() {
    if (!updateTimeElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    updateTimeElement.textContent = timeString;
}

function updateSensorReadings() {
    const time = new Date().getHours();
    const isDaytime = time >= 6 && time <= 20;
    
    let tempValue;
    if (isDaytime) {
        tempValue = greenhouseState.coverOpen ? 
            (Math.random() * 6 + 22) : 
            (Math.random() * 4 + 24);  
    } else {
        tempValue = greenhouseState.coverOpen ?
            (Math.random() * 4 + 18) :
            (Math.random() * 3 + 20);  
    }
    
    let humidityValue = greenhouseState.coverOpen ?
        (Math.random() * 20 + 55) : 
        (Math.random() * 15 + 70);  
    let soilValue = soilValueElement ? parseFloat(soilValueElement.textContent) || 72 : 72;
    soilValue -= Math.random() * 0.5; 
    if (soilValue < 30) soilValue = 70; 
    
    let lightValue;
    if (isDaytime) {
        lightValue = greenhouseState.coverOpen ?
            Math.floor(Math.random() * 400 + 800) : 
            Math.floor(Math.random() * 200 + 400);  
    } else {
        lightValue = greenhouseState.lightsOn ?
            Math.floor(Math.random() * 100 + 50) :  
            Math.floor(Math.random() * 10);        
    }
    
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
        const time = new Date().getHours();
        const isDaytime = time >= 6 && time <= 20;
        
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
            updateLastUpdated();
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
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon;
    switch(type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        case 'error': icon = 'fa-times-circle'; break;
        default: icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

function initializeNewFeatures() {
    console.log('Initializing new features...');
    
    setupTargetSliders();
    initializePlantSelection();
    updateCurrentValues();
    checkAllTargetStatuses();
    
    if (!document.querySelector('#toast-animations')) {
        const toastStyle = document.createElement('style');
        toastStyle.id = 'toast-animations';
        toastStyle.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(toastStyle);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const root = document.documentElement;
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    }
});