
const API_BASE_URL = window.location.origin;


let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;


function isAuthenticated() {
    return !!authToken && !!currentUser;
}

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    return headers;
}

async function handleUnauthorized() {
    console.log('Session expired or unauthorized');
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('plantCareUser');

    showLogin();
    showToast('Session expired. Please login again.', 'warning');
}


async function apiRequest(endpoint, method = 'GET', data = null, requireAuth = true) {
    const url = API_BASE_URL + endpoint;

    if (requireAuth && !isAuthenticated()) throw new Error('Authentication required');

    const options = { method, headers: getAuthHeaders() };
    if (data && ['POST','PUT','PATCH'].includes(method)) options.body = JSON.stringify(data);

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            await handleUnauthorized();
            throw new Error('Unauthorized access');
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `API Error: ${response.status}`);

        return result;
    } catch (error) {
        console.error('API Request Failed:', error.message);
        if (!error.message.includes('Unauthorized')) showToast(`API Error: ${error.message}`, 'error');
        throw error;
    }
}


async function login(username, password) {
    try {
        const result = await apiRequest('/api/login', 'POST', { username, password }, false);

        if (result.success) {
            authToken = result.token;
            currentUser = result.user;

            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('plantCareUser', currentUser.name);

            console.log('Login successful:', currentUser.name);
            showDashboard();
            await initializeDashboardFromDB();
            startAutoRefresh();
        }

        return result;
    } catch (error) {
        console.error('Login failed:', error);
        throw new Error('Invalid username or password');
    }
}

async function logout() {
    if (!isAuthenticated()) return;
    try { await apiRequest('/api/logout', 'POST'); } catch (e) { console.error(e); }
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('plantCareUser');
    showLogin();
    stopAutoRefresh();
    console.log('Logged out successfully');
}


async function getCurrentData() {
    try {
        const result = await apiRequest('/api/data/current', 'GET', null, false);
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Failed to get current data:', error);
        return null;
    }
}

async function getDeviceStatus() {
    try {
        const result = await apiRequest('/api/devices/status', 'GET', null, false);
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Failed to get device status:', error);
        return null;
    }
}

async function getUserTargets() {
    try {
        const result = await apiRequest('/api/targets', 'GET', null, false);
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Failed to get targets:', error);
        return null;
    }
}

async function getSystemLogs(type = 'all', limit = 20) {
    try {
        const result = await apiRequest(`/api/logs?type=${type}&limit=${limit}`, 'GET', null, false);
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Failed to get logs:', error);
        return [];
    }
}


async function displayCurrentData() {
    try {
        const data = await getCurrentData();
        if (!data) return false;

        updateElementText('temperature-value', `${data.temperature.toFixed(1)}°C`);
        updateElementText('humidity-value', `${data.humidity.toFixed(0)}%`);
        updateElementText('soil-value', `${data.soilMoisture.toFixed(1)}%`);
        updateElementText('light-value', `${data.lightLevel.toFixed(0)} lux`);

        updateCurrentValuesDisplay(data);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function updateCurrentValuesDisplay(data) {
    updateElementText('current-temp', `${data.temperature.toFixed(1)}°C`);
    updateElementText('current-humidity', `${data.humidity.toFixed(0)}%`);
    updateElementText('current-light', `${data.lightLevel.toFixed(0)} lux`);
    updateElementText('current-soil', `${data.soilMoisture.toFixed(1)}%`);
}

async function displayDeviceStatus() {
    try {
        const devices = await getDeviceStatus();
        if (!devices) return false;

        updateElementText('waterpump-status', devices.pumpStatus);
        const coverState = document.querySelector('.cover-state');
        if (coverState) coverState.textContent = devices.coverStatus;

        return true;
    } catch (error) { console.error(error); return false; }
}

async function displayUserTargets() {
    try {
        const targets = await getUserTargets();
        if (!targets) return false;

        updateTargetSlider('temp-target', targets.temperature, 'temp-target-value', `${targets.temperature}°C`);
        updateTargetSlider('humidity-target', targets.humidity, 'humidity-target-value', `${targets.humidity}%`);
        updateTargetSlider('light-target', targets.light, 'light-target-value', `${targets.light} lux`);
        updateTargetSlider('soil-target', targets.soil, 'soil-target-value', `${targets.soil}%`);

        if (targets.plantType) {
            const plantType = targets.plantType.toLowerCase();
            updateElementText('plant-name-display', `${targets.plantType} Settings`);
            updateElementText('current-plant-type', targets.plantType);
            updatePlantSelection(plantType);
        }

        return true;
    } catch (error) { console.error(error); return false; }
}

function updateTargetSlider(sliderId, value, displayId, displayText) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    if (slider) slider.value = value;
    if (display) display.textContent = displayText;
}

function updatePlantSelection(selectedPlant) {
    document.querySelectorAll('.plant-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.plant === selectedPlant) option.classList.add('active');
    });
}


async function initializeDashboardFromDB() {
    await Promise.all([
        displayCurrentData(),
        displayDeviceStatus(),
        displayUserTargets()
    ]);
}


let refreshInterval = null;
function startAutoRefresh(interval = 10000) {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(displayCurrentData, interval);
}

function stopAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = null;
}


function checkApiSession() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
        return true;
    }
    return false;
}

function clearSession() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('plantCareUser');
}


function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('main-container').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
}


window.greenhouseAPI = {
    login,
    logout,
    isAuthenticated,
    getCurrentData,
    getDeviceStatus,
    getUserTargets,
    displayCurrentData,
    displayDeviceStatus,
    displayUserTargets,
    initializeDashboardFromDB,
    startAutoRefresh,
    stopAutoRefresh,
    checkApiSession,
    showToast
};


document.addEventListener('DOMContentLoaded', async () => {
    if (window.greenhouseAPI.checkApiSession()) {
        await initializeDashboardFromDB();
        startAutoRefresh();
    } else {
        showLogin();
    }
});
