// Main game variables
let scene, camera, renderer;
let player, enemies = [], bullets = [], enemyBullets = [];
let score = 0, highScore = 0, health = 100, lives = 3, currentLevel = 1;
let gameActive = false, gamePaused = false;
let clock = new THREE.Clock();
let lastShotTime = 0;
let shootCooldown = 0.2; // seconds between shots

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const healthElement = document.getElementById('health');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const enemiesElement = document.getElementById('enemies');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const levelStartElement = document.getElementById('level-start');
const levelDisplayElement = document.getElementById('level-display');
const levelMessageElement = document.getElementById('level-message');
const pauseMenuElement = document.getElementById('pause-menu');
const restartBtn = document.getElementById('restart-btn');
const resumeBtn = document.getElementById('resume-btn');

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 10;
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').prepend(renderer.domElement);
    
    // Create player (a simple ship)
    createPlayer();
    
    // Start the game
    startGame();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restartBtn.addEventListener('click', startGame);
    resumeBtn.addEventListener('click', togglePause);
}

// Create player ship
function createPlayer() {
    const geometry = new THREE.ConeGeometry(1, 2, 4);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x004444,
        specular: 0x00ffff,
        shininess: 100
    });
    player = new THREE.Mesh(geometry, material);
    player.rotation.x = Math.PI / 2;
    player.position.y = -10;
    scene.add(player);
}

// Create enemy
function createEnemy(type = 'basic') {
    let geometry, material;
    
    if (type === 'basic') {
        geometry = new THREE.OctahedronGeometry(1);
        material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x440000,
            specular: 0xff0000
        });
    } else if (type === 'fast') {
        geometry = new THREE.TetrahedronGeometry(0.8);
        material = new THREE.MeshPhongMaterial({ 
            color: 0xff8800,
            emissive: 0x442200,
            specular: 0xff8800
        });
    } else { // strong
        geometry = new THREE.DodecahedronGeometry(1.2);
        material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            emissive: 0x004400,
            specular: 0x00ff00
        });
    }
    
    const enemy = new THREE.Mesh(geometry, material);
    
    // Position enemy at random point on a circular path
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 10;
    enemy.position.x = Math.cos(angle) * radius;
    enemy.position.z = Math.sin(angle) * radius;
    enemy.position.y = 10 + Math.random() * 5;
    
    // Store enemy properties
    enemy.userData = {
        type: type,
        health: type === 'basic' ? 1 : type === 'fast' ? 1 : 3,
        speed: type === 'basic' ? 0.5 : type === 'fast' ? 1.5 : 0.3,
        value: type === 'basic' ? 100 : type === 'fast' ? 150 : 200,
        lastShotTime: 0,
        shootCooldown: type === 'basic' ? 3 : type === 'fast' ? 2 : 4
    };
    
    scene.add(enemy);
    enemies.push(enemy);
    updateEnemyCount();
}

// Create bullet
function createBullet(position, direction, isPlayer = true) {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: isPlayer ? 0x00ffff : 0xff0000,
        emissive: isPlayer ? 0x004444 : 0x440000
    });
    const bullet = new THREE.Mesh(geometry, material);
    
    bullet.position.copy(position);
    bullet.userData = {
        direction: direction.clone().normalize(),
        speed: isPlayer ? 1.5 : 1,
        isPlayer: isPlayer,
        damage: isPlayer ? 1 : 0.5
    };
    
    scene.add(bullet);
    if (isPlayer) {
        bullets.push(bullet);
    } else {
        enemyBullets.push(bullet);
    }
}

// Start a new game
function startGame() {
    // Reset game state
    score = 0;
    health = 100;
    lives = 3;
    currentLevel = 1;
    
    // Clear all objects
    clearObjects();
    
    // Hide game over screen
    gameOverElement.style.display = 'none';
    
    // Show level start screen
    levelDisplayElement.textContent = currentLevel;
    levelMessageElement.textContent = getLevelMessage(currentLevel);
    levelStartElement.style.display = 'block';
    
    // Start level after delay
    setTimeout(() => {
        levelStartElement.style.display = 'none';
        gameActive = true;
        spawnEnemiesForLevel(currentLevel);
    }, 2000);
    
    // Update HUD
    updateHUD();
}

// Spawn enemies for current level
function spawnEnemiesForLevel(level) {
    const baseCount = 5 + level * 2;
    const count = Math.min(baseCount, 20); // Cap at 20 enemies
    
    for (let i = 0; i < count; i++) {
        let type;
        const rand = Math.random();
        
        if (level < 3) {
            type = 'basic';
        } else if (level < 6) {
            type = rand < 0.7 ? 'basic' : 'fast';
        } else {
            if (rand < 0.5) type = 'basic';
            else if (rand < 0.8) type = 'fast';
            else type = 'strong';
        }
        
        createEnemy(type);
    }
    
    updateEnemyCount();
}

