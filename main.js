// Game configuration
const config = {
    playerSpeed: 0.2,
    bulletSpeed: 15,
    enemyBulletSpeed: 10,
    shootCooldown: 200, // ms
    powerUpDuration: 10000 // ms
};

// Game state
let scene, camera, renderer;
let player, enemies = [], bullets = [], enemyBullets = [], powerUps = [];
let score = 0, highScore = 0, health = 100, lives = 3, currentLevel = 1;
let gameActive = false, lastShotTime = 0, activePowerUp = null, powerUpEndTime = 0;
let keys = {};

// DOM elements
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('final-score');
const gameOverElement = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

// Audio
const sounds = {
    shoot: new Howl({ src: ['sounds/laser.mp3'], volume: 0.3 }),
    explosion: new Howl({ src: ['sounds/explosion.mp3'], volume: 0.5 }),
    powerup: new Howl({ src: ['sounds/powerup.mp3'], volume: 0.7 }),
    music: new Howl({ 
        src: ['sounds/music.mp3'], 
        volume: 0.4,
        loop: true
    })
};

// Initialize game
init();

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 10;
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').prepend(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Add to init():
function setupTouchControls() {
  const touchArea = renderer.domElement;
  touchArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = touchArea.getBoundingClientRect();
    player.position.x = ((touch.clientX - rect.left) / rect.width) * 30 - 15;
    player.position.z = ((touch.clientY - rect.top) / rect.height) * 30 - 15;
  });

  // Add on-screen fire button
  const fireBtn = document.createElement('div');
  fireBtn.style = `position: absolute; bottom: 20px; right: 20px; width: 80px; height: 80px; background: rgba(0,255,255,0.3); border-radius: 50%; border: 2px solid #0ff;`;
  fireBtn.addEventListener('touchstart', () => keys[' '] = true);
  fireBtn.addEventListener('touchend', () => keys[' '] = false);
  document.getElementById('game-container').appendChild(fireBtn);
}
    
    // Create player
    createPlayer();
    
    // Create tunnel
    createTunnel();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    restartBtn.addEventListener('click', startGame);
    
    // Start game
    startGame();
    animate();
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

function createTunnel() {
    const geometry = new THREE.TorusGeometry(15, 3, 16, 100);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x3300ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const tunnel = new THREE.Mesh(geometry, material);
    tunnel.rotation.x = Math.PI / 2;
    scene.add(tunnel);
}

function startGame() {
    // Reset game state
    score = 0;
    health = 100;
    lives = 3;
    currentLevel = 1;
    activePowerUp = null;
    
    // Clear all objects
    clearObjects();
    
    // Hide game over screen
    gameOverElement.style.display = 'none';
    
    // Start music
    sounds.music.play();
    
    // Start level
    gameActive = true;
    spawnEnemiesForLevel(currentLevel);
    
    // Update HUD
    updateHUD();
}

function clearObjects() {
    enemies.forEach(enemy => scene.remove(enemy));
    bullets.forEach(bullet => scene.remove(bullet));
    enemyBullets.forEach(bullet => scene.remove(bullet));
    powerUps.forEach(powerUp => scene.remove(powerUp));
    
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerUps = [];
}

function spawnEnemiesForLevel(level) {
    const enemyCount = 5 + level * 2;
    
    for (let i = 0; i < enemyCount; i++) {
        createEnemy(level);
    }
}

