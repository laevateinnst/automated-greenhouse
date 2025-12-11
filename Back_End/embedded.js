// js.js — Fixed & Integrated for your provided HTML
// ------------------------------------------------
// - Single initialization
// - LogManager + AlertSystem with correct routing
// - Works with your HTML (uses #logs-list and creates category containers)

/////////////////////// GLOBAL STATE ///////////////////////
let waterpumpState = {
  isActive: false,
  isManualMode: false,
  lastIrrigation: new Date(Date.now() - 2 * 60 * 60 * 1000),
  waterLevel: 85,
  irrigationDuration: 15,
  flowRate: 5,
  waterTemperature: 22,
  isAutoIrrigationEnabled: true,
  autoThreshold: 40
};

let sleepModeState = { isActive: false };

let currentSimulatedTime = new Date();
let timeSpeedMultiplier = 1;
let isTimePaused = false;
let timeMode = 'real';
let timeEffectsVisible = true;

const timeConfig = {
  sunrise: 6.5,
  sunset: 19.75,
  dawnStart: 5,
  dawnEnd: 7,
  morningEnd: 12,
  afternoonEnd: 17,
  duskEnd: 20
};

let environmentChart = null;

/////////////////////// LOG MANAGER ///////////////////////
class LogManager {
  constructor() {
    this.logsByCategory = { all: [], alerts: [], climate: [], irrigation: [], system: [] };
    this.maxPerCategory = 200;

    // main visible list element (the UI area)
    this.logsListElement = document.getElementById('logs-list');

    // If logs-list missing, create a fallback
    if (!this.logsListElement) {
      const fallback = document.createElement('div');
      fallback.id = 'logs-list';
      document.body.appendChild(fallback);
      this.logsListElement = fallback;
    }

    // create hidden per-category containers inside logs container parent
    this.ensureCategoryContainers();

    // wire log mode buttons
    this.setupLogFilteringButtons();

    // add a few initial logs
    this.addSystemLog('🌿 Greenhouse system started successfully');
    this.addSystemLog('👤 User logged in successfully');
  }

  ensureCategoryContainers() {
    // parent under which category containers will live
    const parent = this.logsListElement.parentElement || this.logsListElement;

    // create containers if not present
    ['all', 'alerts', 'climate', 'irrigation', 'system'].forEach(cat => {
      if (!document.getElementById(`logs-${cat}`)) {
        const container = document.createElement('div');
        container.id = `logs-${cat}`;
        container.className = 'category-logs-container';
        // keep these hidden; we will populate visible #logs-list from them
        container.style.display = 'none';
        parent.appendChild(container);
      }
    });

    // Also ensure we have a visible 'logs-all' master so "All" view is available
    // (Note: logs-list is visible UI area — we'll populate it from logs-all)
    if (!document.getElementById('logs-all')) {
      const allContainer = document.createElement('div');
      allContainer.id = 'logs-all';
      allContainer.className = 'category-logs-container';
      allContainer.style.display = 'none';
      parent.appendChild(allContainer);
    }

    // show default view (All)
    this.displayCategoryInMain('all');
  }

