import { database } from './firebase.js';
import { ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

export function initRoomControls(roomId) {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';
    
    // Mobile menu toggle
    const menuBtn = document.getElementById('menu-btn');
    const mainNav = document.getElementById('main-nav');
    
    menuBtn.addEventListener('click', function() {
        mainNav.classList.toggle('show');
    });

    const roomRef = ref(database, `rooms/${roomId}`);
    const configRef = ref(database, 'configuration');

    // Set room title from configuration
    onValue(configRef, (snapshot) => {
        const config = snapshot.val();
        if (config && config.roomNames && config.roomNames[roomId]) {
            document.getElementById('room-title').textContent = config.roomNames[roomId];
        }
        loadingOverlay.style.display = 'none';
    });

    // Initialize all controls based on configuration
    onValue(ref(database, `configuration/rooms/${roomId}`), (snapshot) => {
        const roomConfig = snapshot.val();
        if (roomConfig) {
            if (roomConfig.devices.light) initLightControls(roomRef, roomId);
            if (roomConfig.devices.ac) initACControls(roomRef, roomId);
            if (roomConfig.devices.tv) initTVControls(roomRef, roomId);
            if (roomConfig.devices.blind) initBlindControls(roomRef, roomId);
            if (roomConfig.devices.socket) initSocketControls(roomRef, roomId);
        }
    });
}

function initLightControls(roomRef, roomId) {
    const lightSwitch = document.getElementById('light-switch');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessValue = document.getElementById('brightness-value');
    const brightnessControl = document.getElementById('brightness-control');

    // Load current state
    onValue(ref(database, `rooms/${roomId}/light`), (snapshot) => {
        const lightData = snapshot.val();
        if (lightData) {
            lightSwitch.checked = lightData.on || false;
            brightnessSlider.value = lightData.brightness || 50;
            brightnessValue.textContent = lightData.brightness || 50;
            
            if (lightData.on) {
                brightnessControl.classList.remove('hidden');
            } else {
                brightnessControl.classList.add('hidden');
            }
        }
    });

    // Switch event
    lightSwitch.addEventListener('change', function() {
        set(ref(database, `rooms/${roomId}/light/on`), this.checked);
        if (this.checked) {
            brightnessControl.classList.remove('hidden');
        } else {
            brightnessControl.classList.add('hidden');
        }
    });

    // Brightness slider event
    brightnessSlider.addEventListener('input', function() {
        brightnessValue.textContent = this.value;
        set(ref(database, `rooms/${roomId}/light/brightness`), parseInt(this.value));
    });
}

function initACControls(roomRef, roomId) {
    const acSwitch = document.getElementById('ac-switch');
    const acControls = document.getElementById('ac-controls');
    const acTempSlider = document.getElementById('ac-temp');
    const acTempValue = document.getElementById('ac-temp-value');
    const acFanSelect = document.getElementById('ac-fan');
    const acModeRadios = document.querySelectorAll('input[name="ac-mode"]');

    // Load current state
    onValue(ref(database, `rooms/${roomId}/ac`), (snapshot) => {
        const acData = snapshot.val();
        if (acData) {
            acSwitch.checked = acData.power || false;
            acTempSlider.value = acData.temperature || 22;
            acTempValue.textContent = acData.temperature || 22;
            acFanSelect.value = acData.fan || 'auto';
            
            // Set mode radio
            if (acData.mode) {
                document.getElementById(`ac-mode-${acData.mode}`).checked = true;
            }
            
            if (acData.power) {
                acControls.classList.remove('hidden');
            } else {
                acControls.classList.add('hidden');
            }
        }
    });

    // Switch event
    acSwitch.addEventListener('change', function() {
        set(ref(database, `rooms/${roomId}/ac/power`), this.checked);
        if (this.checked) {
            acControls.classList.remove('hidden');
        } else {
            acControls.classList.add('hidden');
        }
    });

    // Temperature control
    acTempSlider.addEventListener('input', function() {
        acTempValue.textContent = this.value;
        set(ref(database, `rooms/${roomId}/ac/temperature`), parseInt(this.value));
    });

    // Fan control
    acFanSelect.addEventListener('change', function() {
        set(ref(database, `rooms/${roomId}/ac/fan`), this.value);
    });

    // Mode control
    acModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                set(ref(database, `rooms/${roomId}/ac/mode`), this.value);
            }
        });
    });
}

