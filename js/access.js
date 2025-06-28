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

    const accessRef = ref(database, 'access');
    const openBarrierBtn = document.getElementById('open-barrier-btn');
    const barrierAlwaysOpen = document.getElementById('barrier-always-open');
    const barrierStatus = document.getElementById('barrier-status');
    const newPlateInput = document.getElementById('new-plate');
    const plateAccessSelect = document.getElementById('plate-access');
    const addPlateBtn = document.getElementById('add-plate-btn');
    const platesList = document.getElementById('plates-list');
    const accessLogs = document.getElementById('access-logs');

    // Load current access settings
    onValue(accessRef, (snapshot) => {
        const accessData = snapshot.val();
        if (accessData) {
            // Barrier status
            if (accessData.barrier) {
                barrierAlwaysOpen.checked = accessData.barrier.alwaysOpen || false;
                barrierStatus.textContent = accessData.barrier.status || 'Closed';
            }
            
            // License plates
            renderLicensePlates(accessData.plates || {});
            
            // Access logs
            renderAccessLogs(accessData.logs || {});
        }
        loadingOverlay.style.display = 'none';
    });

    // Open barrier button
    openBarrierBtn.addEventListener('click', function() {
        set(ref(database, 'access/barrier/command'), 'open')
            .then(() => {
                console.log('Barrier open command sent');
            })
            .catch(error => {
                console.error('Error sending barrier command:', error);
            });
    });

    // Always open switch
    barrierAlwaysOpen.addEventListener('change', function() {
        set(ref(database, 'access/barrier/alwaysOpen'), this.checked);
    });

    // Add new license plate
    addPlateBtn.addEventListener('click', function() {
        const plateNumber = newPlateInput.value.trim().toUpperCase();
        const accessType = plateAccessSelect.value;
        
        if (plateNumber) {
            const newPlate = {
                number: plateNumber,
                access: accessType
            };
            
            push(ref(database, 'access/plates'), newPlate)
                .then(() => {
                    newPlateInput.value = '';
                })
                .catch(error => {
                    console.error('Error adding plate:', error);
                    alert('Failed to add plate. Please try again.');
                });
        }
    });

    // Render license plates
    function renderLicensePlates(plates) {
        platesList.innerHTML = '';
        
        Object.entries(plates).forEach(([id, plate]) => {
            const plateElement = document.createElement('div');
            plateElement.className = 'plate-item';
            plateElement.innerHTML = `
                <span class="plate-number">${plate.number}</span>
                <span class="plate-access ${plate.access}">${plate.access === 'granted' ? 'Allowed' : 'Denied'}</span>
                <button class="remove-plate-btn" data-plate-id="${id}">Remove</button>
            `;
            platesList.appendChild(plateElement);
            
            // Add event listener to remove button
            plateElement.querySelector('.remove-plate-btn').addEventListener('click', function() {
                remove(ref(database, `access/plates/${id}`));
            });
        });
    }

    // Render access logs
    function renderAccessLogs(logs) {
        accessLogs.innerHTML = '';
        
        // Convert logs object to array and sort by timestamp (newest first)
        const logsArray = Object.entries(logs).map(([id, log]) => ({ id, ...log }));
        logsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        logsArray.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = 'log-item';
            
            const date = new Date(log.timestamp);
            const timeString = date.toLocaleString();
            
            logElement.innerHTML = `
                <div class="log-time">${timeString}</div>
                <div>
                    <span class="log-plate">${log.plate}</span> - 
                    <span class="log-access ${log.access}">${log.access === 'granted' ? 'Access Granted' : 'Access Denied'}</span>
                </div>
            `;
            
            accessLogs.appendChild(logElement);
        });
    }
});