// Web App: Antenna Array Simulator

// HTML setup
document.body.innerHTML = `
<div style="display: flex; flex-direction: column; justify-content: center; width: 800px; margin: 0 auto;">
  <canvas id="gridCanvas" width="800" height="800" style="border:1px solid black;"></canvas>
  <div style="display: flex; justify-content: space-between; margin-top: 10px;">
  <div>
    <button id="editModeButton">Edit Mode</button>
    <button id="targetModeButton">Target Mode</button>
  </div>
  <div>
    <a href="https://github.com/skaramicke/phased-array" target="_blank">View on GitHub</a>
  </div>
  </div>
  <div>
    <label><input type="checkbox" id="showPropagation" checked /> Show Propagation</label>
    <label><input type="checkbox" id="showEmissionCircles" checked /> Show Emission Circles</label>
  </div>
  <div>
    <label for="speedControl">Speed: </label>
    <input id="speedControl" type="number" value="2" step="0.1" min="0.1" />
  </div>
  <p>Click on the canvas to place antennas or select transmission direction.</p>
  <pre id="testResults"></pre>
  </div>
`;

const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 10; // Number of grid cells per side
const cellSize = canvas.width / gridSize;

const antennas = []; // Array to store antenna positions
let target = null; // The transmission direction target
let mode = "edit"; // Current mode: 'edit' or 'target'
let draggingAntenna = null; // Currently dragged antenna
let time = 0; // Time variable for animation
let speed = 2; // Speed of animation

// UI controls
const editModeButton = document.getElementById("editModeButton");
const targetModeButton = document.getElementById("targetModeButton");
const showPropagationCheckbox = document.getElementById("showPropagation");
const showEmissionCirclesCheckbox = document.getElementById(
  "showEmissionCircles"
);
const speedControl = document.getElementById("speedControl");
const testResults = document.getElementById("testResults");

editModeButton.addEventListener("click", () => {
  mode = "edit";
});
targetModeButton.addEventListener("click", () => {
  mode = "target";
});

// Event listener for speed control
speedControl.addEventListener("input", () => {
  speed = parseFloat(speedControl.value);
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (mode === "edit") {
    // Check if an antenna is being dragged
    for (const antenna of antennas) {
      const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
      if (distance < cellSize / 4) {
        draggingAntenna = antenna;
        return;
      }
    }

    // Otherwise, create a new antenna
    antennas.push({ x, y });
    draw(); // Recalculate and redraw after adding
  } else if (mode === "target") {
    // Set the target position
    target = { x, y };
    draw(); // Recalculate and redraw after setting the target
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!draggingAntenna) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  draggingAntenna.x = x;
  draggingAntenna.y = y;
  draw();
});

canvas.addEventListener("mouseup", () => {
  draggingAntenna = null;
});

function runTests() {
  const wavelengthPixels = cellSize; // Wavelength in pixels

  const tests = [
    {
      description: "Two antennas inline with target",
      antennas: [
        { x: -1, y: 0 }, // -1 wavelength on X-axis
        { x: 1, y: 0 }, // 1 wavelength on X-axis
      ],
      target: { x: 0, y: -2 }, // -2 wavelengths on Y-axis
      expectedPhases: [0, 0], // Expect same phase for both
    },
    {
      description: "Two antennas off-center target",
      antennas: [
        { x: -1, y: 0 }, // -1 wavelength on X-axis
        { x: 1, y: 0 }, // 1 wavelength on X-axis
      ],
      target: { x: 1, y: -2 }, // 1 wavelength on X-axis, -2 wavelengths on Y-axis
      expectedPhases: [0, ">0"], // Second phase should lead
    },
  ];

  let results = "";
  for (const test of tests) {
    antennas.length = 0;
    // Convert test coordinates to pixels
    antennas.push(
      ...test.antennas.map((a) => ({
        x: canvas.width / 2 + a.x * wavelengthPixels,
        y: canvas.height / 2 + a.y * wavelengthPixels,
      }))
    );
    target = {
      x: canvas.width / 2 + test.target.x * wavelengthPixels,
      y: canvas.height / 2 + test.target.y * wavelengthPixels,
    };

    const phases = calculatePhases();

    let pass = true;
    const details = [];
    for (let i = 0; i < test.expectedPhases.length; i++) {
      const expected = test.expectedPhases[i];
      const actual = (phases[i] * (180 / Math.PI)) % 360; // Phase in degrees
      details.push(
        `Antenna ${i + 1}: Phase = ${actual.toFixed(
          2
        )} degrees (Expected: ${expected})`
      );
      if (expected === 0 && Math.abs(actual) > 1e-2) {
        pass = false;
      } else if (expected === ">0" && actual <= 0) {
        pass = false;
      }
    }

    results += `<div class="test-result" data-test-index="${tests.indexOf(
      test
    )}">
      <strong>${test.description}:</strong> ${
      pass
        ? "<span style='color: green'>PASS</span>"
        : "<span style='color: red'>FAIL</span>"
    }
      <br>${details.join("<br>")}
    </div><br>`;
  }

  testResults.innerHTML = results;
  document.querySelectorAll(".test-result").forEach((element) => {
    element.addEventListener("click", (e) => {
      const index = parseInt(e.currentTarget.dataset.testIndex, 10);
      loadTestConfiguration(tests[index]);
    });
  });
}