// Clear all game objects
function clearObjects() {
    // Remove all enemies
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];
    
    // Remove all bullets
    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];
    
    enemyBullets.forEach(bullet => scene.remove(bullet));
    enemyBullets = [];
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameActive || gamePaused) return;
    
    const delta = clock.getDelta();
    
    // Update player
    updatePlayer(delta);
    
    // Update enemies
    updateEnemies(delta);
    
    // Update bullets
    updateBullets(delta);
    
    // Check collisions
    checkCollisions();
    
    // Render scene
    renderer.render(scene, camera);
}

// Update player position based on input
const keys = {};
function updatePlayer(delta) {
    const speed = 5 * delta;
    
    if (keys['ArrowLeft'] || keys['a']) {
        player.position.x -= speed;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.position.x += speed;
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.position.z -= speed;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.position.z += speed;
    }
    
    // Keep player within bounds
    player.position.x = Math.max(-15, Math.min(15, player.position.x));
    player.position.z = Math.max(-15, Math.min(15, player.position.z));
    
    // Player shooting
    if (keys[' '] && clock.getElapsedTime() - lastShotTime > shootCooldown) {
        shoot();
        lastShotTime = clock.getElapsedTime();
    }
}

// Player shooting
function shoot() {
    const direction = new THREE.Vector3(0, 1, 0);
    createBullet(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), direction, true);
}

// Update enemies
function updateEnemies(delta) {
    enemies.forEach(enemy => {
        // Move toward player
        const direction = new THREE.Vector3().subVectors(
            new THREE.Vector3(player.position.x, enemy.position.y, player.position.z),
            enemy.position
        ).normalize();
        
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed * delta));
        
        // Enemy shooting
        if (clock.getElapsedTime() - enemy.userData.lastShotTime > enemy.userData.shootCooldown) {
            const shootDirection = new THREE.Vector3().subVectors(
                player.position,
                enemy.position
            ).normalize();
            
            createBullet(enemy.position.clone(), shootDirection, false);
            enemy.userData.lastShotTime = clock.getElapsedTime();
        }
        
        // Rotate enemy for visual effect
        enemy.rotation.x += 0.01;
        enemy.rotation.y += 0.01;
    });
}

// Update bullets
function updateBullets(delta) {
    // Player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * 50 * delta));
        
        // Remove if out of bounds
        if (bullet.position.y > 30 || bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
    
    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * 40 * delta));
        
        // Remove if out of bounds
        if (bullet.position.y < -20 || bullet.position.length() > 50) {
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
        }
    }
}

// Check collisions
function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (bullet.position.distanceTo(enemy.position) < 1.5) {
                // Hit!
                enemy.userData.health -= bullet.userData.damage;
                
                // Remove bullet
                scene.remove(bullet);
                bullets.splice(i, 1);
                
                // Check if enemy is dead
                if (enemy.userData.health <= 0) {
                    // Add score
                    score += enemy.userData.value;
                    if (score > highScore) {
                        highScore = score;
                        highScoreElement.textContent = highScore;
                    }
                    scoreElement.textContent = score;
                    
                    // Remove enemy
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    updateEnemyCount();
                }
                
                break;
            }
        }
    }
    
    // Enemy bullets hitting player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (bullet.position.distanceTo(player.position) < 1.5) {
            // Hit player!
            health -= bullet.userData.damage * 10;
            healthElement.textContent = Math.max(0, health);
            
            // Remove bullet
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
            
            // Check if player is dead
            if (health <= 0) {
                lives--;
                livesElement.textContent = lives;
                
                if (lives <= 0) {
                    gameOver();
                } else {
                    // Respawn
                    health = 100;
                    healthElement.textContent = health;
                    player.position.set(0, -10, 0);
                }
            }
        }
    }
    
    // Check if all enemies are dead
    if (enemies.length === 0 && gameActive) {
        nextLevel();
    }
}

// Advance to next level
function nextLevel() {
    currentLevel++;
    levelElement.textContent = currentLevel;
    
    // Show level start screen
    levelDisplayElement.textContent = currentLevel;
    levelMessageElement.textContent = getLevelMessage(currentLevel);
    levelStartElement.style.display = 'block';
    
    // Start next level after delay
    setTimeout(() => {
        levelStartElement.style.display = 'none';
        spawnEnemiesForLevel(currentLevel);
    }, 2000);
}

// Game over
function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
}

// Toggle pause
function togglePause() {
    gamePaused = !gamePaused;
    pauseMenuElement.style.display = gamePaused ? 'block' : 'none';
}

// Update HUD
function updateHUD() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    healthElement.textContent = health;
    livesElement.textContent = lives;
    levelElement.textContent = currentLevel;
}

// Update enemy count display
function updateEnemyCount() {
    enemiesElement.textContent = enemies.length;
}

// Get level message
function getLevelMessage(level) {
    const messages = [
        "Beginner's luck?",
        "Getting serious now",
        "Can you handle this?",
        "The challenge increases",
        "No turning back now",
        "Are you still with us?",
        "This is getting intense",
        "You're a true warrior",
        "Almost there...",
        "Final challenge!"
    ];
    
    return level <= messages.length ? messages[level - 1] : "Endless mode!";
}

// Event handlers
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
    
    // Pause game
    if (event.key.toLowerCase() === 'p') {
        togglePause();
    }
}

function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}

// Initialize and start the game
init();
animate();
