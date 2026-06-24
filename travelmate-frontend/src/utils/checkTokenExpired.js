// src/utils/checkTokenExpired.js
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const base64 = token.split('.')[1];
    const decoded = JSON.parse(atob(base64));
    const expiry = decoded.exp * 1000; // convert to ms
    return Date.now() > expiry;
  } catch (err) {
    console.error("Token decode failed", err);
    return true;
  }
};
