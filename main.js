

// EMERGENCY START FIX - Add this to the TOP of main.js
document.getElementById('start-btn').addEventListener('click', function() {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.style.display = 'none';
  });
  
  // Force start the game
  gameState = gameState || {}; // Ensure gameState exists
  gameState.gameActive = true;
  gameState.gamePaused = false;
  
  // Start animation if not running
  if (typeof animate === 'function' && !gameState._animationStarted) {
    gameState._animationStarted = true;
    animate();
  }
  
  // Add temporary test object
  const testGeometry = new THREE.BoxGeometry();
  const testMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const testCube = new THREE.Mesh(testGeometry, testMaterial);
  scene.add(testCube);
  
  console.log("GAME FORCE STARTED - You should see a green cube");
});// SIMPLE THREE.JS TEST
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a test cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // RED cube
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

console.log("TEST: Three.js should show spinning red cube");
