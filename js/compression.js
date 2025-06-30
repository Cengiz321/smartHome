import { database } from './firebase.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Debug flag
const DEBUG = true;
// Barrier reset delay in milliseconds (configurable)
const BARRIER_RESET_DELAY = 3000; // 3 seconds by default

function logDebug(...messages) {
    if (DEBUG) {
        console.log('[Compression]', ...messages);
    }
}

// Improved getSnapshot with error handling
function getSnapshot(ref) {
    return new Promise((resolve, reject) => {
        onValue(ref, 
            (snapshot) => {
                if (!snapshot.exists()) {
                    logDebug(`No data at ${ref.path}`);
                    resolve(null);
                    return;
                }
                resolve(snapshot);
            }, 
            (error) => {
                console.error(`Error getting snapshot for ${ref.path}:`, error);
                reject(error);
            },
            { onlyOnce: true }
        );
    });
}

// Function to reset barrier command after delay
function resetBarrierCommand() {
    const barrierRef = ref(database, 'access/barrier/command');
    set(barrierRef, "").then(() => {
        logDebug('Barrier command reset to empty string');
    }).catch(error => {
        console.error('Error resetting barrier command:', error);
    });
}

// Modified updateKeys function with barrier reset logic
async function updateKeys() {
    try {
        logDebug('Starting compression update...');
        
        const [roomsSnapshot, outdoorSnapshot, accessSnapshot] = await Promise.all([
            getSnapshot(ref(database, 'rooms')),
            getSnapshot(ref(database, 'outdoor')),
            getSnapshot(ref(database, 'access'))
        ]);

        const rooms = roomsSnapshot?.val() || {};
        const outdoor = outdoorSnapshot?.val() || {};
        const access = accessSnapshot?.val() || {};

        logDebug('Retrieved data:', { rooms, outdoor, access });

        // Check if barrier command is "open" and needs to be reset
        const barrier = access.barrier || {};
        if (barrier.command === 'open') {
            logDebug('Barrier command is open, scheduling reset');
            setTimeout(resetBarrierCommand, BARRIER_RESET_DELAY);
        }

        // Rest of the original updateKeys function remains the same
        let key1 = '';
        
        // Process lights for all rooms
        for (let i = 1; i <= 3; i++) {
            const roomId = `room${i}`;
            const light = rooms[roomId]?.light || {};
            const on = light.on ? '1' : '0';
            const brightness = light.brightness || 0;
            key1 += `<L${i-1}${on}%${brightness}>`;
            logDebug(`Processed light for ${roomId}:`, light);
        }
        
        // Process blinds (only room1)
        const blind = rooms.room1?.blind || {};
        const blindOn = blind.on ? '1' : '0';
        const blindLevel = blind.level || 0;
        key1 += `<W${blindOn}%${blindLevel}>`;
        
        // Process outdoor light
        const outdoorLight = outdoor.light || {};
        const outdoorOn = outdoorLight.on ? '1' : '0';
        const outdoorAuto = outdoorLight.auto ? '1' : '0';
        key1 += `<O${outdoorOn}${outdoorAuto}>`;
        
        // Compress Key2: Door, AC, TV, socket
        let key2 = '';
        
        // Process entrance barrier
        const barrierStatus = barrier.command === 'open' ? '1' : '0';
        const barrierAlwaysOpen = barrier.alwaysOpen ? '1' : '0';
        key2 += `<M${barrierStatus}${barrierAlwaysOpen}>`;
        
        // Process entrance door lock
        const entranceDoor = outdoor.entranceDoor || {};
        const doorLocked = entranceDoor.locked ? '1' : '0';
        key2 += `<A${doorLocked}>`;
        
        // Process power socket (only room1)
        const socket = rooms.room1?.socket || {};
        const socketOn = socket.on ? '1' : '0';
        key2 += `<P${socketOn}>`;
        
        // Process AC (only room1)
        const ac = rooms.room1?.ac || {};
        const acPower = ac.power ? '1' : '0';
        let acMode = '0'; // Default to cool
        if (ac.mode === 'heat') acMode = '1';
        else if (ac.mode === 'dry') acMode = '2';
        else if (ac.mode === 'fan') acMode = '3';
        const acTemp = ac.temperature || 22;
        let acFan = '0'; // Default to auto
        if (ac.fan === 'low') acFan = '1';
        else if (ac.fan === 'medium') acFan = '2';
        else if (ac.fan === 'high') acFan = '3';
        key2 += `<C${acPower}${acMode}${acTemp}${acFan}>`;
        
        // Process TV (only room1)
        const tv = rooms.room1?.tv || {};
        const tvPower = tv.power ? '1' : '0';
        const tvMute = tv.muted ? '1' : '0';
        const tvVolume = tv.volume || 50;
        const tvChannel = tv.channel || 1;
        key2 += `<T${tvPower}${tvMute}V${tvVolume}C${tvChannel}>`;
        
        logDebug('Generated keys:', { key1, key2 });

        // Update the compressed values in Firebase
        set(ref(database, 'rooms/Key1'), key1);
        set(ref(database, 'rooms/Key2'), key2);
        logDebug('Successfully updated compressed keys');
        
    } catch (error) {
        console.error('Error in compression update:', error);
    }
}

// Initialize with more robust error handling
function initializeCompression() {
    try {
        logDebug('Initializing compression...');
        
        // Set up listeners for all relevant paths
        const roomsRef = ref(database, 'rooms');
        const outdoorRef = ref(database, 'outdoor');
        const accessRef = ref(database, 'access');
        
        // Initial update
        updateKeys();
        
        // Set up listeners for changes
        onValue(roomsRef, updateKeys);
        onValue(outdoorRef, updateKeys);
        onValue(accessRef, updateKeys);
        
        logDebug('Compression initialized');
    } catch (error) {
        console.error('Error initializing compression:', error);
    }
}

// Start immediately rather than waiting for DOMContentLoaded
initializeCompression();