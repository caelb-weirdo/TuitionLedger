const DEVICE_KEY = 'tuitionledger_device_token';

export function getDeviceToken() {
  let token = localStorage.getItem(DEVICE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, token);
  }
  return token;
}

export function clearDeviceToken() {
  localStorage.removeItem(DEVICE_KEY);
}

export function getDeviceInfo() {
  return {
    device_name: `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} Browser`,
    browser_info: navigator.userAgent,
  };
}
