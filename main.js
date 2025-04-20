// Main game variables
let scene, camera, renderer;
let player, enemies = [], bullets = [], enemyBullets = [], powerups = [];
let score = 0, highScore = 0, health = 100, lives = 3, currentLevel = 1;
let gameActive = false, gamePaused = false;
let clock = new THREE.Clock();
let lastShotTime = 0;
let shootCooldown = 0.2;
let activePowerup = null;
let powerupEndTime = 0;
let tunnel;

// DOM elements
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const levelElement = document.getElementById('level');
const powerElement = document.getElementById('power');
const gameOverElement = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const powerupDisplay = document.getElementById('powerup-display');

// Powerup types
const POWERUP_TYPES = {
  SPREAD: { name: "TRIPLE SHOT", duration: 10, color: 0x00ff00 },
  LASER: { name: "LASER BEAM", duration: 7, color: 0xff0000 },
  SHIELD: { name: "SHIELD", duration: 5, color: 0x0000ff }
};

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
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
    
    // Create game elements
    createTunnel();
    createPlayer();
    
    // Start the game
    startGame();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restartBtn.addEventListener('click', startGame);
}

function createTunnel() {
    const tunnelGeometry = new THREE.TorusGeometry(15, 3, 16, 100);
    const tunnelMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x3300ff, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.rotation.x = Math.PI / 2;
    scene.add(tunnel);
}

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
    } else {
        geometry = new THREE.DodecahedronGeometry(1.2);
        material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            emissive: 0x004400,
            specular: 0x00ff00
        });
    }
    
    const enemy = new THREE.Mesh(geometry, material);
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 10;
    enemy.position.x = Math.cos(angle) * radius;
    enemy.position.z = Math.sin(angle) * radius;
    enemy.position.y = 10 + Math.random() * 5;
    
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
}

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

function spawnPowerUp() {
    if (Math.random() < 0.1) {
        const types = Object.keys(POWERUP_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const powerup = new THREE.Mesh(
            new THREE.SphereGeometry(1),
            new THREE.MeshBasicMaterial({ color: POWERUP_TYPES[type].color })
        );
        powerup.position.set(
            Math.random() * 20 - 10,
            0,
            Math.random() * 20 - 10
        );
        powerup.userData = { type };
        scene.add(powerup);
        powerups.push(powerup);
    }
}

function activatePowerup(type) {
    activePowerup = type;
    powerupEndTime = clock.getElapsedTime() + POWERUP_TYPES[type].duration;
    powerElement.textContent = POWERUP_TYPES[type].name;
    powerupDisplay.textContent = `ACTIVE: ${POWERUP_TYPES[type].name}`;
    powerupDisplay.style.color = `#${POWERUP_TYPES[type].color.toString(16)}`;
}

function checkPowerups() {
    if (activePowerup && clock.getElapsedTime() > powerupEndTime) {
        activePowerup = null;
        powerElement.textContent = "NORMAL";
        powerupDisplay.textContent = "";
    }
}

function startGame() {
    score = 0;
    health = 100;
    lives = 3;
    currentLevel = 1;
    
    clearObjects();
    gameOverElement.style.display = 'none';
    gameActive = true;
    
    spawnEnemiesForLevel(currentLevel);
    updateHUD();
}

function spawnEnemiesForLevel(level) {
    const baseCount = 5 + level * 2;
    const count = Math.min(baseCount, 20);
    
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
}

function clearObjects() {
    enemies.forEach(enemy => scene.remove(enemy));
    bullets.forEach(bullet => scene.remove(bullet));
    enemyBullets.forEach(bullet => scene.remove(bullet));
    powerups.forEach(powerup => scene.remove(powerup));
    
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];
}

function updateHUD() {
    scoreElement.textContent = score;
    healthElement.textContent = health;
    levelElement.textContent = currentLevel;
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!gameActive || gamePaused) return;
    
    const delta = clock.getDelta();
    
    // Rotate tunnel
    tunnel.rotation.z += 0.005;
    
    // Update game elements
    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updatePowerups();
    checkPowerups();
    
    // Check collisions
    checkCollisions();
    
    renderer.render(scene, camera);
}

const keys = {};
function updatePlayer(delta) {
    const speed = 5 * delta;
    
    if (keys['ArrowLeft'] || keys['a']) player.position.x -= speed;
    if (keys['ArrowRight'] || keys['d']) player.position.x += speed;
    if (keys['ArrowUp'] || keys['w']) player.position.z -= speed;
    if (keys['ArrowDown'] || keys['s']) player.position.z += speed;
    
    player.position.x = Math.max(-15, Math.min(15, player.position.x));
    player.position.z = Math.max(-15, Math.min(15, player.position.z));
    
    if (keys[' '] && clock.getElapsedTime() - lastShotTime > shootCooldown) {
        shoot();
        lastShotTime = clock.getElapsedTime();
    }
}

