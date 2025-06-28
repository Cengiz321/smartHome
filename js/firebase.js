import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA81NigOOY1-PT3cz8Axwm0X0cWdWMaZ9U",
    authDomain: "smarthome-9ca8b.firebaseapp.com",
    databaseURL: "https://smarthome-9ca8b-default-rtdb.firebaseio.com",
    projectId: "smarthome-9ca8b",
    storageBucket: "smarthome-9ca8b.appspot.com",
    messagingSenderId: "109056253794",
    appId: "1:109056253794:web:12d2a1fa543046ce14563b",
    measurementId: "G-D1GWKE4F62"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };