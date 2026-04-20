import React, { useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function NotificationManager() {
  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        console.log('FCM Token:', token);
        // Register token with backend
        try {
          const isAdmin = window.location.pathname.startsWith('/admin') || 
                          !['/login', '/dashboard', '/register', '/invite'].some(p => window.location.pathname.startsWith(p));
          
          await fetch(isAdmin ? '/api/auth/fcm-token' : '/api/public/fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
        } catch (e) {
          console.error('Failed to register FCM token with backend', e);
        }
      }
    };

    setupNotifications();

    onMessageListener().then((payload: any) => {
      console.log('Message received in foreground:', payload);
      toast(payload.notification.body, {
        icon: '🔔',
        duration: 6000
      });
    });
  }, []);

  return null;
}
