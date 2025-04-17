// Select or generate circle container
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const noteDisplay = document.createElement('div');
noteDisplay.style.position = 'absolute';
noteDisplay.style.top = '10px';
noteDisplay.style.left = '50%';
noteDisplay.style.transform = 'translateX(-50%)';
noteDisplay.style.fontSize = '24px';
noteDisplay.style.fontWeight = 'bold';
noteDisplay.textContent = 'Current Note: None';
document.body.appendChild(noteDisplay);
const midiDropdown = document.createElement('select');
midiDropdown.style.position = 'absolute';
midiDropdown.style.top = '50px';
midiDropdown.style.left = '50%';
midiDropdown.style.transform = 'translateX(-50%)';
midiDropdown.style.fontSize = '16px';
document.body.appendChild(midiDropdown);
const ctx = canvas.getContext('2d');

// Configure canvas dimensions
canvas.width = 600;
canvas.height = 600;

// Circle of Fifths Keys
const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const minorKeys = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 250;
const innerRadius = 180;

// Web Audio Synthesizer Context
const midiKeys = { // Map MIDI note numbers to Circle of Fifths keys
    60: 'C', 62: 'D', 64: 'E', 65: 'F', 67: 'G', 69: 'A', 71: 'B', 61: 'Db',
    63: 'Eb', 66: 'F#', 68: 'Ab', 70: 'Bb', 72: 'C', 73: 'C#m', 74: 'Dm',
    75: 'Ebm', 76: 'Fm', 77: 'F#m', 78: 'Gm', 79: 'Abm', 80: 'Bbm'
};
let midiAccess = null;
let lastConnectedDeviceId = null; // Track the last connected device ID
let midiInputs = new Map(); // Track MIDI inputs
let midiOutputs = new Map(); // Track MIDI outputs
let activeKey = null;

function onMIDISuccess(access) {
    midiAccess = access;
    alert('MIDI access granted. Successfully connected!');
    setDefaultMIDIInput(); // Set the default MIDI input initially
    for (let input of midiAccess.inputs.values()) {
        input.addEventListener('midimessage', handleMIDIMessage); // Use addEventListener for better compatibility
        lastConnectedDeviceId = input.id; // Update last connected device
    }
    updateMIDIDropdown(); // Populate dropdown with available devices
    midiAccess.addEventListener('statechange', handleMIDIStateChange); // Track device connection changes
}

function handleMIDIStateChange(event) {
    setDefaultMIDIInput(); // Update default MIDI input on state change
    const port = event.port;
    console.log(`State change detected for ${port.type} with ID: ${port.id}`);
    console.log(`State change detected for ${port.type} with ID: ${port.id}`);
    updateMIDIDropdown(); // Re-populate dropdown when state changes
    if (port.state === 'connected') {
        console.log(`Device connected: ${port.name}`);
        if (port.type === 'input' && !midiInputs.has(port.id)) {
            midiInputs.set(port.id, port);
            port.addEventListener('midimessage', handleMIDIMessage);
        } else if (port.type === 'output' && !midiOutputs.has(port.id)) {
            midiOutputs.set(port.id, port);
        }
    } else if (port.state === 'disconnected') {
        console.log(`Device disconnected: ${port.name}`);
        if (port.type === 'input' && midiInputs.has(port.id)) {
            midiInputs.delete(port.id);
            if (port.id === lastConnectedDeviceId) {
                lastConnectedDeviceId = null; // Clear last device ID if it disconnects
            }
        } else if (port.type === 'output' && midiOutputs.has(port.id)) {
            midiOutputs.delete(port.id);
        }
    }
    if (port.id === lastConnectedDeviceId) {
        setDefaultMIDIInput(); // Automatically set to last connected device
    }
}


function onMIDIFailure(error) {
    console.error('Error accessing MIDI devices:', error);
    alert('MIDI access is not available or was denied. Please check your permissions.');
}

// Helper function to set default MIDI input to the most recently connected device
function setDefaultMIDIInput() {
    if (midiAccess && midiInputs.size > 0) {
        const lastConnected = Array.from(midiInputs.values()).find(device => device.id === lastConnectedDeviceId);
        if (lastConnected) {
            lastConnected.addEventListener('midimessage', handleMIDIMessage); // Attach handler
            console.log(`Default MIDI input set: ${lastConnected.name}`);
        }
    }
}

function updateMIDIDropdown() {
    midiDropdown.innerHTML = ''; // Clear existing options
    for (let input of midiAccess.inputs.values()) {
        const option = document.createElement('option');
        option.value = input.id;
        option.textContent = input.name;
        midiDropdown.appendChild(option);
    }
    if (lastConnectedDeviceId) {
        midiDropdown.value = lastConnectedDeviceId; // Set to last connected device
    }
}

midiDropdown.addEventListener('change', () => {
    const selectedDeviceId = midiDropdown.value;
    const selectedInput = midiInputs.get(selectedDeviceId);
    if (selectedInput) {
        selectedInput.addEventListener('midimessage', handleMIDIMessage);
        lastConnectedDeviceId = selectedDeviceId;
        console.log(`Active MIDI input switched to: ${selectedInput.name}`);
    }
});

navigator.requestMIDIAccess({sysex: false}).then(onMIDISuccess).catch(onMIDIFailure);

