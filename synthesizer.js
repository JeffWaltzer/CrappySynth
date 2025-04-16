
const canvas = document.getElementById('synthCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = Math.min(centerX, centerY) - 20;
const keys = [
  { key: 'C', freq: 261.63, color: '#FF5733' },
  { key: 'G', freq: 392.0, color: '#FFC300' },
  { key: 'D', freq: 293.66, color: '#DAF7A6' },
  { key: 'A', freq: 440.0, color: '#33FF57' },
  { key: 'E', freq: 329.63, color: '#33FFF4' },
  { key: 'B', freq: 493.88, color: '#337BFF' },
  { key: 'F#', freq: 369.99, color: '#8A33FF' },
  { key: 'Db', freq: 277.18, color: '#C70039' },
  { key: 'Ab', freq: 415.3, color: '#900C3F' },
  { key: 'Eb', freq: 311.13, color: '#581845' },
  { key: 'Bb', freq: 466.16, color: '#FFC0CB' },
  { key: 'F', freq: 349.23, color: '#FF8C00' },
];

keys.forEach((segment, index) => {
  const angle = (index / keys.length) * 2 * Math.PI;
  const nextAngle = ((index + 1) / keys.length) * 2 * Math.PI;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, angle, nextAngle);
  ctx.closePath();
  ctx.fillStyle = segment.color;
  ctx.fill();
  ctx.save();
  const textAngle = angle + (nextAngle - angle) / 2;
  const textX = centerX + radius / 1.5 * Math.cos(textAngle);
  const textY = centerY + radius / 1.5 * Math.sin(textAngle);
  ctx.translate(textX, textY);
  ctx.rotate(textAngle);
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';
  ctx.fillText(segment.key, -10, 5);
  ctx.restore();
});
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const dx = x - centerX;
  const dy = y - centerY;
  if (Math.sqrt(dx * dx + dy * dy) > radius) return;
  const angle = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor((angle / (2 * Math.PI)) * keys.length);
  playSound(keys[index].freq);
});
function playSound(frequency) {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  gainNode.gain.setValueAtTime(0.1, context.currentTime);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);
}
