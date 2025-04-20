// Game State Management
const gameState = {
    // Three.js components
    scene: null,
    camera: null,
    renderer: null,
    
    // Game objects
    player: null,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    powerups: [],
    tunnel: null,
    
    // Game stats
    score: 0,
    highScore: localStorage.getItem('highScore') || 0,
    health: 100,
    lives: 3,
    currentLevel: 1,
    
    // Game status
    gameActive: false,
    gamePaused: false,
    
    // Timing controls
    clock: new THREE.Clock(),
    lastShotTime: 0,
    shootCooldown: 0.15,
    activePowerup: null,
    powerupEndTime: 0,
    lastFrameTime: 0,
    deltaTime: 0
};

// DOM References
const domElements = {
    scoreElement: document.getElementById('score'),
    healthElement: document.getElementById('health'),
    levelElement: document.getElementById('level'),
    powerElement: document.getElementById('power'),
    gameOverElement: document.getElementById('game-over'),
    restartBtn: document.getElementById('restart-btn'),
    powerupDisplay: document.getElementById('powerup-display'),
    startScreen: document.getElementById('start-screen'),
    startBtn: document.getElementById('start-btn'),
    pauseMenu: document.getElementById('pause-menu'),
    resumeBtn: document.getElementById('resume-btn'),
    finalScoreElement: document.getElementById('final-score'),
    highScoreElement: document.getElementById('high-score'),
    levelStartElement: document.getElementById('level-start'),
    levelDisplayElement: document.getElementById('level-display'),
    levelMessageElement: document.getElementById('level-message')
};

// Powerup System
const POWERUP_TYPES = {
    SPREAD: { 
        name: "TRIPLE SHOT", 
        duration: 10, 
        color: 0x00ff00,
        onActivate: () => sounds.powerup.play(),
        onDeactivate: () => {}
    },
    LASER: { 
        name: "LASER BEAM", 
        duration: 7, 
        color: 0xff0000,
        onActivate: () => sounds.powerup.play(),
        onDeactivate: () => {}
    },
    SHIELD: { 
        name: "SHIELD", 
        duration: 8, 
        color: 0x0000ff,
        onActivate: () => {
            gameState.player.material.color.setHex(0x00aaff);
            gameState.player.material.emissive.setHex(0x002266);
            sounds.powerup.play();
        },
        onDeactivate: () => {
            gameState.player.material.color.setHex(0x00ffff);
            gameState.player.material.emissive.setHex(0x004444);
        }
    }
};

// Sound Effects
const sounds = {
    shoot: new Howl({ src: ['assets/sounds/shoot.wav'], volume: 0.3 }),
    explosion: new Howl({ src: ['assets/sounds/explosion.wav'], volume: 0.5 }),
    powerup: new Howl({ src: ['assets/sounds/powerup.wav'], volume: 0.7 }),
    levelComplete: new Howl({ src: ['assets/sounds/level_complete.wav'], volume: 0.6 }),
    playerHit: new Howl({ src: ['assets/sounds/player_hit.wav'], volume: 0.8 }),
    gameOver: new Howl({ src: ['assets/sounds/game_over.wav'], volume: 0.7 })
};

// Input Handling
const keys = {};

// Initialization
function init() {
    setupScene();
    setupCamera();
    setupRenderer();
    createGameElements();
    setupEventListeners();
    showStartScreen();
    animate();
}

function setupScene() {
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x000000);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    gameState.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(0, 1, 0.5);
    directionalLight.castShadow = true;
    gameState.scene.add(directionalLight);
}

function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    gameState.camera.position.set(0, 15, 30);
    gameState.camera.lookAt(0, 0, 0);
}

function setupRenderer() {
    gameState.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    gameState.renderer.setPixelRatio(window.devicePixelRatio);
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.shadowMap.enabled = true;
    document.getElementById('game-container').prepend(gameState.renderer.domElement);
}

function createGameElements() {
    createTunnel();
    createPlayer();
}

function createTunnel() {
    const tunnelGeometry = new THREE.TorusGeometry(15, 3, 32, 100);
    const tunnelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3300ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    gameState.tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    gameState.tunnel.rotation.x = Math.PI / 2;
    gameState.scene.add(gameState.tunnel);
}

