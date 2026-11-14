/**
 * CartShare - Room Management & User Authentication
 * Author: Gopagani Arun
 * 
 * Handles user login, unique 6-character room generation, joining via code/URL hash,
 * link sharing, and session persistence.
 */

const RoomManager = (() => {
  const STORAGE_ROOM = 'cartshare_room';
  const STORAGE_USER = 'cartshare_user';

  let currentRoom = null;
  let currentUser = null;

  /**
   * Generate random 6-character alphanumeric code (uppercase letters and digits)
   */
  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars (0, O, 1, I)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function validateRoomCode(code) {
    return /^[A-Z0-9]{6}$/.test(code);
  }

  function enterRoom(roomCode, userName) {
    currentRoom = roomCode.toUpperCase();
    currentUser = userName.trim();

    // Persist session
    localStorage.setItem(STORAGE_ROOM, currentRoom);
    localStorage.setItem(STORAGE_USER, currentUser);

    // Update URL hash for easy sharing (e.g. #ABC123)
    window.location.hash = currentRoom;

    // Update UI Elements
    document.getElementById('active-room-display').textContent = currentRoom;
    document.getElementById('active-user-display').textContent = currentUser;
    document.getElementById('active-avatar-initial').textContent = currentUser.charAt(0).toUpperCase();

    const navInfo = document.getElementById('nav-user-info');
    if (navInfo) {
      navInfo.style.removeProperty('display');
      document.getElementById('nav-user-name').textContent = currentUser;
    }

    // Toggle view sections
    document.getElementById('access-section').style.display = 'none';
    document.getElementById('room-dashboard').style.display = 'block';

    // Initialize Cart and Activity Log for this room
    CartManager.init(currentRoom);
    ActivityLog.load(currentRoom);

    // Record and broadcast join event
    ActivityLog.add(currentRoom, 'join', `joined room ${currentRoom}`);
  }

  function leaveRoom() {
    // Clear room state (keep user name for convenience)
    localStorage.removeItem(STORAGE_ROOM);
    window.location.hash = '';
    currentRoom = null;

    // Toggle view back
    document.getElementById('access-section').style.display = 'block';
    document.getElementById('room-dashboard').style.display = 'none';

    const navInfo = document.getElementById('nav-user-info');
    if (navInfo) {
      navInfo.style.display = 'none';
    }
  }

  function copyRoomCodeOrLink() {
    if (!currentRoom) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#${currentRoom}`;
    const copyBtnText = document.getElementById('copy-btn-text');

    navigator.clipboard.writeText(shareUrl).then(() => {
      if (copyBtnText) {
        const originalText = copyBtnText.textContent;
        copyBtnText.textContent = 'Copied Link!';
        setTimeout(() => {
          copyBtnText.textContent = originalText;
        }, 2000);
      }
    }).catch(() => {
      // Fallback: copy just code
      navigator.clipboard.writeText(currentRoom).then(() => {
        if (copyBtnText) copyBtnText.textContent = 'Copied Code!';
      });
    });
  }

  function init() {
    // Restore user name if previously saved
    const savedUser = localStorage.getItem(STORAGE_USER);
    if (savedUser) {
      const userInput = document.getElementById('user-name-input');
      if (userInput) userInput.value = savedUser;
    }

    // Event: Create Room
    document.getElementById('btn-create-room').addEventListener('click', () => {
      const userInput = document.getElementById('user-name-input');
      const name = userInput.value.trim();

      if (!name) {
        alert('Please enter your name before creating a room.');
        userInput.focus();
        return;
      }

      const newCode = generateRoomCode();
      enterRoom(newCode, name);
    });

    // Event: Join Room
    document.getElementById('btn-join-room').addEventListener('click', () => {
      const userInput = document.getElementById('user-name-input');
      const codeInput = document.getElementById('join-room-code');
      const name = userInput.value.trim();
      const code = codeInput.value.trim().toUpperCase();

      if (!name) {
        alert('Please enter your name.');
        userInput.focus();
        return;
      }

      if (!validateRoomCode(code)) {
        alert('Please enter a valid 6-character alphanumeric room code.');
        codeInput.focus();
        return;
      }

      enterRoom(code, name);
    });

    // Allow Enter key to submit join code
    document.getElementById('join-room-code').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-join-room').click();
      }
    });

    // Event: Leave Room
    document.getElementById('btn-leave-room').addEventListener('click', leaveRoom);

    // Event: Copy Room Code/Link
    document.getElementById('btn-copy-room').addEventListener('click', copyRoomCodeOrLink);

    // Auto-enter room if URL hash or localStorage room exists
    const hashRoom = window.location.hash.replace('#', '').trim().toUpperCase();
    const storedRoom = localStorage.getItem(STORAGE_ROOM);
    const candidateRoom = (validateRoomCode(hashRoom) ? hashRoom : (storedRoom && validateRoomCode(storedRoom) ? storedRoom : null));

    if (candidateRoom && savedUser) {
      enterRoom(candidateRoom, savedUser);
    } else if (candidateRoom) {
      // Pre-fill the join code input for quick entry
      const codeInput = document.getElementById('join-room-code');
      if (codeInput) codeInput.value = candidateRoom;
    }
  }

  return {
    init,
    getCurrentRoom: () => currentRoom,
    getCurrentUser: () => currentUser
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  RoomManager.init();
});
