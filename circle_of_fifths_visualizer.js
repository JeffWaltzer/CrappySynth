// Select or generate circle container
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
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
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

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