function shoot() {
    if (activePowerup === 'SPREAD') {
        // Triple shot
        const angles = [-0.2, 0, 0.2];
        angles.forEach(angle => {
            const direction = new THREE.Vector3(angle, 1, 0).normalize();
            createBullet(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), direction, true);
        });
    } else if (activePowerup === 'LASER') {
        // Laser beam
        const laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 30, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.position.copy(player.position);
        laser.position.y += 15;
        laser.rotation.x = Math.PI / 2;
        scene.add(laser);
        setTimeout(() => scene.remove(laser), 100);
        
        // Damage enemies in laser path
        enemies.forEach(enemy => {
            if (Math.abs(enemy.position.x - player.position.x) < 2 && enemy.position.y > player.position.y) {
                enemy.userData.health -= 3;
                if (enemy.userData.health <= 0) {
                    score += enemy.userData.value;
                    scene.remove(enemy);
                    enemies.splice(enemies.indexOf(enemy), 1);
                    createExplosion(enemy.position);
                }
            }
        });
    } else {
        // Normal shot
        const direction = new THREE.Vector3(0, 1, 0);
        createBullet(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), direction, true);
    }
}

function updateEnemies(delta) {
    enemies.forEach(enemy => {
        const direction = new THREE.Vector3().subVectors(
            new THREE.Vector3(player.position.x, enemy.position.y, player.position.z),
            enemy.position
        ).normalize();
        
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed * delta));
        
        if (clock.getElapsedTime() - enemy.userData.lastShotTime > enemy.userData.shootCooldown) {
            const shootDirection = new THREE.Vector3().subVectors(
                player.position,
                enemy.position
            ).normalize();
            
            createBullet(enemy.position.clone(), shootDirection, false);
            enemy.userData.lastShotTime = clock.getElapsedTime();
        }
        
        enemy.rotation.x += 0.01;
        enemy.rotation.y += 0.01;
    });
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * 50 * delta));
        
        if (bullet.position.y > 30 || bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
    
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * 40 * delta));
        
        if (bullet.position.y < -20 || bullet.position.length() > 50) {
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
        }
    }
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.rotation.x += 0.05;
        powerup.rotation.y += 0.05;
        
        if (player.position.distanceTo(powerup.position) < 1.5) {
            activatePowerup(powerup.userData.type);
            scene.remove(powerup);
            powerups.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Player bullets hitting enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (bullet.position.distanceTo(enemy.position) < 1.5) {
                enemy.userData.health -= bullet.userData.damage;
                scene.remove(bullet);
                bullets.splice(i, 1);
                
                if (enemy.userData.health <= 0) {
                    score += enemy.userData.value;
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    createExplosion(enemy.position);
                    spawnPowerUp();
                }
                
                break;
            }
        }
    }
    
    // Enemy bullets hitting player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (bullet.position.distanceTo(player.position) < 1.5 && activePowerup !== 'SHIELD') {
            health -= bullet.userData.damage * 10;
            healthElement.textContent = Math.max(0, health);
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
            screenShake();
            
            if (health <= 0) {
                lives--;
                if (lives <= 0) {
                    gameOver();
                } else {
                    health = 100;
                    healthElement.textContent = health;
                    player.position.set(0, -10, 0);
                }
            }
        }
    }
    
    // Check if level complete
    if (enemies.length === 0 && gameActive) {
        currentLevel++;
        levelElement.textContent = currentLevel;
        spawnEnemiesForLevel(currentLevel);
    }
}

function createExplosion(pos) {
    const particles = new THREE.Group();
    for (let i = 0; i < 20; i++) {
        const pGeo = new THREE.SphereGeometry(0.1);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
        const particle = new THREE.Mesh(pGeo, pMat);
        particle.position.copy(pos);
        particle.userData.velocity = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).multiplyScalar(2);
        particles.add(particle);
    }
    scene.add(particles);
    setTimeout(() => scene.remove(particles), 1000);
}

function screenShake(intensity = 0.5) {
    const originalPos = camera.position.clone();
    let shakeTime = 0;
    const shakeInterval = setInterval(() => {
        camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
        camera.position.z = originalPos.z + (Math.random() - 0.5) * intensity;
        shakeTime += 0.1;
        if (shakeTime > 0.5) clearInterval(shakeInterval);
    }, 16);
}

function gameOver() {
    gameActive = false;
    gameOverElement.style.display = 'block';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
    if (event.key.toLowerCase() === 'p') togglePause();
}

function onKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}

function togglePause() {
    gamePaused = !gamePaused;
}

// Start the game
init();
animate();