function createPlayer() {
    const geometry = new THREE.ConeGeometry(1.2, 2.5, 6);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x004444,
        specular: 0x00ffff,
        shininess: 100
    });
    gameState.player = new THREE.Mesh(geometry, material);
    gameState.player.rotation.x = Math.PI / 2;
    gameState.player.position.set(0, -10, 0);
    gameState.scene.add(gameState.player);
}

// Game Loop
function animate(currentTime = 0) {
    requestAnimationFrame(animate);
    
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    if (!gameState.gameActive || gameState.gamePaused) return;
    
    updateTunnel();
    updatePlayer(gameState.deltaTime);
    updateEnemies(gameState.deltaTime);
    updateBullets(gameState.deltaTime);
    updatePowerups();
    checkCollisions();
    
    gameState.renderer.render(gameState.scene, gameState.camera);
}

// Update Functions
function updateTunnel() {
    gameState.tunnel.rotation.z += 0.3 * gameState.deltaTime;
}

function updatePlayer(delta) {
    const speed = 8 * delta;
    
    if (keys['ArrowLeft'] || keys['a']) gameState.player.position.x -= speed;
    if (keys['ArrowRight'] || keys['d']) gameState.player.position.x += speed;
    if (keys['ArrowUp'] || keys['w']) gameState.player.position.z -= speed;
    if (keys['ArrowDown'] || keys['s']) gameState.player.position.z += speed;
    
    gameState.player.position.x = Math.max(-15, Math.min(15, gameState.player.position.x));
    gameState.player.position.z = Math.max(-15, Math.min(15, gameState.player.position.z));
    
    if ((keys[' '] || keys['Spacebar']) && 
        gameState.clock.getElapsedTime() - gameState.lastShotTime > gameState.shootCooldown) {
        shoot();
        gameState.lastShotTime = gameState.clock.getElapsedTime();
    }
}

function shoot() {
    if (gameState.activePowerup === 'SPREAD') {
        [-0.2, 0, 0.2].forEach(angle => {
            const direction = new THREE.Vector3(angle, 1, 0).normalize();
            createBullet(gameState.player.position.clone(), direction, true);
        });
    } else if (gameState.activePowerup === 'LASER') {
        const laser = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 30, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        laser.position.copy(gameState.player.position);
        laser.position.y += 15;
        laser.rotation.x = Math.PI / 2;
        gameState.scene.add(laser);
        setTimeout(() => gameState.scene.remove(laser), 100);
        
        gameState.enemies.forEach(enemy => {
            if (Math.abs(enemy.position.x - gameState.player.position.x) < 2) {
                enemy.userData.health -= 3;
                if (enemy.userData.health <= 0) destroyEnemy(enemy);
            }
        });
    } else {
        createBullet(gameState.player.position.clone(), new THREE.Vector3(0, 1, 0), true);
    }
    sounds.shoot.play();
}

function updateEnemies(delta) {
    gameState.enemies.forEach(enemy => {
        const direction = new THREE.Vector3().subVectors(
            new THREE.Vector3(
                gameState.player.position.x, 
                enemy.position.y, 
                gameState.player.position.z
            ),
            enemy.position
        ).normalize();
        
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed * delta));
        
        if (gameState.clock.getElapsedTime() - enemy.userData.lastShotTime > enemy.userData.shootCooldown) {
            const shootDirection = new THREE.Vector3().subVectors(
                gameState.player.position,
                enemy.position
            ).normalize();
            
            createBullet(enemy.position.clone(), shootDirection, false);
            enemy.userData.lastShotTime = gameState.clock.getElapsedTime();
        }
        
        enemy.rotation.x += delta;
        enemy.rotation.y += delta;
    });
}

function updateBullets(delta) {
    // Player bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * 50 * delta));
        
        if (bullet.position.y > 30 || gameState.clock.getElapsedTime() - bullet.userData.startTime > bullet.userData.lifetime) {
            gameState.scene.remove(bullet);
            gameState.bullets.splice(i, 1);
        }
    }
    
    // Enemy bullets
    for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = gameState.enemyBullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * 40 * delta));
        
        if (bullet.position.y < -20 || gameState.clock.getElapsedTime() - bullet.userData.startTime > bullet.userData.lifetime) {
            gameState.scene.remove(bullet);
            gameState.enemyBullets.splice(i, 1);
        }
    }
}

