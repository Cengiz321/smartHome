import { database } from './firebase.js';
import { ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';
    
    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mainNav = document.getElementById('main-nav');
    
    menuBtn.addEventListener('click', function() {
        mainNav.classList.toggle('show');
    });

    const configRef = ref(database, 'configuration');
    const saveBtn = document.getElementById('save-config');
    const addRoomBtn = document.getElementById('add-room-btn');
    const roomConfigContainer = document.getElementById('room-config-container');

    // Load current configuration
    onValue(configRef, (snapshot) => {
        const config = snapshot.val();
        if (config) {
            // Device names
            document.getElementById('light-name').value = config.deviceNames?.light || '';
            document.getElementById('ac-name').value = config.deviceNames?.ac || '';
            document.getElementById('tv-name').value = config.deviceNames?.tv || '';
            document.getElementById('blind-name').value = config.deviceNames?.blind || '';
            document.getElementById('socket-name').value = config.deviceNames?.socket || '';
            
            // Outdoor names
            document.getElementById('outdoor-light-name').value = config.outdoorNames?.light || '';
            document.getElementById('entrance-door-name').value = config.outdoorNames?.entranceDoor || '';
            
            // Room configurations
            renderRoomConfigurations(config.rooms || {});
        }
        loadingOverlay.style.display = 'none';
    });

    // Render room configurations
    function renderRoomConfigurations(rooms) {
        roomConfigContainer.innerHTML = '';
        
        Object.keys(rooms).forEach(roomId => {
            const room = rooms[roomId];
            const roomElement = document.createElement('div');
            roomElement.className = 'room-config-item';
            roomElement.innerHTML = `
                <div class="room-config-header">
                    <div class="room-config-title">${room.name || 'New Room'}</div>
                    <button class="remove-room-btn" data-room-id="${roomId}">×</button>
                </div>
                <div class="config-item">
                    <label for="${roomId}-room-name">Room Name:</label>
                    <input type="text" id="${roomId}-room-name" value="${room.name || ''}">
                </div>
                <div class="device-checkboxes">
                    <div class="device-checkbox">
                        <input type="checkbox" id="${roomId}-has-light" ${room.devices?.light ? 'checked' : ''}>
                        <label for="${roomId}-has-light">Light</label>
                    </div>
                    <div class="device-checkbox">
                        <input type="checkbox" id="${roomId}-has-ac" ${room.devices?.ac ? 'checked' : ''}>
                        <label for="${roomId}-has-ac">Air Conditioner</label>
                    </div>
                    <div class="device-checkbox">
                        <input type="checkbox" id="${roomId}-has-tv" ${room.devices?.tv ? 'checked' : ''}>
                        <label for="${roomId}-has-tv">Television</label>
                    </div>
                    <div class="device-checkbox">
                        <input type="checkbox" id="${roomId}-has-blind" ${room.devices?.blind ? 'checked' : ''}>
                        <label for="${roomId}-has-blind">Window Blind</label>
                    </div>
                    <div class="device-checkbox">
                        <input type="checkbox" id="${roomId}-has-socket" ${room.devices?.socket ? 'checked' : ''}>
                        <label for="${roomId}-has-socket">Power Socket</label>
                    </div>
                </div>
            `;
            roomConfigContainer.appendChild(roomElement);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-room-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const roomId = this.getAttribute('data-room-id');
                removeRoom(roomId);
            });
        });
    }

    // Add new room
    addRoomBtn.addEventListener('click', function() {
        const newRoomId = `room${Date.now()}`;
        const newRoomElement = document.createElement('div');
        newRoomElement.className = 'room-config-item';
        newRoomElement.innerHTML = `
            <div class="room-config-header">
                <div class="room-config-title">New Room</div>
                <button class="remove-room-btn" data-room-id="${newRoomId}">×</button>
            </div>
            <div class="config-item">
                <label for="${newRoomId}-room-name">Room Name:</label>
                <input type="text" id="${newRoomId}-room-name" placeholder="Enter room name">
            </div>
            <div class="device-checkboxes">
                <div class="device-checkbox">
                    <input type="checkbox" id="${newRoomId}-has-light" checked>
                    <label for="${newRoomId}-has-light">Light</label>
                </div>
                <div class="device-checkbox">
                    <input type="checkbox" id="${newRoomId}-has-ac" checked>
                    <label for="${newRoomId}-has-ac">Air Conditioner</label>
                </div>
                <div class="device-checkbox">
                    <input type="checkbox" id="${newRoomId}-has-tv" checked>
                    <label for="${newRoomId}-has-tv">Television</label>
                </div>
                <div class="device-checkbox">
                    <input type="checkbox" id="${newRoomId}-has-blind" checked>
                    <label for="${newRoomId}-has-blind">Window Blind</label>
                </div>
                <div class="device-checkbox">
                    <input type="checkbox" id="${newRoomId}-has-socket" checked>
                    <label for="${newRoomId}-has-socket">Power Socket</label>
                </div>
            </div>
        `;
        roomConfigContainer.appendChild(newRoomElement);
        
        // Add event listener to the new remove button
        newRoomElement.querySelector('.remove-room-btn').addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            removeRoom(roomId);
        });
    });

    // Remove room
    function removeRoom(roomId) {
        const roomElement = document.querySelector(`.remove-room-btn[data-room-id="${roomId}"]`)?.parentElement?.parentElement;
        if (roomElement) {
            roomElement.remove();
        }
    }

    // Save configuration
    saveBtn.addEventListener('click', function() {
        loadingOverlay.style.display = 'flex';
        
        const newConfig = {
            deviceNames: {
                light: document.getElementById('light-name').value || 'Light',
                ac: document.getElementById('ac-name').value || 'Air Conditioner',
                tv: document.getElementById('tv-name').value || 'Television',
                blind: document.getElementById('blind-name').value || 'Window Blind',
                socket: document.getElementById('socket-name').value || 'Power Socket'
            },
            outdoorNames: {
                light: document.getElementById('outdoor-light-name').value || 'Outdoor Light',
                entranceDoor: document.getElementById('entrance-door-name').value || 'Entrance Door'
            },
            rooms: {}
        };

        // Get all room configurations
        const roomItems = document.querySelectorAll('.room-config-item');
        roomItems.forEach(roomItem => {
            const roomId = roomItem.querySelector('.remove-room-btn').getAttribute('data-room-id');
            const roomName = roomItem.querySelector('input[type="text"]').value || 'New Room';
            
            newConfig.rooms[roomId] = {
                name: roomName,
                devices: {
                    light: roomItem.querySelector(`#${roomId}-has-light`).checked,
                    ac: roomItem.querySelector(`#${roomId}-has-ac`).checked,
                    tv: roomItem.querySelector(`#${roomId}-has-tv`).checked,
                    blind: roomItem.querySelector(`#${roomId}-has-blind`).checked,
                    socket: roomItem.querySelector(`#${roomId}-has-socket`).checked
                }
            };
        });

        set(configRef, newConfig)
            .then(() => {
                alert('Configuration saved successfully!');
                loadingOverlay.style.display = 'none';
            })
            .catch((error) => {
                console.error('Error saving configuration:', error);
                alert('Failed to save configuration. Please try again.');
                loadingOverlay.style.display = 'none';
            });
    });
});