// Test if an IP is reachable
const testConnection = async (ip, timeout = 3000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(`http://${ip}:3001/api/stylists`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
};

// ─── UPDATE THIS with your current WiFi IPv4 (run `ipconfig`) ───
const CANDIDATE_IPS = [
  '10.163.27.31',   // current WiFi IP (from Expo output)
  '10.163.27.90',   // previous WiFi IP
  '192.168.137.1',  // Windows mobile hotspot
  '192.168.43.1',   // Android hotspot
  '192.168.1.1',
  '192.168.0.1',
  '10.0.0.1',
];

let API_BASE_URL = `http://10.163.27.31:3001`;

// Single promise — detection runs once
let detectionPromise = null;

const detectWorkingIP = () => {
  if (detectionPromise) return detectionPromise;

  detectionPromise = (async () => {
    console.log('🔍 Detecting API server...');
    for (const ip of CANDIDATE_IPS) {
      console.log(`  Testing ${ip}...`);
      if (await testConnection(ip)) {
        API_BASE_URL = `http://${ip}:3001`;
        console.log(`✅ API server found: ${API_BASE_URL}`);
        return API_BASE_URL;
      }
    }
    console.warn('⚠️ No server found, using default:', API_BASE_URL);
    return API_BASE_URL;
  })();

  return detectionPromise;
};

// Start detection immediately on import
detectWorkingIP();

// Sync getter — returns whatever is currently set
export const getApiUrl = () => API_BASE_URL;

// Async getter — waits for detection to finish
export const getApiUrlAsync = () => detectWorkingIP();

export const setApiUrl = (url) => {
  API_BASE_URL = url;
  console.log('🔧 API URL set to:', API_BASE_URL);
};

export const refreshApiUrl = async () => {
  detectionPromise = null; // reset so it re-runs
  return detectWorkingIP();
};

export default API_BASE_URL;