  setupLogFilteringButtons() {
    const buttons = document.querySelectorAll('.log-mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = (btn.dataset.mode || 'all').toLowerCase();
        this.displayCategoryInMain(mode);
      });
    });

    const refreshBtn = document.getElementById('refresh-logs');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
      const now = new Date();
      this.addSystemLog(`Logs refreshed at ${now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`);
      this.showToast('Logs refreshed', 'info');
    });

    const addLogBtn = document.getElementById('add-log');
    if (addLogBtn) addLogBtn.addEventListener('click', () => {
      const note = prompt('Enter note/message:');
      if (note && note.trim()) {
        this.addSystemLog(note.trim());
        this.showToast('Note added', 'success');
      }
    });
  }

  // core: always go into ALL + category
  addLog(message, type = 'INFO', category = 'SYSTEM') {
    const now = new Date();
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: now,
      timeString: now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      message,
      type,
      category: (category || 'SYSTEM').toUpperCase()
    };

    // push to memory
    this.logsByCategory.all.unshift(entry);

    const catKey = this.normalizeCategoryKey(category);
    if (!this.logsByCategory[catKey]) {
      this.logsByCategory.system.unshift(entry);
    } else {
      this.logsByCategory[catKey].unshift(entry);
    }

    // trim excess
    this.limitLogs();

    // write into DOM containers for filtering
    this.appendToCategoryDOM(entry);

    // refresh visible list (if currently viewing category affected)
    this.updateVisibleLogs();

    return entry;
  }

  // Helpers for common categories
  addAlertLog(message, severity = 'WARNING', specificCategory = 'ALERTS') {
    // Format: severity: message
    const formatted = `${severity.toUpperCase()}: ${message}`;
    // Add to ALL + ALERTS
    this.addLog(formatted, severity.toUpperCase(), 'ALERTS');

    // Mirror into specific category (CLIMATE/IRRIGATION/SYSTEM) so it shows there too
    const specificKey = this.normalizeCategoryKey(specificCategory);
    const mirror = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      timeString: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      message: formatted,
      type: severity.toUpperCase(),
      category: specificCategory.toUpperCase()
    };

    if (!this.logsByCategory[specificKey]) this.logsByCategory.system.unshift(mirror);
    else this.logsByCategory[specificKey].unshift(mirror);

    this.appendToCategoryDOM(mirror);
    this.limitLogs();
    this.updateVisibleLogs();
  }

  addSystemLog(message) { return this.addLog(message, 'INFO', 'SYSTEM'); }
  addClimateLog(message) { return this.addLog(message, 'INFO', 'CLIMATE'); }
  addIrrigationLog(message) { return this.addLog(message, 'INFO', 'IRRIGATION'); }

  normalizeCategoryKey(category) {
    if (!category) return 'system';
    const k = category.toString().toLowerCase();
    if (k === 'all') return 'all';
    if (k === 'alerts' || k === 'alert') return 'alerts';
    if (k === 'climate') return 'climate';
    if (k === 'irrigation') return 'irrigation';
    if (k === 'system') return 'system';
    return 'system';
  }

  limitLogs() {
    Object.keys(this.logsByCategory).forEach(cat => {
      if (this.logsByCategory[cat].length > this.maxPerCategory) {
        this.logsByCategory[cat] = this.logsByCategory[cat].slice(0, this.maxPerCategory);
      }
    });
  }

  // DOM: append a single entry into the category container
  appendToCategoryDOM(entry) {
    const catKey = this.normalizeCategoryKey(entry.category);
    const container = document.getElementById(`logs-${catKey}`) || document.getElementById('logs-all');

    if (!container) return;
    const el = this.createLogElement(entry);
    // prepend so newest on top
    container.insertBefore(el, container.firstChild);

    // ensure master 'logs-all' contains a clone (so All view shows everything)
    const allContainer = document.getElementById('logs-all');
    if (allContainer && catKey !== 'all') {
      const clone = el.cloneNode(true);
      allContainer.insertBefore(clone, allContainer.firstChild);
    }
  }

  createLogElement(entry) {
    const div = document.createElement('div');
    div.className = `log-item log-${entry.type.toLowerCase()}`;
    div.dataset.category = entry.category;
    div.dataset.type = entry.type;
    div.innerHTML = `
      <div class="log-time">${entry.timeString}</div>
      <div class="log-message">${entry.message}</div>
      <div class="log-type">${entry.type}</div>
    `;
    return div;
  }

  // Replace visible #logs-list contents with the chosen category container's children
  displayCategoryInMain(categoryKey) {
    const showKey = this.normalizeCategoryKey(categoryKey);
    const container = document.getElementById(`logs-${showKey}`);
    if (!container) {
      // fallback to 'logs-all'
      this.displayCategoryInMain('all');
      return;
    }

    // clear visible area
    this.logsListElement.innerHTML = '';

    // if container empty show message
    if (!container.children.length) {
      const noMsg = document.createElement('div');
      noMsg.className = 'no-logs-message';
      noMsg.textContent = `No ${showKey} logs available`;
      this.logsListElement.appendChild(noMsg);
      return;
    }

    // clone each child to visible area
    Array.from(container.children).forEach(child => {
      this.logsListElement.appendChild(child.cloneNode(true));
    });
  }

  updateVisibleLogs() {
    // find active mode button
    const active = document.querySelector('.log-mode-btn.active');
    const mode = active ? (active.dataset.mode || 'all').toLowerCase() : 'all';
    this.displayCategoryInMain(mode);
  }

  // Toasts
  showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span><button class="toast-close">&times;</button>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    const close = toast.querySelector('.toast-close');
    if (close) close.addEventListener('click', () => { toast.classList.remove('show'); setTimeout(()=>toast.remove(),300); });
    setTimeout(() => { toast.classList.remove('show'); setTimeout(()=>toast.remove(),300); }, type === 'error' ? 5000 : 3000);
  }
}

let logManager = null;

/////////////////////// ALERT SYSTEM ///////////////////////
class AlertSystem {
  constructor(logManagerRef) {
    this.logManager = logManagerRef;
    this.lastAlertTime = {};
    this.alertCooldown = 30 * 1000;
  }

