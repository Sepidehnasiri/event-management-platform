import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eventhub-favorites')) || [];
    } catch { return []; }
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem('eventhub-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (eventId) => {
    setFavorites(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const isFavorite = (eventId) => favorites.includes(eventId);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <UserContext.Provider value={{ favorites, toggleFavorite, isFavorite, notification, showNotification }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