// Powerup System
function spawnPowerUp() {
    if (Math.random() < 0.12) {
        const types = Object.keys(POWERUP_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const powerup = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshPhongMaterial({ color: POWERUP_TYPES[type].color })
        );
        
        powerup.position.set(
            (Math.random() * 20) - 10,
            0,
            (Math.random() * 20) - 10
        );
        
        powerup.userData = { type, rotationSpeed: (Math.random() * 0.02) + 0.03 };
        gameState.scene.add(powerup);
        gameState.powerups.push(powerup);
    }
}

function updatePowerups() {
    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
        const powerup = gameState.powerups[i];
        powerup.rotation.x += powerup.userData.rotationSpeed;
        powerup.rotation.y += powerup.userData.rotationSpeed;
        
        if (gameState.player.position.distanceTo(powerup.position) < 1.5) {
            activatePowerup(powerup.userData.type);
            gameState.scene.remove(powerup);
            gameState.powerups.splice(i, 1);
        }
    }
}

function activatePowerup(type) {
    if (gameState.activePowerup && POWERUP_TYPES[gameState.activePowerup].onDeactivate) {
        POWERUP_TYPES[gameState.activePowerup].onDeactivate();
    }
    
    gameState.activePowerup = type;
    gameState.powerupEndTime = gameState.clock.getElapsedTime() + POWERUP_TYPES[type].duration;
    domElements.powerElement.textContent = POWERUP_TYPES[type].name;
    domElements.powerupDisplay.textContent = `ACTIVE: ${POWERUP_TYPES[type].name}`;
    domElements.powerupDisplay.style.color = `#${POWERUP_TYPES[type].color.toString(16)}`;
    
    if (POWERUP_TYPES[type].onActivate) {
        POWERUP_TYPES[type].onActivate();
    }
}

function checkPowerups() {
    if (gameState.activePowerup && gameState.clock.getElapsedTime() > gameState.powerupEndTime) {
        if (POWERUP_TYPES[gameState.activePowerup].onDeactivate) {
            POWERUP_TYPES[gameState.activePowerup].onDeactivate();
        }
        gameState.activePowerup = null;
        domElements.powerElement.textContent = "NORMAL";
        domElements.powerupDisplay.textContent = "";
    }
}

// Collision Detection
function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            if (bullet.position.distanceTo(enemy.position) < enemy.userData.size) {
                enemy.userData.health -= bullet.userData.damage;
                gameState.scene.remove(bullet);
                gameState.bullets.splice(i, 1);
                
                if (enemy.userData.health <= 0) {
                    destroyEnemy(enemy);
                    spawnPowerUp();
                }
                break;
            }
        }
    }
    
    // Enemy bullets hitting player
    for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = gameState.enemyBullets[i];
        
        if (bullet.position.distanceTo(gameState.player.position) < 1.5 && gameState.activePowerup !== 'SHIELD') {
            gameState.health -= bullet.userData.damage * 10;
            updateHUD();
            gameState.scene.remove(bullet);
            gameState.enemyBullets.splice(i, 1);
            screenShake();
            sounds.playerHit.play();
            
            if (gameState.health <= 0) {
                gameState.lives--;
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    gameState.health = 100;
                    updateHUD();
                    gameState.player.position.set(0, -10, 0);
                }
            }
        }
    }
    
    // Check level completion
    if (gameState.enemies.length === 0 && gameState.gameActive) {
        nextLevel();
    }
}

function destroyEnemy(enemy) {
    gameState.score += enemy.userData.value;
    updateHUD();
    gameState.scene.remove(enemy);
    gameState.enemies.splice(gameState.enemies.indexOf(enemy), 1);
    createExplosion(enemy.position);
    sounds.explosion.play();
}

function createExplosion(pos) {
    const particles = new THREE.Group();
    for (let i = 0; i < 15; i++) {
        const pGeo = new THREE.SphereGeometry(0.1);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
        const particle = new THREE.Mesh(pGeo, pMat);
        particle.position.copy(pos);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        particles.add(particle);
    }
    gameState.scene.add(particles);
    setTimeout(() => gameState.scene.remove(particles), 1000);
}

