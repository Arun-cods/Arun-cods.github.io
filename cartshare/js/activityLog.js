/**
 * CartShare - Real-Time Activity Log
 * Author: Gopagani Arun
 * 
 * Manages timestamped records of all actions taken in the room,
 * with real-time synchronization across connected tabs.
 */

const ActivityLog = (() => {
  const LOG_PREFIX = 'cartshare_log_';
  const MAX_LOGS = 50;

  function getLogKey(roomCode) {
    return roomCode ? `${LOG_PREFIX}${roomCode}` : null;
  }

  function getLogs(roomCode) {
    const key = getLogKey(roomCode);
    if (!key) return [];
    return StorageSync.getItem(key, []);
  }

  function saveLogs(roomCode, logs) {
    const key = getLogKey(roomCode);
    if (!key) return;
    // Keep only latest MAX_LOGS entries
    const trimmed = logs.slice(-MAX_LOGS);
    StorageSync.setItem(key, trimmed);
  }

  function render(logs) {
    const container = document.getElementById('activity-log-list');
    if (!container) return;

    if (!logs || logs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted small">
          <i class="bi bi-chat-left-text d-block mb-1"></i>
          No activity recorded yet.
        </div>
      `;
      return;
    }

    container.innerHTML = logs.map(entry => {
      let icon = 'bi-info-circle';
      let borderClass = 'log-room';
      let badgeClass = 'bg-primary-subtle text-primary';

      if (entry.type === 'add') {
        icon = 'bi-plus-circle-fill text-success';
        borderClass = 'log-add';
        badgeClass = 'bg-success-subtle text-success';
      } else if (entry.type === 'remove') {
        icon = 'bi-trash-fill text-danger';
        borderClass = 'log-remove';
        badgeClass = 'bg-danger-subtle text-danger';
      } else if (entry.type === 'join') {
        icon = 'bi-person-check-fill text-primary';
        borderClass = 'log-room';
        badgeClass = 'bg-primary-subtle text-primary';
      }

      return `
        <div class="list-group-item log-entry ${borderClass}">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge ${badgeClass} small">
              <i class="bi ${icon} me-1"></i>${escapeHtml(entry.user)}
            </span>
            <span class="log-time">${entry.time}</span>
          </div>
          <div class="text-dark">${escapeHtml(entry.message)}</div>
        </div>
      `;
    }).reverse().join(''); // Show latest at the top
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Subscribe to real-time log events
  StorageSync.subscribe('log_activity', (payload) => {
    const currentRoom = RoomManager.getCurrentRoom();
    if (payload && payload.roomCode === currentRoom) {
      const logs = getLogs(currentRoom);
      logs.push(payload.entry);
      saveLogs(currentRoom, logs);
      render(logs);
    }
  });

  return {
    load: (roomCode) => {
      const logs = getLogs(roomCode);
      render(logs);
    },

    add: (roomCode, type, message) => {
      if (!roomCode) return;
      const user = localStorage.getItem('cartshare_user') || 'Anonymous';
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const entry = { type, user, message, time, timestamp: now.getTime() };
      const logs = getLogs(roomCode);
      logs.push(entry);
      saveLogs(roomCode, logs);
      render(logs);

      // Broadcast to other tabs
      StorageSync.publish('log_activity', { roomCode, entry });
    }
  };
})();
