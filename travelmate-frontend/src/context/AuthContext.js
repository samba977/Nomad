import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('travelmateUser');
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed;
    } catch (err) {
      console.error('❌ Failed to parse saved user:', err);
      return null;
    }
  });

  // ✅ Normalized login
  const login = async (data) => {
    const id = data._id || data.id;

    const userData = {
      ...data,
      id,     // always have .id for frontend
      _id: id // always have ._id for backend (MongoDB)
    };

    if (!id) {
      console.warn('⚠️ login() called without _id or id in data:', data);
    }

    localStorage.setItem('travelmateUser', JSON.stringify(userData));
    setUser(userData);

    // ✅ Optional: Update user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await fetch(`http://localhost:5000/api/users/location/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userData.token || ''}`,
              },
              body: JSON.stringify({ latitude, longitude }),
            });
          } catch (error) {
            console.error('🌐 Error updating location:', error);
          }
        },
        (error) => console.error('📍 Location access denied:', error)
      );
    }
  };

  // ✅ Logout
  const logout = () => {
    console.log("👤 Logging out user:", user);
    localStorage.removeItem('travelmateUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => useContext(AuthContext);