function createEnemy(level) {
    let geometry, material, type;
    const rand = Math.random();
    
    if (level < 3) {
        type = 'basic';
        geometry = new THREE.OctahedronGeometry(1);
        material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    } 
    else if (level < 6) {
        type = rand < 0.7 ? 'basic' : 'fast';
        if (type === 'fast') {
            geometry = new THREE.TetrahedronGeometry(0.8);
            material = new THREE.MeshPhongMaterial({ color: 0xff8800 });
        } else {
            geometry = new THREE.OctahedronGeometry(1);
            material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        }
    }
    else {
        if (rand < 0.5) type = 'basic';
        else if (rand < 0.8) type = 'fast';
        else type = 'strong';
        
        if (type === 'strong') {
            geometry = new THREE.DodecahedronGeometry(1.2);
            material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        } else if (type === 'fast') {
            geometry = new THREE.TetrahedronGeometry(0.8);
            material = new THREE.MeshPhongMaterial({ color: 0xff8800 });
        } else {
            geometry = new THREE.OctahedronGeometry(1);
            material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        }
    }
    
    const enemy = new THREE.Mesh(geometry, material);
    
    // Position enemy
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 10;
    enemy.position.x = Math.cos(angle) * radius;
    enemy.position.z = Math.sin(angle) * radius;
    enemy.position.y = 10 + Math.random() * 5;
    
    // Enemy properties
    enemy.userData = {
        type,
        health: type === 'basic' ? 1 : type === 'fast' ? 1 : 3,
        speed: type === 'basic' ? 0.5 : type === 'fast' ? 1.5 : 0.3,
        value: type === 'basic' ? 100 : type === 'fast' ? 150 : 200,
        lastShotTime: 0,
        shootCooldown: type === 'basic' ? 3000 : type === 'fast' ? 2000 : 4000
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
        speed: isPlayer ? config.bulletSpeed : config.enemyBulletSpeed,
        isPlayer,
        damage: isPlayer ? 1 : 0.5
    };
    
    scene.add(bullet);
    if (isPlayer) {
        bullets.push(bullet);
        sounds.shoot.play();
    } else {
        enemyBullets.push(bullet);
    }
}
// Enhanced explosion effect
function createExplosion(position, color = 0xff9900, size = 1) {
  const particles = new THREE.Group();
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const pGeo = new THREE.SphereGeometry(0.1 * size);
    const pMat = new THREE.MeshBasicMaterial({ color });
    const particle = new THREE.Mesh(pGeo, pMat);
    
    particle.position.copy(position);
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 5 * size,
        (Math.random() - 0.5) * 5 * size,
        (Math.random() - 0.5) * 5 * size
      ),
      lifetime: 0
    };
    
    particles.add(particle);
  }

  scene.add(particles);
  
  // Animate particles
  const particleAnim = setInterval(() => {
    particles.children.forEach(p => {
      p.position.add(p.userData.velocity.clone().multiplyScalar(0.1));
      p.userData.lifetime += 0.1;
      p.material.opacity = 1 - (p.userData.lifetime / 2);
    });
    
    if (particles.children[0]?.userData.lifetime > 2) {
      clearInterval(particleAnim);
      scene.remove(particles);
    }
  }, 16);
}

function spawnPowerUp(position) {
    const types = ['SPREAD', 'LASER', 'SHIELD'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const geometry = new THREE.SphereGeometry(0.8);
    const material = new THREE.MeshPhongMaterial({ 
        color: type === 'SPREAD' ? 0x00ff00 : 
              type === 'LASER' ? 0xff0000 : 0x0000ff,
        emissive: type === 'SPREAD' ? 0x004400 : 
                type === 'LASER' ? 0x440000 : 0x000044
    });
    
    const powerUp = new THREE.Mesh(geometry, material);
    powerUp.position.copy(position);
    powerUp.userData = { type };
    
    scene.add(powerUp);
    powerUps.push(powerUp);
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameActive) return;
    
    const delta = clock.getDelta();
    
    // Update player
    updatePlayer(delta);
    
    // Update enemies
    updateEnemies();
    
    // Update bullets
    updateBullets(delta);
    
    // Update power-ups
    updatePowerUps();
    
    // Check collisions
    checkCollisions();
    
    // Check level completion
    if (enemies.length === 0) {
        nextLevel();
    }
    
    renderer.render(scene, camera);
}

function updatePlayer(delta) {
    const speed = config.playerSpeed * 60 * delta;
    
    if (keys['ArrowLeft'] || keys['a']) player.position.x -= speed;
    if (keys['ArrowRight'] || keys['d']) player.position.x += speed;
    if (keys['ArrowUp'] || keys['w']) player.position.z -= speed;
    if (keys['ArrowDown'] || keys['s']) player.position.z += speed;
    
    // Keep player in bounds
    player.position.x = Math.max(-15, Math.min(15, player.position.x));
    player.position.z = Math.max(-15, Math.min(15, player.position.z));
    
    // Shooting
    const now = Date.now();
    if ((keys[' '] || keys['Spacebar']) && now - lastShotTime > config.shootCooldown) {
        shoot();
        lastShotTime = now;
    }
}

function shoot() {
    if (activePowerUp === 'SPREAD') {
        // Triple shot
        for (let i = -1; i <= 1; i++) {
            const direction = new THREE.Vector3(i * 0.2, 1, 0).normalize();
            createBullet(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), direction, true);
        }
    } else if (activePowerUp === 'LASER') {
        // Powerful laser
        const direction = new THREE.Vector3(0, 1, 0);
        const bullet = createBullet(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), direction, true);
        bullet.scale.set(1, 3, 1);
        bullet.userData.damage = 3;
    } else {
        // Normal shot
        const direction = new THREE.Vector3(0, 1, 0);
        createBullet(player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), direction, true);
    }
}

function updateEnemies() {
    const now = Date.now();
    
    enemies.forEach(enemy => {
        // Move toward player
        const direction = new THREE.Vector3().subVectors(
            new THREE.Vector3(player.position.x, enemy.position.y, player.position.z),
            enemy.position
        ).normalize();
        
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed * 0.1));
        
        // Enemy shooting
        if (now - enemy.userData.lastShotTime > enemy.userData.shootCooldown) {
            const shootDirection = new THREE.Vector3().subVectors(
                player.position,
                enemy.position
            ).normalize();
            
            createBullet(enemy.position.clone(), shootDirection, false);
            enemy.userData.lastShotTime = now;
        }
        
        // Rotate enemy
        enemy.rotation.x += 0.01;
        enemy.rotation.y += 0.01;
    });
}