  logAlert(severity, category, message, value = null, threshold = null) {
    let msg = message;
    if (value !== null) {
      msg += ` (Current: ${value}${threshold ? `, Threshold: ${threshold}` : ''})`;
    }

    const alertKey = `${category}:${severity}:${message}`;
    const now = Date.now();
    if (this.lastAlertTime[alertKey] && (now - this.lastAlertTime[alertKey] < this.alertCooldown)) {
      return; // suppress duplicates in cooldown
    }
    this.lastAlertTime[alertKey] = now;

    const catUpper = (category || '').toUpperCase();
    let specific = 'SYSTEM';
    if (['TEMPERATURE','HUMIDITY','LIGHT','TEMP','HUMID','CLIMATE'].includes(catUpper)) specific = 'CLIMATE';
    else if (['SOIL_MOISTURE','IRRIGATION','SOIL','WATER'].includes(catUpper)) specific = 'IRRIGATION';
    else specific = 'SYSTEM';

    // Add to ALL + ALERTS + specific
    this.logManager.addAlertLog(msg, severity.toUpperCase(), specific.toUpperCase());

    // toast
    const toastType = severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : severity === 'success' ? 'success' : 'info';
    this.logManager.showToast(`${category}: ${message}`, toastType);
    console.log(`ALERT ${severity.toUpperCase()} [${category}] ${msg}`);
  }

  checkTemperatureAlerts(currentTemp) {
    const t = parseFloat(currentTemp);
    if (isNaN(t)) return;
    if (t < 15) this.logAlert('error','TEMPERATURE','CRITICAL: Temperature dangerously low', `${t}°C`, '15°C');
    else if (t < 18) this.logAlert('warning','TEMPERATURE','Temperature below optimal range', `${t}°C`, '18°C');
    else if (t > 35) this.logAlert('error','TEMPERATURE','CRITICAL: Temperature dangerously high', `${t}°C`, '35°C');
    else if (t > 30) this.logAlert('warning','TEMPERATURE','Temperature above optimal range', `${t}°C`, '30°C');
  }

  checkHumidityAlerts(currentHumidity) {
    const h = parseFloat(currentHumidity);
    if (isNaN(h)) return;
    if (h < 30) this.logAlert('error','HUMIDITY','CRITICAL: Humidity critically low', `${h}%`, '30%');
    else if (h < 40) this.logAlert('warning','HUMIDITY','Humidity below optimal range', `${h}%`, '40%');
    else if (h > 90) this.logAlert('error','HUMIDITY','CRITICAL: Humidity critically high', `${h}%`, '90%');
    else if (h > 85) this.logAlert('warning','HUMIDITY','Humidity above optimal range', `${h}%`, '85%');
  }

  checkSoilMoistureAlerts(currentSoil) {
    const s = parseFloat(currentSoil);
    if (isNaN(s)) return;
    if (s < 30) this.logAlert('error','SOIL_MOISTURE','CRITICAL: Soil extremely dry', `${s.toFixed(1)}%`, '30%');
    else if (s < 40) this.logAlert('warning','SOIL_MOISTURE','Low soil moisture detected', `${s.toFixed(1)}%`, '40%');
    else if (s > 90) this.logAlert('error','SOIL_MOISTURE','CRITICAL: Soil oversaturated', `${s.toFixed(1)}%`, '90%');
    else if (s > 85) this.logAlert('warning','SOIL_MOISTURE','Soil moisture high', `${s.toFixed(1)}%`, '85%');
  }

  checkLightLevelAlerts(currentLight) {
    const l = parseFloat(currentLight);
    if (isNaN(l)) return;
    if (l < 50) this.logAlert('error','LIGHT','CRITICAL: Light level critically low', `${l} lux`, '50 lux');
    else if (l < 200) this.logAlert('warning','LIGHT','Light level below optimal', `${l} lux`, '200 lux');
    else if (l > 1600) this.logAlert('error','LIGHT','CRITICAL: Light level dangerously high', `${l} lux`, '1600 lux');
    else if (l > 1400) this.logAlert('warning','LIGHT','Light level above optimal', `${l} lux`, '1400 lux');
  }

  checkWaterPumpAlerts() {
    if (waterpumpState.waterLevel < 10) this.logAlert('error','IRRIGATION','CRITICAL: Water reservoir critically low', `${Math.round(waterpumpState.waterLevel)}%`, '10%');
    else if (waterpumpState.waterLevel < 30) this.logAlert('warning','IRRIGATION','Water reservoir low', `${Math.round(waterpumpState.waterLevel)}%`, '30%');

    const soilValue = parseFloat(document.getElementById('soil-value')?.textContent) || 0;
    if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode && !waterpumpState.isActive) {
      if (soilValue < waterpumpState.autoThreshold && waterpumpState.waterLevel > 20) {
        this.logAlert('info','IRRIGATION','Auto irrigation triggered', `${soilValue}%`, `${waterpumpState.autoThreshold}%`);
      }
    }
  }

  checkAllAlerts() {
    const t = parseFloat(document.getElementById('temperature-value')?.textContent) || NaN;
    const h = parseFloat(document.getElementById('humidity-value')?.textContent) || NaN;
    const s = parseFloat(document.getElementById('soil-value')?.textContent) || NaN;
    const l = parseFloat(document.getElementById('light-value')?.textContent) || NaN;
    this.checkTemperatureAlerts(t);
    this.checkHumidityAlerts(h);
    this.checkSoilMoistureAlerts(s);
    this.checkLightLevelAlerts(l);
    this.checkWaterPumpAlerts();
  }
}

