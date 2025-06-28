// compression.js
import { database } from './firebase.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Function to update compressed values when any relevant data changes
function updateCompressedValues() {
    // Listen to all relevant paths
    const roomsRef = ref(database, 'rooms');
    const outdoorRef = ref(database, 'outdoor');
    const accessRef = ref(database, 'access');
    
    // Combine all listeners into one callback
    onValue(roomsRef, updateKeys);
    onValue(outdoorRef, updateKeys);
    onValue(accessRef, updateKeys);
}

// Main function to compress all data into Key1 and Key2
async function updateKeys() {
    // Get all necessary data
    const [roomsSnapshot, outdoorSnapshot, accessSnapshot] = await Promise.all([
        getSnapshot(ref(database, 'rooms')),
        getSnapshot(ref(database, 'outdoor')),
        getSnapshot(ref(database, 'access'))
    ]);
    
    const rooms = roomsSnapshot.val() || {};
    const outdoor = outdoorSnapshot.val() || {};
    const access = accessSnapshot.val() || {};
    
    // Compress Key1: Lights, blinds, outdoor light
    let key1 = '';
    
    // Process lights for all rooms (room0, room1, room2)
    for (let i = 0; i < 3; i++) {
        const roomId = `room${i+1}`;
        const light = rooms[roomId]?.light || {};
        const on = light.on ? '1' : '0';
        const brightness = light.brightness || 0;
        key1 += `<L${i}${on}%${brightness}>`;
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
    const barrier = access.barrier || {};
    const barrierStatus = barrier.status === 'open' ? '1' : '0';
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
    
    // Update the compressed values in Firebase
    const updates = {
        'rooms/Key1': key1,
        'rooms/Key2': key2
    };
    
    set(ref(database), updates).catch(error => {
        console.error('Error updating compressed values:', error);
    });
}

// Helper function to get a snapshot
function getSnapshot(ref) {
    return new Promise((resolve) => {
        onValue(ref, (snapshot) => {
            resolve(snapshot);
        }, { onlyOnce: true });
    });
}

// Initialize the compression when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateCompressedValues();
});