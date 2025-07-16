function loadSettingsFromURL() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("blur")) blurAmount = parseFloat(params.get("blur"));
  if (params.has("radius")) circleRadius = parseFloat(params.get("radius"));
  if (params.has("shadow")) shadowBlur = parseFloat(params.get("shadow"));
  if (params.has("count")) numPoints = parseInt(params.get("count"));
  if (params.has("smoothness")) smoothnessFactor = parseFloat(params.get("smoothness"));
  if (params.has("speed")) speedFactor = parseFloat(params.get("speed"));

  // Load colors from URL
  if (params.has("colors")) {
    colors = params.get("colors").split(',').map(hex => `#${hex}`);
  }

  // Set slider UI values
  if (params.has("hue")) document.getElementById("hueSlider").value = params.get("hue");
  if (params.has("brightness")) document.getElementById("brightnessSlider").value = params.get("brightness");
  if (params.has("saturation")) document.getElementById("saturationSlider").value = params.get("saturation");

  // Apply hue/brightness/saturation to current colors (not defaults)
  applyAdjustments();

  // Update the UI with the modified color palette
  updateColorUI();
}




const canvas = document.getElementById("gradientCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const glassEffect = document.getElementById("glassEffect");

const defaultSettings = {
  blur: 90,
  radius: 100,
  shadow: 4,
  count: 120,
  smoothness: 6.6,
  speed: 1.7,
  colors: ['#fffd8c', '#97fff4', '#ff6b6b', '#7091f5', '#d6a3ff', '#bae9bd', '#535ef9']
};

let blurAmount = defaultSettings.blur;
let circleRadius = defaultSettings.radius;
let shadowBlur = defaultSettings.shadow;
let numPoints = defaultSettings.count;
let smoothnessFactor = defaultSettings.smoothness;
let speedFactor = defaultSettings.speed;
let colors = [...defaultSettings.colors];

let colorProgress = new Array(numPoints).fill(0.5);
let points = [];
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let isMouseMoving = false;
let mouseInactiveTimer = null;

// ========== Point Initialization ==========
function initPoints(count) {
  points = [];
  colorProgress = new Array(count).fill(0.5);
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      dx: (Math.random() - 0.5) * speedFactor,
      dy: (Math.random() - 0.5) * speedFactor,
      radius: circleRadius,
      randomOffset: Math.random() * 0.2,
      isMovingToMouse: false,
    });
  }
}

// ========== Mouse Tracking ==========
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  isMouseMoving = true;
  clearTimeout(mouseInactiveTimer);
  mouseInactiveTimer = setTimeout(() => isMouseMoving = false, 1000);
});

// ========== Color Utilities ==========
function hexToRgb(hex) {
  return {
    r: parseInt(hex.substr(1, 2), 16),
    g: parseInt(hex.substr(3, 2), 16),
    b: parseInt(hex.substr(5, 2), 16)
  };
}