let alertSystem = null;

/////////////////////// INITIALIZATION ///////////////////////
document.addEventListener('DOMContentLoaded', () => {
  logManager = new LogManager();
  alertSystem = new AlertSystem(logManager);

  // initialize UI & systems
  initializeDashboard();
  initializeTimeSystem();
  initializeWaterPumpSystem();
  initializePlantSelection();
  initializeChart();
  initializeEventListeners();

  // start periodic updates
  startTimeUpdates();
  startDataRefresh();

  logManager.addSystemLog('✅ System initialized successfully');
  console.log('✅ System initialized successfully');
});

/////////////////////// DASHBOARD / UI ///////////////////////
function initializeDashboard() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  updateTargetDisplays();
  updateAllDisplays();
}

function setTheme(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (theme === 'dark') {
    document.body.setAttribute('data-theme','dark');
    if (themeToggle) themeToggle.checked = true;
  } else {
    document.body.removeAttribute('data-theme');
    if (themeToggle) themeToggle.checked = false;
  }
  localStorage.setItem('theme', theme);
}

/////////////////////// TIME ///////////////////////
function initializeTimeSystem() {
  const savedEffects = localStorage.getItem('timeEffectsVisible');
  if (savedEffects !== null) timeEffectsVisible = savedEffects === 'true';
  updateTimeEffectsVisibility();
  setupTimeControls();
  updateTimeDisplay();
  updateTimeOfDay();
}
function startTimeUpdates() {
  setInterval(updateTimeDisplay, 1000);
  setInterval(updateTimeOfDay, 60000);
  setInterval(() => alertSystem && alertSystem.checkAllAlerts(), 30000);
  setInterval(() => {
    if (timeMode === 'simulated' && !isTimePaused) {
      advanceSimulatedTime();
      updateTimeDisplay();
      updateTimeOfDay();
    }
  }, 1000);
}
function updateTimeDisplay() {
  const el = document.getElementById('current-time');
  if (!el) return;
  const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
  el.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
}
function updateTimeOfDay() {
  const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (timeEffectsVisible) updateCelestialPositions(currentHour);
  updatePlantStateBasedOnTime(currentHour);
}
function updateCelestialPositions(currentHour) {
  const sun = document.getElementById('sun-element');
  const moon = document.getElementById('moon-element');
  if (!sun || !moon) return;
  const dayDuration = timeConfig.sunset - timeConfig.sunrise;
  let sunPos = 0;
  if (currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset) {
    sunPos = ((currentHour - timeConfig.sunrise) / dayDuration) * 100;
  } else if (currentHour > timeConfig.sunset) sunPos = 100;
  sun.style.left = `${sunPos}%`;
  sun.style.opacity = (currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset) ? '1' : '0';
  moon.style.left = `${(sunPos + 50) % 100}%`;
  moon.style.opacity = (currentHour < timeConfig.sunrise || currentHour > timeConfig.sunset) ? '1' : '0';
}
function updatePlantStateBasedOnTime(currentHour) {
  const text = document.getElementById('plant-state-text');
  const desc = document.getElementById('plant-state-desc');
  if (!text || !desc) return;
  if (currentHour >= timeConfig.dawnStart && currentHour < timeConfig.dawnEnd) {
    text.textContent = 'Photosynthesis Starting'; desc.textContent = 'Plants are waking up';
  } else if (currentHour >= timeConfig.dawnEnd && currentHour < timeConfig.morningEnd) {
    text.textContent = 'Photosynthesis Active'; desc.textContent = 'Maximum light absorption';
  } else if (currentHour >= timeConfig.morningEnd && currentHour < timeConfig.afternoonEnd) {
    text.textContent = 'Growth Peak'; desc.textContent = 'Optimal temperature';
  } else if (currentHour >= timeConfig.afternoonEnd && currentHour < timeConfig.duskEnd) {
    text.textContent = 'Metabolism Slowing'; desc.textContent = 'Preparing for night';
  } else { text.textContent = 'Respiration Active'; desc.textContent = 'Converting stored energy'; }
}

/////////////////////// PLANT PRESETS ///////////////////////
const plantPresets = {
  oregano: { name: "Oregano", temperature: 24, humidity: 50, light: 1200, soil: 60 },
  cilantro: { name: "Cilantro", temperature: 21, humidity: 70, light: 800, soil: 75 },
  tomato: { name: "Tomato", temperature: 25, humidity: 65, light: 1000, soil: 70 },
  chilipepper: { name: "Chili Pepper", temperature: 20, humidity: 75, light: 600, soil: 80 },
  custom: { name: "Custom", temperature: 24, humidity: 65, light: 850, soil: 70 }
};
let currentSettings = { selectedPlant: 'custom', targets: { ...plantPresets.custom } };

