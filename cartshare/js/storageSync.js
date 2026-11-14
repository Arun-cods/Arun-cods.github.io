/**
 * CartShare - Storage and Cross-Tab Synchronization
 * Author: Gopagani Arun
 * 
 * Provides unified cross-tab real-time communication using BroadcastChannel
 * with a graceful fallback to localStorage window 'storage' events.
 */

const StorageSync = (() => {
  const CHANNEL_NAME = 'cartshare_collaborative_channel';
  let broadcastChannel = null;
  const subscribers = {};

  // Initialize BroadcastChannel if supported
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };
    } catch (err) {
      console.warn('BroadcastChannel initialization failed, using storage event fallback:', err);
    }
  }

  // Fallback: listen for localStorage change events (cross-tab)
  window.addEventListener('storage', (event) => {
    if (event.key === 'cartshare_sync_event' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        handleIncomingMessage(data);
      } catch (err) {
        console.error('Failed to parse storage sync event:', err);
      }
    }
  });

  function handleIncomingMessage(data) {
    if (!data || !data.type) return;
    const callbacks = subscribers[data.type] || [];
    callbacks.forEach(cb => {
      try {
        cb(data.payload, data.sender);
      } catch (e) {
        console.error(`Error in subscriber for ${data.type}:`, e);
      }
    });
  }

  return {
    /**
     * Broadcast an event to all other open tabs
     */
    publish: (type, payload) => {
      const message = {
        type,
        payload,
        sender: localStorage.getItem('cartshare_user') || 'Anonymous',
        timestamp: Date.now()
      };

      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }

      // Also trigger via storage key for multi-tab fallback
      try {
        localStorage.setItem('cartshare_sync_event', JSON.stringify(message));
      } catch (e) {
        // Handle storage quota issues gracefully
      }
    },

    /**
     * Subscribe to a specific event type
     */
    subscribe: (type, callback) => {
      if (!subscribers[type]) {
        subscribers[type] = [];
      }
      subscribers[type].push(callback);
    },

    /**
     * Safe JSON get from localStorage
     */
    getItem: (key, defaultValue = null) => {
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    },

    /**
     * Safe JSON set to localStorage
     */
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Error saving to localStorage [${key}]:`, e);
      }
    }
  };
})();