// for (let input of midiAccess.inputs.values()) {
//     midiInputs.set(input.id, input); // Store inputs in the map
//     input.addEventListener('midimessage', handleMIDIMessage);
// }

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Function to create a note oscillator
function playSynth(noteFrequency) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(noteFrequency, audioCtx.currentTime); // Frequency in Hz
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // Volume
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5); // Play the note for 0.5 seconds
}

// Map keys in the Circle of Fifths to frequencies (e.g., A4 = 440 Hz)
const notesFrequencies = {
    C: 261.63, // C4
    G: 392.00, // G4
    D: 293.66, // D4
    A: 440.00, // A4
    E: 329.63, // E4
    B: 493.88, // B4
    'F#': 369.99, // F#4
    Db: 277.18, // Db4
    Ab: 415.30, // Ab4
    Eb: 311.13, // Eb4
    Bb: 466.16, // Bb4
    F: 349.23, // F4
};

// Function to draw the Circle of Fifths
// Function to draw minor keys inner circle
function drawCircle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const anglePerKey = (Math.PI * 2) / keys.length;

    keys.forEach((key, index) => {
        const minorKey = minorKeys[index];
        const angle = index * anglePerKey;

        // Draw section
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + anglePerKey);
        ctx.strokeStyle = '#000'; // Set outline color
        ctx.lineWidth = 2; // Set outline width
        ctx.stroke(); // Draw outline
        ctx.closePath();
        ctx.fillStyle = `hsl(${(index / keys.length) * 360}, 80%, 70%)`; // Unique color per key
        ctx.fill();

        // Draw minor key sector
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, innerRadius, angle, angle + anglePerKey);
        ctx.strokeStyle = '#000'; // Set outline color
        ctx.lineWidth = 2; // Set outline width
        ctx.stroke(); // Draw outline
        ctx.closePath();
        ctx.fillStyle = `hsl(${(index / keys.length) * 360}, 60%, 70%)`;
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#000';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textX = centerX + Math.cos(angle + anglePerKey / 2) * (radius - 40);
        const textY = centerY + Math.sin(angle + anglePerKey / 2) * (radius - 40);
        ctx.fillText(key, textX, textY);
        const minorTextX = centerX + Math.cos(angle + anglePerKey / 2) * (innerRadius - 20);
        const minorTextY = centerY + Math.sin(angle + anglePerKey / 2) * (innerRadius - 20);
        ctx.fillStyle = '#000';
        ctx.fillText(minorKey, minorTextX, minorTextY);
    });
}

// Function to get clicked key
function highlightKey(key) {
    const index = keys.indexOf(key.replace('m', ''));
    const minorIndex = minorKeys.indexOf(key);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle();
    if (index !== -1) {
        const angle = index * ((Math.PI * 2) / keys.length);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + ((Math.PI * 2) / keys.length));
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Highlight color
        ctx.fill();
    }
    if (minorIndex !== -1) {
        const minorAngle = minorIndex * ((Math.PI * 2) / minorKeys.length);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, innerRadius, minorAngle, minorAngle + ((Math.PI * 2) / minorKeys.length));
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; // Highlight minor key
        ctx.fill();
    }
}

// Function to determine click location (inner or outer)

function getKeyFromClick(x, y) {
    const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (distanceFromCenter > radius) return;
    if (distanceFromCenter < innerRadius) {
        const minorAngle = Math.atan2(y - centerY, x - centerX);
        const minorKeyIndex = Math.floor((minorAngle >= 0 ? minorAngle : minorAngle + Math.PI * 2) / ((Math.PI * 2) / minorKeys.length));
        return {key: minorKeys[minorKeyIndex % minorKeys.length], isMinor: true};
    }
    const angle = Math.atan2(y - centerY, x - centerX);
    const keyIndex = Math.floor((angle >= 0 ? angle : angle + Math.PI * 2) / ((Math.PI * 2) / keys.length));
    return {key: keys[keyIndex % keys.length], isMinor: false};
}


// Handle mouse click
function handleMIDIMessage(event) {
    console.log('MIDI Message Received:', event.data);
    const [status, note, velocity = 0] = event.data; // Default velocity to 0
    if (status === 144 && velocity > 0) { // Note On message
        const key = midiKeys[note];
        if (key) {
            console.log(`Note On: ${key} (Velocity: ${velocity})`);
            noteDisplay.textContent = `Current Note: ${key}`;
            activeKey = key;
            highlightKey(key);
            playSynth(notesFrequencies[key.replace('m', '')]);
        }
    } else if (status === 128 || (status === 144 && velocity === 0)) { // Note Off or velocity 0
        const key = midiKeys[note];
        if (key) {
            console.log(`Note Off: ${key}`);
            noteDisplay.textContent = 'Current Note: None';
        }
        activeKey = null;
        drawCircle();
    }
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const clickedKeyData = getKeyFromClick(mouseX, mouseY);
    if (!clickedKeyData) return;
    const {key: clickedKey, isMinor} = clickedKeyData;
    if (clickedKey) {
        playSynth(notesFrequencies[clickedKey.replace('m', '')]); // Strip 'm' for minor keys
    }
});

// Initial render
drawCircle();