function initializePlantSelection() {
  const plantOptions = document.querySelectorAll('.plant-option');
  plantOptions.forEach(opt => {
    opt.addEventListener('click', function() {
      plantOptions.forEach(o => o.classList.remove('active'));
      this.classList.add('active');
      applyPlantPreset(this.dataset.plant);
    });
  });

  const saved = localStorage.getItem('plantCareSettings');
  if (saved) {
    const s = JSON.parse(saved);
    currentSettings.selectedPlant = s.selectedPlant || 'custom';
    currentSettings.targets = s.targets || { ...plantPresets.custom };
    applyPlantPreset(currentSettings.selectedPlant);
  }
}
function applyPlantPreset(plantType) {
  const preset = plantPresets[plantType] || plantPresets.custom;
  const sliders = { 'temp-target': preset.temperature, 'humidity-target': preset.humidity, 'light-target': preset.light, 'soil-target': preset.soil };
  Object.keys(sliders).forEach(id => { const el = document.getElementById(id); if (el) el.value = sliders[id]; });
  updateTargetDisplays();
  const display = document.getElementById('plant-name-display'); if (display) display.textContent = `${preset.name} Settings`;
  logManager.showToast(`${preset.name} preset applied`, 'success');
  logManager.addSystemLog(`${preset.name} plant preset applied`);
  currentSettings.selectedPlant = plantType;
  currentSettings.targets = { ...preset };
  localStorage.setItem('plantCareSettings', JSON.stringify({ selectedPlant: plantType, targets: preset }));
}
function updateTargetDisplays() {
  const t = document.getElementById('temp-target'), tv = document.getElementById('temp-target-value');
  if (t && tv) tv.textContent = `${t.value}°C`;
  const h = document.getElementById('humidity-target'), hv = document.getElementById('humidity-target-value'); if (h && hv) hv.textContent = `${h.value}%`;
  const l = document.getElementById('light-target'), lv = document.getElementById('light-target-value'); if (l && lv) lv.textContent = `${l.value} lux`;
  const s = document.getElementById('soil-target'), sv = document.getElementById('soil-target-value'); if (s && sv) sv.textContent = `${s.value}%`;
}

/////////////////////// SENSOR SIM & UPDATES ///////////////////////
function startDataRefresh() { setInterval(updateSensorReadings, 10000); updateSensorReadings(); }
function updateSensorReadings() {
  const now = timeMode === 'real' ? new Date() : currentSimulatedTime;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isDaytime = currentHour >= timeConfig.sunrise && currentHour <= timeConfig.sunset;

  const createAlert = Math.random() < 0.33;
  let tempValue, humidityValue, soilValue, lightValue;

  if (createAlert) {
    const alertType = Math.floor(Math.random() * 4);
    switch(alertType) {
      case 0:
        tempValue = Math.random() * 3 + 15;
        humidityValue = Math.random() * 20 + 60;
        soilValue = Math.random() * 20 + 60;
        lightValue = isDaytime ? Math.random() * 500 + 600 : Math.random() * 100 + 50;
        // Temperature => CLIMATE alert + ALL + ALERTS
        alertSystem.logAlert('warning','TEMPERATURE',`Low temperature detected: ${tempValue.toFixed(1)}°C`, `${tempValue.toFixed(1)}°C`, '18°C');
        break;
      case 1:
        tempValue = Math.random() * 6 + 22;
        humidityValue = Math.random() * 15 + 25;
        soilValue = Math.random() * 20 + 60;
        lightValue = isDaytime ? Math.random() * 500 + 600 : Math.random() * 100 + 50;
        alertSystem.logAlert('warning','HUMIDITY',`Low humidity detected: ${humidityValue.toFixed(0)}%`, `${humidityValue.toFixed(0)}%`, '40%');
        break;
      case 2:
        tempValue = Math.random() * 6 + 22;
        humidityValue = Math.random() * 20 + 60;
        soilValue = Math.random() * 10 + 30;
        lightValue = isDaytime ? Math.random() * 500 + 600 : Math.random() * 100 + 50;
        // Soil moisture => IRRIGATION alert + ALL + ALERTS
        alertSystem.logAlert('warning','SOIL_MOISTURE',`Low soil moisture: ${soilValue.toFixed(1)}%`, `${soilValue.toFixed(1)}%`, '40%');
        break;
      case 3:
        tempValue = Math.random() * 6 + 22;
        humidityValue = Math.random() * 20 + 60;
        soilValue = Math.random() * 20 + 60;
        lightValue = Math.random() * 100 + 50;
        alertSystem.logAlert('warning','LIGHT',`Low light level: ${Math.round(lightValue)} lux`, `${Math.round(lightValue)} lux`, '200 lux');
        break;
    }
  } else {
    tempValue = Math.random() * 6 + 22;
    humidityValue = Math.random() * 20 + 60;
    soilValue = Math.random() * 20 + 60;
    lightValue = isDaytime ? Math.random() * 500 + 600 : Math.random() * 100 + 50;
  }

  setSensorText('temperature-value', `${tempValue.toFixed(1)}°C`);
  setSensorText('humidity-value', `${Math.round(humidityValue)}%`);
  setSensorText('soil-value', `${soilValue.toFixed(1)}%`);
  setSensorText('light-value', `${Math.round(lightValue)} lux`);

  setSensorText('current-temp', `${tempValue.toFixed(1)}°C`);
  setSensorText('current-humidity', `${Math.round(humidityValue)}%`);
  setSensorText('current-soil', `${soilValue.toFixed(1)}%`);
  setSensorText('current-light', `${Math.round(lightValue)} lux`);

  updateStatusIndicators(tempValue, humidityValue, soilValue, lightValue);
  if (environmentChart) addChartData(tempValue, humidityValue, soilValue, lightValue);

  alertSystem.checkAllAlerts();
  updateSoilMoistureDisplay();
}
function setSensorText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function updateStatusIndicators(temp, humidity, soil, light) {
  const tempIndicator = document.querySelector('.temperature .status-indicator');
  const tempStatus = document.querySelector('.temperature .status-text');
  if (tempIndicator && tempStatus) {
    if (temp < 18 || temp > 30) { tempIndicator.className='status-indicator critical'; tempStatus.textContent = temp < 18 ? 'Too Cold' : 'Too Hot'; }
    else if (temp < 20 || temp > 28) { tempIndicator.className='status-indicator warning'; tempStatus.textContent = temp < 20 ? 'Cool' : 'Warm'; }
    else { tempIndicator.className='status-indicator optimal'; tempStatus.textContent='Optimal'; }
  }
  const humidityIndicator = document.querySelector('.humidity .status-indicator');
  const humidityStatus = document.querySelector('.humidity .status-text');
  if (humidityIndicator && humidityStatus) {
    if (humidity < 50 || humidity > 85) { humidityIndicator.className='status-indicator warning'; humidityStatus.textContent = humidity < 50 ? 'Low' : 'High'; }
    else { humidityIndicator.className='status-indicator optimal'; humidityStatus.textContent='Optimal'; }
  }
}