// Game State Management
function startGame() {
    resetGameState();
    clearObjects();
    hideAllScreens();
    gameState.gameActive = true;
    gameState.clock.start();
    showLevelStart();
}

function resetGameState() {
    gameState.score = 0;
    gameState.health = 100;
    gameState.lives = 3;
    gameState.currentLevel = 1;
    gameState.activePowerup = null;
    updateHUD();
}

function clearObjects() {
    [gameState.enemies, gameState.bullets, gameState.enemyBullets, gameState.powerups].forEach(arr => {
        arr.forEach(obj => gameState.scene.remove(obj));
        arr.length = 0;
    });
}

function nextLevel() {
    gameState.currentLevel++;
    updateHUD();
    showLevelStart();
}

function gameOver() {
    gameState.gameActive = false;
    
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('highScore', gameState.highScore);
    }

    domElements.finalScoreElement.textContent = `Final Score: ${gameState.score}`;
    domElements.highScoreElement.textContent = `High Score: ${gameState.highScore}`;
    domElements.gameOverElement.style.display = 'flex';
    sounds.gameOver.play();
}

function updateHUD() {
    domElements.scoreElement.textContent = `Score: ${gameState.score}`;
    domElements.healthElement.textContent = `Health: ${gameState.health}`;
    domElements.levelElement.textContent = `Level: ${gameState.currentLevel}`;
    domElements.powerElement.textContent = gameState.activePowerup 
        ? POWERUP_TYPES[gameState.activePowerup].name 
        : "NORMAL";
}

function showStartScreen() {
    domElements.startScreen.style.display = 'flex';
}

function hideAllScreens() {
    domElements.startScreen.style.display = 'none';
    domElements.gameOverElement.style.display = 'none';
    domElements.pauseMenu.style.display = 'none';
    domElements.levelStartElement.style.display = 'none';
}

function showLevelStart() {
    domElements.levelMessageElement.textContent = `LEVEL ${gameState.currentLevel}`;
    domElements.levelStartElement.style.display = 'flex';
    domElements.levelDisplayElement.textContent = `Level ${gameState.currentLevel}`;
    
    setTimeout(() => {
        domElements.levelStartElement.style.display = 'none';
        spawnEnemies(gameState.currentLevel);
        sounds.levelComplete.play();
    }, 2000);
}

function spawnEnemies(level) {
    const count = 5 + level * 2;
    for (let i = 0; i < count; i++) {
        const geometry = new THREE.IcosahedronGeometry(1 + Math.random(), 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            flatShading: true
        });
        const enemy = new THREE.Mesh(geometry, material);
        enemy.position.set(
            (Math.random() * 30) - 15,
            (Math.random() * 10) + 10,
            (Math.random() * 30) - 15
        );
        enemy.userData = {
            health: 3 + level,
            speed: 1 + level * 0.15,
            value: 100,
            shootCooldown: 2 + Math.random(),
            lastShotTime: 0,
            size: 1.5
        };
        gameState.scene.add(enemy);
        gameState.enemies.push(enemy);
    }
}

function screenShake() {
    const intensity = 0.2;
    const duration = 200;
    const originalPos = gameState.camera.position.clone();
    
    const shakeInterval = setInterval(() => {
        gameState.camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
        gameState.camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
        gameState.camera.position.z = originalPos.z + (Math.random() - 0.5) * intensity;
    }, 16);
    
    setTimeout(() => {
        clearInterval(shakeInterval);
        gameState.camera.position.copy(originalPos);
    }, duration);
}

function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === 'p') togglePause();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    domElements.startBtn.addEventListener('click', startGame);
    domElements.restartBtn.addEventListener('click', startGame);
    domElements.resumeBtn.addEventListener('click', togglePause);
}

function togglePause() {
    if (!gameState.gameActive) return;

    gameState.gamePaused = !gameState.gamePaused;
    domElements.pauseMenu.style.display = gameState.gamePaused ? 'flex' : 'none';

    if (!gameState.gamePaused) {
        gameState.lastFrameTime = performance.now();
        animate();
    }
}

// Responsive canvas
window.addEventListener('resize', () => {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start everything
init();
