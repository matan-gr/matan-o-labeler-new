
import { useState, useCallback } from 'react';
import { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    
    setNotifications(prev => {
      // Flood protection: Keep maximum 5 notifications
      const next = [...prev, { id, message, type }];
      if (next.length > 5) {
        return next.slice(next.length - 5);
      }
      return next;
    });
    
    // Auto dismiss based on type
    const duration = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification
  };
};