/////////////////////// PUMP / IRRIGATION ///////////////////////
function initializeWaterPumpSystem() {
  loadWaterPumpState(); updateWaterPumpDisplay(); startWaterLevelSimulation(); startAutoIrrigationMonitoring();
}
function loadWaterPumpState() {
  const saved = localStorage.getItem('waterPumpState'); if (!saved) return;
  try { const state = JSON.parse(saved); waterpumpState = {...waterpumpState, ...state, lastIrrigation: new Date(state.lastIrrigation)}; }
  catch (e) { console.warn('Failed to parse waterPumpState', e); }
}
function saveWaterPumpState() { const toSave = {...waterpumpState, lastIrrigation: waterpumpState.lastIrrigation.toISOString()}; localStorage.setItem('waterPumpState', JSON.stringify(toSave)); }
function updateWaterPumpDisplay() {
  const statusEl = document.getElementById('waterpump-status'); const indicator = document.getElementById('waterpump-state-indicator');
  const toggleBtn = document.getElementById('toggle-waterpump'); const manualBtn = document.getElementById('manual-mode-btn');
  const lastIrr = document.getElementById('last-irrigation'); const detail = document.getElementById('waterpump-detail');
  if (statusEl) statusEl.textContent = waterpumpState.isActive ? 'IRRIGATING' : 'READY';
  if (indicator) indicator.className = waterpumpState.isActive ? 'status-indicator warning' : 'status-indicator optimal';
  if (toggleBtn) toggleBtn.innerHTML = waterpumpState.isActive ? '<i class="fas fa-stop"></i> Stop' : '<i class="fas fa-play"></i> Start';
  if (manualBtn) manualBtn.classList.toggle('active', waterpumpState.isManualMode);
  if (lastIrr && detail) {
    const now = new Date(); const diff = now - waterpumpState.lastIrrigation; const hours = Math.floor(diff / (1000*60*60));
    if (waterpumpState.isActive) { detail.textContent='Currently irrigating'; lastIrr.textContent='Now'; }
    else if (hours>0) { detail.textContent='Auto irrigation active'; lastIrr.textContent=`${hours}h ago`; }
    else { detail.textContent='Auto irrigation active'; lastIrr.textContent='Just now'; }
  }
  updateSoilMoistureDisplay();
}
function startWaterLevelSimulation() { setInterval(()=>{ if(!waterpumpState.isActive) { if(waterpumpState.waterLevel>0) waterpumpState.waterLevel -= Math.random()*0.01; if(waterpumpState.waterLevel<50 && Math.random()<0.1){ waterpumpState.waterLevel += Math.random()*10; waterpumpState.waterLevel = Math.min(100, waterpumpState.waterLevel);} } },30000); }
function startAutoIrrigationMonitoring() {
  setInterval(()=> {
    if (waterpumpState.isAutoIrrigationEnabled && !waterpumpState.isManualMode && !waterpumpState.isActive) {
      const soil = parseFloat(document.getElementById('soil-value')?.textContent) || 0;
      if (soil < waterpumpState.autoThreshold && waterpumpState.waterLevel > 20) startIrrigation('auto');
    }
    if (waterpumpState.isActive) {
      const soil = parseFloat(document.getElementById('soil-value')?.textContent) || 0;
      if (soil > 70 || waterpumpState.waterLevel <= 5) stopIrrigation('auto');
    }
  },60000);
}
function startIrrigation(source='manual') {
  if (sleepModeState.isActive) { logManager.showToast('Cannot start irrigation: System is in sleep mode','error'); logManager.addIrrigationLog('Irrigation blocked: System is in sleep mode'); return; }
  if (waterpumpState.waterLevel < 10) { logManager.showToast('Water level too low!','error'); logManager.addIrrigationLog('Irrigation blocked: Water level too low'); return; }
  waterpumpState.isActive = true; waterpumpState.lastIrrigation = new Date(); saveWaterPumpState(); updateWaterPumpDisplay();
  // Start/Stop irrigation -> ALL + IRRIGATION only
  logManager.addIrrigationLog(`💧 Irrigation started (${source}) - Duration: ${waterpumpState.irrigationDuration}min`);
  logManager.showToast('Irrigation started','success');
}
function stopIrrigation(source='manual') {
  if (!waterpumpState.isActive) { logManager.addIrrigationLog(`💧 Irrigation stop requested (${source}) — pump already stopped`); return; }
  waterpumpState.isActive = false; saveWaterPumpState(); updateWaterPumpDisplay();
  logManager.addIrrigationLog(`💧 Irrigation stopped (${source})`); logManager.showToast('Irrigation stopped','info');
}
function updateSoilMoistureDisplay() {
  const soilEl = document.getElementById('soil-value'); const currentSoilPump = document.getElementById('current-soil-pump'); const soilFill = document.getElementById('soil-fill');
  const soilValue = parseFloat(soilEl?.textContent) || 0; if (currentSoilPump) currentSoilPump.textContent = `${soilValue.toFixed(1)}%`; if (soilFill) soilFill.style.width = `${soilValue}%`;
}