function interpolateColors(c1, c2, t) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`;
}

function getGradientColor(progress, offset) {
  const count = colors.length - 1;
  const t = (progress + offset) * (count - 1);
  const i = Math.floor(t) + 1;
  const next = (i + 1 > count) ? 1 : i + 1;
  return interpolateColors(colors[i], colors[next], t - Math.floor(t));
}

// ========== Animation ==========
function createFluidEffect() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.forEach((p, i) => {
    const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
    const t = dist / Math.hypot(canvas.width, canvas.height);
    if (isMouseMoving) colorProgress[i] += (t - colorProgress[i]) * 0.05;

    const color = getGradientColor(colorProgress[i], p.randomOffset);
    const maxDistForPush = 160;

    if (dist < maxDistForPush) {
      const angle = Math.atan2(mouseY - p.y, mouseX - p.x);
      const smoothFactor = 1 - t;
      p.x -= Math.cos(angle) * smoothnessFactor * smoothFactor;
      p.y -= Math.sin(angle) * smoothnessFactor * smoothFactor;
    }

    if (!isMouseMoving && !p.isMovingToMouse) {
      const angleToMouse = Math.atan2(mouseY - p.y, mouseX - p.x);
      p.x += Math.cos(angleToMouse) * 0.5;
      p.y += Math.sin(angleToMouse) * 0.5;
      p.isMovingToMouse = true;
      setTimeout(() => p.isMovingToMouse = false, 1000);
    }

    p.x += p.dx;
    p.y += p.dy;

    if (p.x < -circleRadius) p.x = canvas.width + circleRadius;
    if (p.x > canvas.width + circleRadius) p.x = -circleRadius;
    if (p.y < -circleRadius) p.y = canvas.height + circleRadius;
    if (p.y > canvas.height + circleRadius) p.y = -circleRadius;

    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
  requestAnimationFrame(createFluidEffect);
}

// ========== UI & Controls ==========
const blurSlider = document.getElementById("blurSlider");
const radiusSlider = document.getElementById("radiusSlider");
const shadowSlider = document.getElementById("shadowSlider");
const smoothnessSlider = document.getElementById("smoothnessSlider");
const speedSlider = document.getElementById("speedSlider");
const circleCountSlider = document.getElementById("circleCountSlider");
const circleCountValue = document.getElementById("circleCountValue");
const colorPaletteList = document.getElementById("colorPaletteList");

blurSlider.addEventListener("input", () => {
  blurAmount = parseInt(blurSlider.value);
  glassEffect.style.backdropFilter = `blur(${blurAmount}px)`;
});
radiusSlider.addEventListener("input", () => {
  circleRadius = parseInt(radiusSlider.value);
});
shadowSlider.addEventListener("input", () => {
  shadowBlur = parseInt(shadowSlider.value);
});
smoothnessSlider.addEventListener("input", () => {
  smoothnessFactor = parseFloat(smoothnessSlider.value);
});
speedSlider.addEventListener("input", () => {
  speedFactor = parseFloat(speedSlider.value);
  points.forEach(p => {
    p.dx = (Math.random() - 0.5) * speedFactor;
    p.dy = (Math.random() - 0.5) * speedFactor;
  });
});
circleCountSlider.addEventListener("input", () => {
  numPoints = parseInt(circleCountSlider.value);
  circleCountValue.textContent = numPoints;
  initPoints(numPoints);
});

// ========== Palette UI ==========
function updateColorUI() {
  colorPaletteList.innerHTML = '';
  colors.forEach((hex, i) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    const input = document.createElement("input");

    label.textContent = hex;
    input.type = "color";
    input.className = "colorInput";
    input.value = hex;

    input.addEventListener("input", (e) => {
      colors[i] = e.target.value;
      label.textContent = e.target.value;
      if (i === 0) document.body.style.backgroundColor = e.target.value;
    });

    li.appendChild(label);
    li.appendChild(input);
    colorPaletteList.appendChild(li);
  });
  document.body.style.backgroundColor = colors[0];
}

document.getElementById("changeColorButton").addEventListener("click", () => {
  colors = [`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`].concat(
    Array.from({ length: 6 }, () =>
      `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`)
  );
  updateColorUI();
});

// ========== Reset Visual Sliders ==========
document.getElementById("resetDefaultsBtn").addEventListener("click", () => {
  blurAmount = defaultSettings.blur;
  circleRadius = defaultSettings.radius;
  shadowBlur = defaultSettings.shadow;
  smoothnessFactor = defaultSettings.smoothness;
  speedFactor = defaultSettings.speed;
  numPoints = defaultSettings.count;

  // Reset sliders
  blurSlider.value = blurAmount;
  radiusSlider.value = circleRadius;
  shadowSlider.value = shadowBlur;
  smoothnessSlider.value = smoothnessFactor;
  speedSlider.value = speedFactor;
  circleCountSlider.value = numPoints;
  circleCountValue.textContent = numPoints;

  // Apply effects
  glassEffect.style.backdropFilter = `blur(${blurAmount}px)`;
  initPoints(numPoints);

  // Refresh slider UI gradient fill
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--value', `${value}%`);
  });
});

// ========== Color Adjustment Sliders ==========
const hueSlider = document.getElementById("hueSlider");
const brightnessSlider = document.getElementById("brightnessSlider");
const saturationSlider = document.getElementById("saturationSlider");
const resetPaletteSlidersBtn = document.getElementById("resetPaletteSlidersBtn");

function applyAdjustments() {
  const hue = parseInt(hueSlider.value);
  const brightness = parseInt(brightnessSlider.value);
  const saturation = parseInt(saturationSlider.value);

  colors = colors.map(hex => {
    let { r, g, b } = hexToRgb(hex);

    // Convert to HSL
    let [h, s, l] = rgbToHsl(r, g, b);

    // Apply adjustments
    h = (h * 360 + hue + 360) % 360 / 360;
    s = clamp(s + saturation / 100, 0, 1);
    l = clamp(l + brightness / 100, 0, 1);

    // Convert back to RGB
    const [nr, ng, nb] = hslToRgb(h, s, l);
    return `#${componentToHex(nr)}${componentToHex(ng)}${componentToHex(nb)}`;
  });

  updateColorUI();
}

