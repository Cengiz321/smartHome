import { database } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Show loading overlay initially
    loadingOverlay.style.display = 'flex';
    
    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mainNav = document.getElementById('main-nav');
    
    menuBtn.addEventListener('click', function() {
        mainNav.classList.toggle('show');
    });

    // Initialize Firebase references
    const roomsRef = ref(database, 'rooms');
    const configRef = ref(database, 'configuration');
    const outdoorRef = ref(database, 'outdoor');
    const roomsGrid = document.querySelector('.rooms-grid');

    // Load configuration and update UI
    onValue(configRef, (snapshot) => {
        const config = snapshot.val();
        if (config) {
            // Update room names and device labels
            if (config.roomNames) {
                Object.keys(config.roomNames).forEach(roomId => {
                    const roomNameElement = document.getElementById(`${roomId}-name`);
                    if (roomNameElement) {
                        roomNameElement.textContent = config.roomNames[roomId];
                    }
                });
            }

            if (config.deviceNames) {
                // Update device labels in all rooms
                ['room1', 'room2', 'room3'].forEach(roomId => {
                    if (config.deviceNames.light) {
                        const element = document.getElementById(`${roomId}-light-label`);
                        if (element) element.textContent = `${config.deviceNames.light}:`;
                    }
                    if (config.deviceNames.ac) {
                        const element = document.getElementById(`${roomId}-ac-label`);
                        if (element) element.textContent = `${config.deviceNames.ac}:`;
                    }
                    if (config.deviceNames.tv) {
                        const element = document.getElementById(`${roomId}-tv-label`);
                        if (element) element.textContent = `${config.deviceNames.tv}:`;
                    }
                    if (config.deviceNames.blind) {
                        const element = document.getElementById(`${roomId}-blind-label`);
                        if (element) element.textContent = `${config.deviceNames.blind}:`;
                    }
                    if (config.deviceNames.socket) {
                        const element = document.getElementById(`${roomId}-socket-label`);
                        if (element) element.textContent = `${config.deviceNames.socket}:`;
                    }
                });
            }
        }
        loadingOverlay.style.display = 'none';
    });

    // Update Room statuses
    ['room1', 'room2', 'room3'].forEach(roomId => {
        onValue(ref(database, `rooms/${roomId}`), (snapshot) => {
            const roomData = snapshot.val();
            if (roomData) {
                updateStatusDisplay(roomId, roomData);
            }
        });
    });

    // Update Outdoor controls
    onValue(outdoorRef, (snapshot) => {
        const outdoorData = snapshot.val();
        if (outdoorData) {
            // Outdoor light
            if (outdoorData.light) {
                const status = outdoorData.light.on ? 'On' : 'Off';
                document.getElementById('outdoor-light-status').textContent = status;
                
                const mode = outdoorData.light.auto ? 'Auto' : 'Manual';
                document.getElementById('outdoor-light-mode').textContent = mode;
            }
            
            // Entrance door
            if (outdoorData.entranceDoor) {
                const status = outdoorData.entranceDoor.locked ? 'Locked' : 'Unlocked';
                document.getElementById('entrance-door-status').textContent = status;
            }
        }
    });

    // Function to update status display for a room
    function updateStatusDisplay(roomId, roomData) {
        // Light status
        if (roomData.light) {
            const lightStatus = roomData.light.on ? `On (${roomData.light.brightness || 0}%)` : 'Off';
            document.getElementById(`${roomId}-light-status`).textContent = lightStatus;
        }

        // AC status
        if (roomData.ac) {
            const acStatus = roomData.ac.power ? `${roomData.ac.mode || 'Cool'} (${roomData.ac.temperature || 22}°C)` : 'Off';
            document.getElementById(`${roomId}-ac-status`).textContent = acStatus;
        }

        // TV status
        if (roomData.tv) {
            const tvStatus = roomData.tv.power ? `On (Ch ${roomData.tv.channel || 1})` : 'Off';
            document.getElementById(`${roomId}-tv-status`).textContent = tvStatus;
        }

        // Blind status
        if (roomData.blind) {
            const blindStatus = roomData.blind.on ? `Open (${roomData.blind.level || 0}%)` : 'Closed';
            document.getElementById(`${roomId}-blind-status`).textContent = blindStatus;
        }

        // Socket status
        if (roomData.socket) {
            const socketStatus = roomData.socket.on ? 'On' : 'Off';
            document.getElementById(`${roomId}-socket-status`).textContent = socketStatus;
        }
    }

    // Room card click events
    document.getElementById('room1-card').addEventListener('click', () => {
        window.location.href = 'room1.html';
    });
    
    document.getElementById('room2-card').addEventListener('click', () => {
        window.location.href = 'room2.html';
    });
    
    document.getElementById('room3-card').addEventListener('click', () => {
        window.location.href = 'room3.html';
    });
});