function updateBullets(delta) {
    // Player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * delta));
        
        // Remove if out of bounds
        if (bullet.position.y > 30 || bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
    
    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.position.add(bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed * delta));
        
        // Remove if out of bounds
        if (bullet.position.y < -20 || bullet.position.length() > 50) {
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    const now = Date.now();
    
    if (activePowerUp && now > powerUpEndTime) {
        activePowerUp = null;
    }
    
    // Check power-up collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        if (powerUp.position.distanceTo(player.position) < 1.5) {
            // Collect power-up
            activePowerUp = powerUp.userData.type;
            powerUpEndTime = now + config.powerUpDuration;
            sounds.powerup.play();
            
            // Remove power-up
            scene.remove(powerUp);
            powerUps.splice(i, 1);
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
                // Hit enemy
                enemy.userData.health -= bullet.userData.damage;
                sounds.explosion.play();
                
                // Remove bullet
                scene.remove(bullet);
                bullets.splice(i, 1);
                
                // Check if enemy is dead
                if (enemy.userData.health <= 0) {
                    // Add score
                    score += enemy.userData.value;
                    if (score > highScore) highScore = score;
                    
                    // Chance to spawn power-up
                    if (Math.random() < 0.2) {
                        spawnPowerUp(enemy.position.clone());
                    }
                    
                    // Remove enemy
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                }
                
                break;
            }
        }
    }
    
    // Enemy bullets hitting player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (bullet.position.distanceTo(player.position) < 1.5) {
            // Hit player
            if (activePowerUp !== 'SHIELD') {
                health -= bullet.userData.damage * 10;
                screenShake(1.0);
            }
            
            // Remove bullet
            scene.remove(bullet);
            enemyBullets.splice(i, 1);
            
            // Check if player is dead
            if (health <= 0) {
                lives--;
                if (lives <= 0) {
                    gameOver();
                } else {
                    // Respawn
                    health = 100;
                    player.position.set(0, -10, 0);
                }
            }
            
            updateHUD();
        }
    }
}

function screenShake(intensity = 0.5) {
    const originalPos = camera.position.clone();
    let shakeTime = 0;
    const shakeInterval = setInterval(() => {
        camera.position.x = originalPos.x + (Math.random() - 0.5) * intensity;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * intensity;
        shakeTime += 0.1;
        if (shakeTime > 0.5) {
            clearInterval(shakeInterval);
            camera.position.copy(originalPos);
        }
    }, 16);
}

function nextLevel() {
    currentLevel++;
    updateHUD();
    
    // Show level transition
    setTimeout(() => {
        spawnEnemiesForLevel(currentLevel);
 // Add to spawnEnemiesForLevel():
function spawnBoss(level) {
  const boss = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3),
    new THREE.MeshPhongMaterial({ 
      color: 0xff00ff,
      emissive: 0x9900cc 
    })
  );

  boss.position.set(0, 15, 0);
  boss.userData = {
    health: level * 5,
    attackPattern: 'spiral',
    lastAttack: 0,
    attackCooldown: 2000
  };

  enemies.push(boss);
  scene.add(boss);

  // Boss attack logic
  setInterval(() => {
    if (!gameActive) return;
    
    const now = Date.now();
    if (now - boss.userData.lastAttack > boss.userData.attackCooldown) {
      if (boss.userData.attackPattern === 'spiral') {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const angle = (i / 8) * Math.PI * 2;
            const dir = new THREE.Vector3(
              Math.sin(angle),
              -1,
              Math.cos(angle)
            ).normalize();
            createBullet(boss.position.clone(), dir, false);
          }, i * 100);
        }
      }
      boss.userData.lastAttack = now;
    }
  }, 100);
}   }, 1000);

}

function gameOver() {
    gameActive = false;
    sounds.music.stop();
    finalScoreElement.textContent = score;
    gameOverElement.style.display = 'block';
    // Add to gameOver():
function saveHighScore() {
  const storedHigh = localStorage.getItem('tempestHighScore') || 0;
  if (score > storedHigh) {
    localStorage.setItem('tempestHighScore', score);
    return score;
  }
  return storedHigh;
}

// Add to startGame():
highScore = localStorage.getItem('tempestHighScore') || 0;
}

function updateHUD() {
    scoreElement.textContent = score;
    healthElement.textContent = health;
    levelElement.textContent = currentLevel;
    livesElement.textContent = lives;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
    keys[e.key] = true;
    // Pause game with P key
    if (e.key.toLowerCase() === 'p') {
        gameActive = !gameActive;
        if (gameActive) {
            sounds.music.play();
        } else {
            sounds.music.pause();
        }
    }
}

function onKeyUp(e) {
    keys[e.key] = false;
}
// [Previous code remains exactly the same until the very end...]
// Game clock
const clock = new THREE.Clock();

// Start the game loop
animate();