// ========== Utility Functions for Color Adjustment ==========
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

// ========== Event Listeners for Sliders ==========
[hueSlider, brightnessSlider, saturationSlider].forEach(slider => {
  slider.addEventListener("input", applyAdjustments);
});

resetPaletteSlidersBtn.addEventListener("click", () => {
  // Reset values
  hueSlider.value = 0;
  brightnessSlider.value = 0;
  saturationSlider.value = 0;

  // Reset colors
  colors = [...defaultSettings.colors];
  updateColorUI();

  // Update slider fill gradients
  [hueSlider, brightnessSlider, saturationSlider].forEach(slider => {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--value', `${value}%`);
  });
});

// ========== Toggle Panel Button ==========
const toggleBtn = document.getElementById("togglePanelBtn");
const panelContainer = document.getElementById("panelContainer");

toggleBtn.addEventListener("click", () => {
  const isHidden = panelContainer.classList.toggle("hidden");
  document.body.classList.toggle("panels-hidden", isHidden); // Important fix for fade logic
  toggleBtn.textContent = isHidden ? "☰ Show Controls" : "☰ Hide Controls";
});

document.querySelectorAll('input[type="range"]').forEach(slider => {
  const updateGradient = () => {
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--value', `${value}%`);
  };
  slider.addEventListener('input', updateGradient);
  updateGradient(); // initialize
});

// ========== Collapse/Expand Panel Logic ==========
document.querySelectorAll(".collapseBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const panel = btn.closest(".mini-panel");
    const isCollapsed = panel.classList.toggle("collapsed");

    btn.textContent = isCollapsed ? "+" : "−";
  });
});
function generateEmbedCode() {
  const baseURL = "https://jtxaudrey.github.io/Gradient-Generator/";

  const params = new URLSearchParams();
  params.set("blur", blurAmount);
  params.set("radius", circleRadius);
  params.set("shadow", shadowBlur);
  params.set("count", numPoints);
  params.set("smoothness", smoothnessFactor);
  params.set("speed", speedFactor);
  params.set("colors", colors.map(c => c.replace('#', '')).join(','));

  // Grab hue/brightness/saturation
  const hueVal = parseInt(document.getElementById("hueSlider").value);
  const brightnessVal = parseInt(document.getElementById("brightnessSlider").value);
  const saturationVal = parseInt(document.getElementById("saturationSlider").value);

  params.set("hue", hueVal);
  params.set("brightness", brightnessVal);
  params.set("saturation", saturationVal);

  const fullURL = `${baseURL}?${params.toString()}`;

  const iframeCode = `<iframe src="${fullURL}" width="100%" height="100%" style="border:0;position:absolute;top:0;left:0;z-index:-1;" allowfullscreen></iframe>`;

  document.getElementById("embedOutput").value = iframeCode;
}
// ========== Init ==========
loadSettingsFromURL();                          // FIRST - load URL settings
glassEffect.style.backdropFilter = `blur(${blurAmount}px)`;  // THEN apply blur
updateColorUI();                                // THEN update color swatches
initPoints(numPoints);                          // THEN initialize points
createFluidEffect();                            // THEN start animation

// ========== Optional: Hide UI in Embed Mode ==========
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("embed") === "true") {
  document.body.classList.add("embed-mode");
}
function copyCustomURL() { 
  const baseURL = "https://jtxaudrey.github.io/Gradient-Generator/";

  const params = new URLSearchParams();
  params.set("blur", blurAmount);
  params.set("radius", circleRadius);
  params.set("shadow", shadowBlur);
  params.set("count", numPoints);
  params.set("smoothness", smoothnessFactor);
  params.set("speed", speedFactor);
  params.set("colors", colors.map(c => c.replace('#', '')).join(','));

  const hueVal = parseInt(document.getElementById("hueSlider").value);
  const brightnessVal = parseInt(document.getElementById("brightnessSlider").value);
  const saturationVal = parseInt(document.getElementById("saturationSlider").value);
  params.set("hue", hueVal);
  params.set("brightness", brightnessVal);
  params.set("saturation", saturationVal);
  params.set("embed", "true");

  const fullURL = `${baseURL}?${params.toString()}`;
  
  // NEW: Modern clipboard copy
  navigator.clipboard.writeText(fullURL).then(() => {
    console.log("Copied to clipboard:", fullURL);
  }).catch(err => {
    console.error("Failed to copy:", err);
  });

}