function loadTestConfiguration(test) {
  const wavelengthToPixels = cellSize; // One wavelength equals the size of a grid cell

  antennas.length = 0;
  antennas.push(
    ...test.antennas.map((a) => ({
      x: canvas.width / 2 + a.x * wavelengthToPixels,
      y: canvas.height / 2 + a.y * wavelengthToPixels,
    }))
  );
  target = {
    x: canvas.width / 2 + test.target.x * wavelengthToPixels,
    y: canvas.height / 2 + test.target.y * wavelengthToPixels,
  };
  draw();
  markExpectedResult(test);
}

function markExpectedResult(test) {
  if (test.target) {
    ctx.beginPath();
    ctx.arc(test.target.x, test.target.y, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function calculatePhases() {
  if (!target || antennas.length === 0) return [];

  const wavelengthPixels = cellSize; // Wavelength in pixels

  // Calculate the distance from each antenna to the target in wavelengths
  const distances = antennas.map((antenna) => {
    const dx = (target.x - antenna.x) / wavelengthPixels;
    const dy = (target.y - antenna.y) / wavelengthPixels;
    return Math.sqrt(dx ** 2 + dy ** 2); // Distance in wavelengths
  });

  // Find the back-most antenna (the one with the maximum distance to the target)
  const maxDistance = Math.max(...distances);

  // Calculate the phase delay for each antenna relative to the back-most antenna
  const phases = distances.map((distance) => {
    const phaseDelay = (maxDistance - distance) * 2 * Math.PI; // Phase delay in radians
    return phaseDelay;
  });

  return phases;
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.strokeStyle = "#ddd";
    ctx.stroke();
  }
}

const baseResolution = 4; // Start with a coarser resolution
function drawPropagation() {
  const speed = 2; // Shared speed in pixels per frame
  const wavelength = cellSize; // Wavelength in pixels
  const resolution = 4; // Resolution for the propagation grid
  const phases = calculatePhases(); // Get the calculated phases for each antenna

  for (let x = 0; x < canvas.width; x += resolution) {
    for (let y = 0; y < canvas.height; y += resolution) {
      let intensity = 0;

      for (let i = 0; i < antennas.length; i++) {
        const antenna = antennas[i];
        const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
        const phase =
          (distance / wavelength) * 2 * Math.PI -
          ((time * speed) / wavelength) * 2 * Math.PI +
          phases[i]; // Include the phase shift for each antenna
        intensity += Math.sin(phase);
      }

      intensity = Math.abs(intensity) / antennas.length;
      ctx.fillStyle = `rgba(0, 255, 0, ${intensity})`;
      ctx.fillRect(x, y, resolution, resolution);
    }
  }
}

function drawAntennas(phases = []) {
  for (let i = 0; i < antennas.length; i++) {
    const antenna = antennas[i];
    ctx.beginPath();
    ctx.arc(antenna.x, antenna.y, cellSize / 4, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();

    // Draw phase angle
    if (phases[i] !== undefined) {
      const phaseDegrees = (phases[i] * (180 / Math.PI)) % 360; // Convert radians to degrees
      ctx.fillStyle = "white";
      ctx.font = `${cellSize / 6}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(phaseDegrees.toFixed(2), antenna.x, antenna.y);
    }
  }
}

function drawEmissionCircles() {
  const speed = 2; // Shared speed in pixels per frame
  const wavelength = cellSize; // Wavelength in pixels
  const maxRadius = canvas.width; // Maximum radius for the circles
  const phases = calculatePhases(); // Get the calculated phases for each antenna

  antennas.forEach((antenna, i) => {
    // Correctly calculate the base radius with modulo operation
    const baseRadius =
      (((time * speed) % wavelength) +
        (phases[i] / (2 * Math.PI)) * wavelength) %
      wavelength;

    // Draw concentric circles to cover the canvas
    for (let radius = baseRadius; radius < maxRadius; radius += wavelength) {
      // Draw current (red) circle
      ctx.beginPath();
      ctx.arc(antenna.x, antenna.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw voltage (blue) circle, starting earlier by half a wavelength
      const blueRadius = radius - wavelength / 2;
      if (blueRadius > 0) {
        ctx.beginPath();
        ctx.arc(antenna.x, antenna.y, blueRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });
}

function draw() {
  drawGrid();

  if (showPropagationCheckbox.checked) {
    drawPropagation(); // Draw propagation visualization
  }

  if (showEmissionCirclesCheckbox.checked) {
    drawEmissionCircles(); // Draw expanding emission circles
  }
  drawAntennas(calculatePhases());

  if (target) {
    ctx.beginPath();
    ctx.moveTo(target.x - 10, target.y);
    ctx.lineTo(target.x + 10, target.y);
    ctx.moveTo(target.x, target.y - 10);
    ctx.lineTo(target.x, target.y + 10);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
}

function animate() {
  time += speed * 0.1; // Increment time to animate wave propagation
  draw();
  requestAnimationFrame(animate);
}

runTests();

// Start animation
animate();