function initTVControls(roomRef, roomId) {
    const tvSwitch = document.getElementById('tv-switch');
    const tvControls = document.getElementById('tv-controls');
    const volDownBtn = document.getElementById('tv-vol-down');
    const volUpBtn = document.getElementById('tv-vol-up');
    const muteBtn = document.getElementById('tv-mute');
    const chDownBtn = document.getElementById('tv-ch-down');
    const chUpBtn = document.getElementById('tv-ch-up');
    const channelInput = document.getElementById('tv-channel-input');
    const favChannelsList = document.getElementById('favorite-channels-list');
    const newFavChannel = document.getElementById('new-fav-channel');
    const newFavName = document.getElementById('new-fav-name');
    const addFavBtn = document.getElementById('add-favorite-btn');

    // Load current state
    onValue(ref(database, `rooms/${roomId}/tv`), (snapshot) => {
        const tvData = snapshot.val();
        if (tvData) {
            tvSwitch.checked = tvData.power || false;
            channelInput.value = tvData.channel || 1;
            
            if (tvData.power) {
                tvControls.classList.remove('hidden');
            } else {
                tvControls.classList.add('hidden');
            }
            
            // Load favorite channels
            renderFavoriteChannels(tvData.favorites);
        }
    });

    // Switch event
    tvSwitch.addEventListener('change', function() {
        set(ref(database, `rooms/${roomId}/tv/power`), this.checked);
        if (this.checked) {
            tvControls.classList.remove('hidden');
        } else {
            tvControls.classList.add('hidden');
        }
    });

    // Volume controls
    volDownBtn.addEventListener('click', () => adjustVolume(-5));
    volUpBtn.addEventListener('click', () => adjustVolume(5));
    muteBtn.addEventListener('click', toggleMute);

    // Channel controls
    chDownBtn.addEventListener('click', () => changeChannel(-1));
    chUpBtn.addEventListener('click', () => changeChannel(1));
    channelInput.addEventListener('change', setChannel);

    // Favorite channels
    addFavBtn.addEventListener('click', addFavoriteChannel);

    function adjustVolume(change) {
        const volRef = ref(database, `rooms/${roomId}/tv/volume`);
        onValue(volRef, (snapshot) => {
            const currentVol = snapshot.val() || 50;
            const newVol = Math.max(0, Math.min(100, currentVol + change));
            set(volRef, newVol);
        }, { onlyOnce: true });
    }

    function toggleMute() {
        const muteRef = ref(database, `rooms/${roomId}/tv/muted`);
        onValue(muteRef, (snapshot) => {
            set(muteRef, !snapshot.val());
        }, { onlyOnce: true });
    }

    function changeChannel(change) {
        const chRef = ref(database, `rooms/${roomId}/tv/channel`);
        onValue(chRef, (snapshot) => {
            const currentCh = snapshot.val() || 1;
            const newCh = Math.max(1, Math.min(999, currentCh + change));
            set(chRef, newCh);
            channelInput.value = newCh;
        }, { onlyOnce: true });
    }

    function setChannel() {
        const ch = parseInt(channelInput.value);
        if (!isNaN(ch)) {
            set(ref(database, `rooms/${roomId}/tv/channel`), Math.max(1, Math.min(999, ch)));
        }
    }

    function renderFavoriteChannels(favorites) {
        favChannelsList.innerHTML = '';
        
        if (!favorites) return;
        
        Object.entries(favorites).forEach(([id, channel]) => {
            const btn = document.createElement('button');
            btn.className = 'channel-btn';
            btn.textContent = channel.name;
            btn.onclick = () => {
                set(ref(database, `rooms/${roomId}/tv/channel`), channel.number);
                channelInput.value = channel.number;
            };
            favChannelsList.appendChild(btn);
        });
    }

    function addFavoriteChannel() {
        const number = parseInt(newFavChannel.value);
        const name = newFavName.value.trim();
        
        if (!isNaN(number) && number > 0 && name) {
            const newFav = {
                number: Math.max(1, Math.min(999, number)),
                name: name
            };
            
            const favRef = ref(database, `rooms/${roomId}/tv/favorites`);
            push(favRef, newFav);
            newFavChannel.value = '';
            newFavName.value = '';
        }
    }
}

function initBlindControls(roomRef, roomId) {
    const blindSwitch = document.getElementById('blind-switch');
    const blindSlider = document.getElementById('blind-slider');
    const blindValue = document.getElementById('blind-value');
    const blindControl = document.getElementById('blind-control');

    // Load current state
    onValue(ref(database, `rooms/${roomId}/blind`), (snapshot) => {
        const blindData = snapshot.val();
        if (blindData) {
            blindSwitch.checked = blindData.on || false;
            blindSlider.value = blindData.level || 50;
            blindValue.textContent = blindData.level || 50;
            
            if (blindData.on) {
                blindControl.classList.remove('hidden');
            } else {
                blindControl.classList.add('hidden');
            }
        }
    });

    // Switch event
    blindSwitch.addEventListener('change', function() {
        set(ref(database, `rooms/${roomId}/blind/on`), this.checked);
        if (this.checked) {
            blindControl.classList.remove('hidden');
        } else {
            blindControl.classList.add('hidden');
        }
    });

    // Blind level slider event
    blindSlider.addEventListener('input', function() {
        blindValue.textContent = this.value;
        set(ref(database, `rooms/${roomId}/blind/level`), parseInt(this.value));
    });
}

function initSocketControls(roomRef, roomId) {
    const socketSwitch = document.getElementById('socket-switch');

    // Load current state
    onValue(ref(database, `rooms/${roomId}/socket`), (snapshot) => {
        const socketData = snapshot.val();
        if (socketData) {
            socketSwitch.checked = socketData.on || false;
        }
    });

    // Switch event
    socketSwitch.addEventListener('change', function() {
        set(ref(database, `rooms/${roomId}/socket/on`), this.checked);
    });
}