/////////////////////// CHARTS ///////////////////////
function initializeChart() {
  const canvas = document.getElementById('environment-chart'); if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const labels = Array.from({length:10},(_,i)=>{ const d=new Date(Date.now()-(9-i)*60000); return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});});
  environmentChart = new Chart(ctx, { type:'line', data:{ labels, datasets:[ {label:'Temperature (°C)', data:Array(10).fill(22), tension:0.3}, {label:'Humidity (%)', data:Array(10).fill(65), tension:0.3} ]}, options:{responsive:true, maintainAspectRatio:false} });
}
function addChartData(temp, hum, soil, light) {
  if (!environmentChart) return; const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  environmentChart.data.labels.shift(); environmentChart.data.labels.push(now);
  environmentChart.data.datasets[0].data.shift(); environmentChart.data.datasets[0].data.push(parseFloat(temp));
  environmentChart.data.datasets[1].data.shift(); environmentChart.data.datasets[1].data.push(parseFloat(hum));
  environmentChart.update();
}

/////////////////////// EVENTS ///////////////////////
function initializeEventListeners() {
  const themeToggle = document.getElementById('theme-toggle'); if (themeToggle) themeToggle.addEventListener('change', ()=>{ const theme = themeToggle.checked ? 'dark' : 'light'; setTheme(theme); logManager.addSystemLog(`Theme changed to ${theme}`); });
  const sleepToggle = document.getElementById('sleep-toggle-simple'); if (sleepToggle) sleepToggle.addEventListener('change', toggleSleepMode);
  const togglePump = document.getElementById('toggle-waterpump'); if (togglePump) togglePump.addEventListener('click', ()=>{ if (waterpumpState.isActive) stopIrrigation('manual'); else startIrrigation('manual'); });
  const manualBtn = document.getElementById('manual-mode-btn'); if (manualBtn) manualBtn.addEventListener('click', ()=>{ waterpumpState.isManualMode = !waterpumpState.isManualMode; waterpumpState.isAutoIrrigationEnabled = !waterpumpState.isManualMode; saveWaterPumpState(); updateWaterPumpDisplay(); const mode = waterpumpState.isManualMode ? 'ON' : 'OFF'; logManager.addIrrigationLog(`🔄 Manual irrigation mode ${mode}`); logManager.showToast(`Manual mode ${mode}`,'info'); });
  const autoSlider = document.getElementById('auto-threshold'); if (autoSlider) autoSlider.addEventListener('input', function(){ waterpumpState.autoThreshold = parseInt(this.value); const tv = document.getElementById('threshold-value'); if (tv) tv.textContent = `${waterpumpState.autoThreshold}%`; saveWaterPumpState(); logManager.addIrrigationLog(`📊 Auto-irrigation threshold set to ${waterpumpState.autoThreshold}%`); });
  const coverBtn = document.getElementById('toggle-cover'); if (coverBtn) coverBtn.addEventListener('click', ()=>{ if (sleepModeState.isActive) { logManager.showToast('Cannot adjust cover in sleep mode','warning'); return; } const coverStateEl = document.getElementById('cover-state'); if (!coverStateEl) return; const isOpen = coverStateEl.textContent === 'Open'; coverStateEl.textContent = isOpen ? 'Closed' : 'Open'; coverStateEl.style.color = isOpen ? '#8d6e63' : '#4caf50'; const action = isOpen ? 'closed' : 'opened'; logManager.addSystemLog(`🌤️ Greenhouse cover ${action}`); alertSystem.logAlert('success','COVER',`Greenhouse cover ${action}`); });
  const chartButtons = document.querySelectorAll('.chart-btn'); chartButtons.forEach(btn=>btn.addEventListener('click', ()=>{ chartButtons.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const chartType = btn.dataset.chart; logManager.addSystemLog(`Chart view changed to ${chartType}`); }));
  const savePreset = document.getElementById('save-preset'); if (savePreset) savePreset.addEventListener('click', ()=>{ const preset = { name:'Custom', temperature:parseFloat(document.getElementById('temp-target')?.value)||24, humidity:parseFloat(document.getElementById('humidity-target')?.value)||65, light:parseFloat(document.getElementById('light-target')?.value)||850, soil:parseFloat(document.getElementById('soil-target')?.value)||70 }; plantPresets.custom = preset; localStorage.setItem('customPreset', JSON.stringify(preset)); logManager.addSystemLog('Custom plant settings saved'); logManager.showToast('Custom settings saved','success'); });
  const applyTargets = document.getElementById('apply-targets'); if (applyTargets) applyTargets.addEventListener('click', ()=>{ logManager.addSystemLog('Target settings applied'); logManager.showToast('Target settings applied','success'); });
  const resetTargets = document.getElementById('reset-targets'); if (resetTargets) resetTargets.addEventListener('click', ()=>{ applyPlantPreset(currentSettings.selectedPlant||'custom'); logManager.addSystemLog('Targets reset to defaults'); logManager.showToast('Targets reset to defaults','info'); });

  // target sliders
  ['temp-target','humidity-target','light-target','soil-target'].forEach(id=>{
    const s=document.getElementById(id); if(!s) return;
    s.addEventListener('input', function(){
      const unit = (id==='temp-target')?'°C':(id==='light-target')?' lux':'%';
      const human = id==='temp-target'?'Temperature':id==='humidity-target'?'Humidity':id==='light-target'?'Light level':'Soil moisture';
      if (id==='soil-target') logManager.addIrrigationLog(`🎯 ${human} target set to ${this.value}${unit}`);
      else logManager.addClimateLog(`🎯 ${human} target set to ${this.value}${unit}`);
      updateTargetDisplays();
    });
  });
}

