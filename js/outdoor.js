import { database } from './firebase.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';
    
    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mainNav = document.getElementById('main-nav');
    
    menuBtn.addEventListener('click', function() {
        mainNav.classList.toggle('show');
    });

    const outdoorRef = ref(database, 'outdoor');
    const configRef = ref(database, 'configuration');
    const lightSwitch = document.getElementById('outdoor-light-switch');
    const manualMode = document.getElementById('outdoor-light-manual');
    const autoMode = document.getElementById('outdoor-light-auto');
    const toggleDoorBtn = document.getElementById('toggle-door-btn');
    const doorStatus = document.getElementById('door-status');

    // Load configuration for names
    onValue(configRef, (snapshot) => {
        const config = snapshot.val();
        if (config) {
            if (config.outdoorNames?.light) {
                document.getElementById('outdoor-light-title').textContent = config.outdoorNames.light;
            }
            if (config.outdoorNames?.entranceDoor) {
                document.getElementById('entrance-door-title').textContent = config.outdoorNames.entranceDoor;
            }
        }
    });

    // Load outdoor light state
    onValue(ref(database, 'outdoor/light'), (snapshot) => {
        const lightData = snapshot.val();
        if (lightData) {
            lightSwitch.checked = lightData.on || false;
            
            if (lightData.auto) {
                autoMode.checked = true;
            } else {
                manualMode.checked = true;
            }
        }
        loadingOverlay.style.display = 'none';
    });

    // Load entrance door state
    onValue(ref(database, 'outdoor/entranceDoor'), (snapshot) => {
        const doorData = snapshot.val();
        if (doorData) {
            const status = doorData.locked ? 'Locked' : 'Unlocked';
            doorStatus.textContent = status;
            toggleDoorBtn.textContent = doorData.locked ? 'Unlock Door' : 'Lock Door';
        }
    });

    // Outdoor light switch
    lightSwitch.addEventListener('change', function() {
        set(ref(database, 'outdoor/light/on'), this.checked);
    });

    // Outdoor light mode
    manualMode.addEventListener('change', function() {
        if (this.checked) {
            set(ref(database, 'outdoor/light/auto'), false);
        }
    });

    autoMode.addEventListener('change', function() {
        if (this.checked) {
            set(ref(database, 'outdoor/light/auto'), true);
        }
    });

    // Entrance door control
    toggleDoorBtn.addEventListener('click', function() {
        const doorRef = ref(database, 'outdoor/entranceDoor/locked');
        onValue(doorRef, (snapshot) => {
            set(doorRef, !snapshot.val());
        }, { onlyOnce: true });
    });
});