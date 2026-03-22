import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for user token and info
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // In a pure LocalStorage app without a backend database,
    // "login" just checks if the user exists in LocalStorage.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.email === email && parsedUser.password === password) {
        setUser(parsedUser);
        return parsedUser;
      }
      throw new Error('Invalid credentials. Note: This app only uses your current browser\'s local storage.');
    } else {
      throw new Error('No account found in local storage. Please sign up first.');
    }
  };

  const register = async (username, email, password) => {
    // Generate a unique ID for the user
    const _id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const tempToken = 'local-token-' + _id;
    
    const userData = { _id, username, email, password, token: tempToken };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