/////////////////////// SLEEP ///////////////////////
function toggleSleepMode() {
  if (sleepModeState.isActive) {
    sleepModeState.isActive = false; logManager.showToast('System woken up','success'); logManager.addSystemLog('Sleep mode deactivated'); alertSystem.logAlert('success','SLEEP','Sleep mode deactivated');
  } else {
    sleepModeState.isActive = true; if (waterpumpState.isActive) stopIrrigation('sleep'); logManager.showToast('Sleep mode activated','success'); logManager.addSystemLog('Sleep mode activated'); alertSystem.logAlert('success','SLEEP','Sleep mode activated');
  }
  const toggle = document.getElementById('sleep-toggle-simple'); if (toggle) toggle.checked = sleepModeState.isActive;
}

/////////////////////// UTIL ///////////////////////
function updateAllDisplays() { updateTimeDisplay(); updateTimeOfDay(); updateWaterPumpDisplay(); updateSoilMoistureDisplay(); updateTargetDisplays(); }

/////////////////////// TEST ///////////////////////
function testAlertSystem() {
  logManager.showToast('Test info','info'); logManager.showToast('Test success','success'); logManager.showToast('Test warning','warning'); logManager.showToast('Test error','error');
  logManager.addClimateLog('Test: Climate log'); logManager.addIrrigationLog('Test: Irrigation log'); logManager.addSystemLog('Test: System log');
  alertSystem.logAlert('error','TEMPERATURE','Test critical temperature alert','16°C','18°C');
  alertSystem.logAlert('warning','HUMIDITY','Test humidity warning','35%','40%');
  alertSystem.logAlert('info','IRRIGATION','Test irrigation info','35%','40%');
  alertSystem.logAlert('success','SYSTEM','Test system success');
}
window.testAlertSystem = testAlertSystem;

console.log('🌿 Fixed Greenhouse JS loaded');
