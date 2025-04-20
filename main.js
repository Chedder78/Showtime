// FORCE GAME TO START (TEMPORARY FIX)
setTimeout(() => {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.style.display = 'none';
  });
  
  // Force-start the game
  gameState.gameActive = true;
  gameState.gamePaused = false;
  
  // Start animation loop
  if (!gameState.animationRunning) {
    gameState.animationRunning = true;
    animate();
  }
}, 1000); // 1 second delay to override everything

// SIMPLE FIX - ADD THESE 3 LINES AT THE TOP
document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
document.getElementById('start-screen').style.display = 'flex';
document.getElementById('start-btn').onclick = () => { document.getElementById('start-screen').style.display = 'none'; gameState.gameActive = true; };

// ==================== GAME STATE ====================
const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    player: null,
    bullets: [],
    enemies: [],
    enemyBullets: [],
    powerups: [],
    explosions: [],
    score: 0,
    lives: 3,
    level: 1,
    clock: new THREE.Clock(),
    lastFrameTime: 0,
    deltaTime: 0,
    gameActive: false,
    gamePaused: false,
    bossActive: false,
    bossAttackInterval: null
};

// ==================== INITIALIZATION ====================
function init() {
    // Setup core Three.js components
    setupScene();
    setupCamera();
    setupRenderer();
    
    // Create game elements
    createTunnel();
    createPlayer();
    createLights();
    
    // Setup game systems
    setupEventListeners();
    if ('ontouchstart' in window) setupTouchControls();
    initAudio();
    
    // Initialize post-processing
    gameState.composer = initPostProcessing();
    
    // Start game loop
    showStartScreen();
    animate();
}

function setupScene() {
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x000000);
    gameState.scene.fog = new THREE.FogExp2(0x000022, 0.002);
}

function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    gameState.camera.position.z = 20;
}

function setupRenderer() {
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.shadowMap.enabled = true;
    document.body.appendChild(gameState.renderer.domElement);
}

// ==================== VISUAL ENHANCEMENTS ====================
function initPostProcessing() {
    const renderScene = new RenderPass(gameState.scene, gameState.camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2, // strength
        0.4, // radius
        0.8  // threshold
    );
    
    const composer = new EffectComposer(gameState.renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    
    return composer;
}

function createTunnel() {
    // Main tunnel structure
    const tunnelGeometry = new THREE.TorusGeometry(15, 3, 64, 200);
    const tunnelMaterial = new THREE.MeshStandardMaterial({
        color: 0x3300ff,
        emissive: 0x110033,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    
    gameState.tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    gameState.tunnel.rotation.x = Math.PI / 2;
    gameState.scene.add(gameState.tunnel);

    // Inner energy field with shader effects
    const energyField = new THREE.Mesh(
        new THREE.TorusGeometry(14, 1.5, 32, 100),
        new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x00ffff) },
                color2: { value: new THREE.Color(0xff00ff) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                
                void main() {
                    float wave = sin(vUv.x * 20.0 + time * 2.0) * 0.5 + 0.5;
                    vec3 color = mix(color1, color2, wave);
                    gl_FragColor = vec4(color, 0.7);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        })
    );
    energyField.rotation.x = Math.PI / 2;
    gameState.tunnel.add(energyField);
}

function createPlayer() {
    const geometry = new THREE.ConeGeometry(1.2, 2.5, 6);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x004444,
        metalness: 0.7,
        roughness: 0.3
    });
    
    gameState.player = new THREE.Mesh(geometry, material);
    gameState.player.rotation.x = Math.PI / 2;
    gameState.player.position.set(0, -10, 0);
    gameState.player.castShadow = true;
    gameState.scene.add(gameState.player);

    // Engine trail particle system
    const trailGeometry = new THREE.BufferGeometry();
    const trailCount = 50;
    const trailPositions = new Float32Array(trailCount * 3);
    const trailSizes = new Float32Array(trailCount);
    
    for (let i = 0; i < trailCount; i++) {
        trailPositions[i * 3] = 0;
        trailPositions[i * 3 + 1] = -1 - (i * 0.1);
        trailPositions[i * 3 + 2] = 0;
        trailSizes[i] = 0.5 - (i * 0.01);
    }
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
    
    const trailMaterial = new THREE.PointsMaterial({
        color: 0x00aaff,
        size: 0.3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    gameState.engineTrail = new THREE.Points(trailGeometry, trailMaterial);
    gameState.player.add(gameState.engineTrail);
}

// ==================== GAME MECHANICS ====================
function createBullet(position, direction, isPlayer = true) {
    const geometry = new THREE.SphereGeometry(0.25, 12, 12);
    const material = new THREE.MeshPhongMaterial({ 
        color: isPlayer ? 0x00ffff : 0xff0000,
        emissive: isPlayer ? 0x004444 : 0x440000,
        specular: isPlayer ? 0x00ffff : 0xff0000
    });
    
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.copy(position);
    
    // Add trail effect
    const trail = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
            color: isPlayer ? 0x00aaff : 0xff3300,
            transparent: true,
            opacity: 0.7,
            linewidth: 2
        })
    );
    bullet.add(trail);
    
    bullet.userData = {
        direction: direction.clone().normalize(),
        speed: isPlayer ? 1.8 : 1.2,
        isPlayer: isPlayer,
        damage: isPlayer ? 1 : 0.5,
        startTime: gameState.clock.getElapsedTime(),
        lifetime: 3,
        trail: trail,
        lastPosition: position.clone()
    };
    
    // Add glow
    const glow = new THREE.PointLight(
        isPlayer ? 0x00aaff : 0xff3300,
        0.8,
        2
    );
    bullet.add(glow);
    
    gameState.scene.add(bullet);
    if (isPlayer) {
        gameState.bullets.push(bullet);
        sounds.shoot.play();
    } else {
        gameState.enemyBullets.push(bullet);
    }
    
    return bullet; // Fixed: Now returns the bullet
}

function spawnBoss(level) {
    if (gameState.bossAttackInterval) {
        clearInterval(gameState.bossAttackInterval);
    }
    
    const bossGeometry = new THREE.OctahedronGeometry(3);
    const bossMaterial = new THREE.MeshPhongMaterial({
        color: 0xff3300,
        emissive: 0x440000,
        specular: 0xff3300,
        shininess: 100
    });
    
    const boss = new THREE.Mesh(bossGeometry, bossMaterial);
    boss.position.set(0, 15, 0);
    boss.userData = {
        health: 10 + level * 2,
        speed: 0.5,
        points: 500 * level
    };
    
    gameState.scene.add(boss);
    gameState.enemies.push(boss);
    gameState.bossActive = true;
    
    // Boss attack pattern
    gameState.bossAttackInterval = setInterval(() => {
        if (!gameState.gameActive) return;
        
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            -1,
            0
        ).normalize();
        
        createBullet(boss.position.clone(), direction, false);
    }, 1000);
}

function nextLevel() {
    gameState.level++;
    updateHUD();

    setTimeout(() => {
        if (gameState.level % 5 === 0) {
            spawnBoss(gameState.level);
        } else {
            spawnEnemiesForLevel(gameState.level);
        }
    }, 1000);
}

// ==================== COLLISION & EFFECTS ====================
function createExplosion(pos) {
    // Particle explosion
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = pos.x + (Math.random() - 0.5) * 3;
        positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 3;
        positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 3;
        
        color.setHSL(Math.random() * 0.1 + 0.05, 0.9, 0.5);
        color.toArray(colors, i * 3);
        
        sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    gameState.scene.add(particleSystem);
    
    // Shockwave effect
    const shockwaveGeometry = new THREE.SphereGeometry(1, 32, 32);
    const shockwaveMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        wireframe: true
    });
    
    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
    shockwave.position.copy(pos);
    gameState.scene.add(shockwave);
    
    // Animate and remove
    let scale = 0.1;
    let opacity = 0.7;
    
    const animateExplosion = () => {
        scale += 0.5;
        opacity -= 0.02;
        
        particleSystem.position.y += 0.05;
        particleMaterial.opacity = opacity * 0.5;
        
        shockwave.scale.set(scale, scale, scale);
        shockwaveMaterial.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(animateExplosion);
        } else {
            gameState.scene.remove(particleSystem);
            gameState.scene.remove(shockwave);
        }
    };
    
    animateExplosion();
    sounds.explosion.play();
}

// ==================== GAME LOOP ====================
function animate(currentTime = 0) {
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth animation
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    if (!gameState.gameActive || gameState.gamePaused) return;
    
    const elapsedTime = gameState.clock.getElapsedTime();
    
    // Update visual effects
    updateEngineTrail(elapsedTime);
    updateTunnel(elapsedTime);
    updateLighting(elapsedTime);
    
    // Update game entities
    updatePlayer(gameState.deltaTime);
    updateEnemies(gameState.deltaTime);
    updateBullets(gameState.deltaTime);
    updatePowerups();
    checkCollisions();
    
    // Render with post-processing
    if (gameState.composer) {
        gameState.composer.render();
    } else {
        gameState.renderer.render(gameState.scene, gameState.camera);
    }
}

// ==================== UI & CONTROLS ====================
function setupTouchControls() {
    // Left side for movement
    const movePad = document.createElement('div');
    movePad.style.position = 'fixed';
    movePad.style.bottom = '20px';
    movePad.style.left = '20px';
    movePad.style.width = '150px';
    movePad.style.height = '150px';
    movePad.style.backgroundColor = 'rgba(255,255,255,0.1)';
    movePad.style.borderRadius = '50%';
    document.body.appendChild(movePad);
    
    // Right side for shooting
    const shootPad = document.createElement('div');
    shootPad.style.position = 'fixed';
    shootPad.style.bottom = '20px';
    shootPad.style.right = '20px';
    shootPad.style.width = '150px';
    shootPad.style.height = '150px';
    shootPad.style.backgroundColor = 'rgba(255,0,0,0.1)';
    shootPad.style.borderRadius = '50%';
    document.body.appendChild(shootPad);
    
    // Touch event listeners...
}

function updateHUD() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('level').textContent = gameState.level;
}

// ==================== GAME MANAGEMENT ====================
function gameOver() {
    gameState.gameActive = false;
    gameState.bossActive = false;
    
    // Clear any boss attack intervals
    if (gameState.bossAttackInterval) {
        clearInterval(gameState.bossAttackInterval);
        gameState.bossAttackInterval = null;
    }
    
    // Save high score
    const highScore = saveHighScore();
    
    // Show game over screen
    document.getElementById('game-over-score').textContent = gameState.score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('game-over-screen').style.display = 'block';
    
    // Stop all sounds
    Howler.stop();
}

function saveHighScore() {
    const highScore = localStorage.getItem('highScore') || 0;
    if (gameState.score > highScore) {
        localStorage.setItem('highScore', gameState.score);
        return gameState.score;
    }
    return highScore;
}

// Initialize the game when ready
window.addEventListener('load', init);
window.addEventListener('resize', () => {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    if (gameState.composer) {
        gameState.composer.setSize(window.innerWidth, window.innerHeight);
    }
// ==================== UTILITY FUNCTIONS ====================

function spawnEnemiesForLevel(level) {
    const enemyCount = 3 + Math.floor(level * 1.5);
    
    for (let i = 0; i < enemyCount; i++) {
        const enemy = createEnemy(level);
        gameState.enemies.push(enemy);
        gameState.scene.add(enemy);
    }
}

function createEnemy(level) {
    const geometry = new THREE.OctahedronGeometry(1);
    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0x330000
    });
    
    const enemy = new THREE.Mesh(geometry, material);
    enemy.position.set(
        (Math.random() - 0.5) * 20,
        10 + Math.random() * 5,
        0
    );
    
    enemy.userData = {
        health: 1 + Math.floor(level / 3),
        speed: 0.3 + (level * 0.02),
        points: 100 * level,
        lastShot: 0,
        fireRate: 1.5 - (level * 0.02)
    };
    
    return enemy;
}

function updateEnemies(deltaTime) {
    gameState.enemies.forEach((enemy, index) => {
        // Movement
        enemy.position.y -= enemy.userData.speed * deltaTime * 60;
        
        // Firing logic
        const now = gameState.clock.getElapsedTime();
        if (now - enemy.userData.lastShot > enemy.userData.fireRate) {
            const direction = new THREE.Vector3(
                0,
                -1,
                0
            );
            createBullet(
                enemy.position.clone(),
                direction,
                false
            );
            enemy.userData.lastShot = now;
        }
        
        // Remove if out of bounds
        if (enemy.position.y < -15) {
            gameState.scene.remove(enemy);
            gameState.enemies.splice(index, 1);
        }
    });
}

function updateBullets(deltaTime) {
    // Player bullets
    gameState.bullets.forEach((bullet, index) => {
        bullet.position.add(
            bullet.userData.direction.clone()
                .multiplyScalar(bullet.userData.speed * deltaTime * 60)
        );
        
        // Remove if expired
        if (gameState.clock.getElapsedTime() - bullet.userData.startTime > bullet.userData.lifetime) {
            gameState.scene.remove(bullet);
            gameState.bullets.splice(index, 1);
        }
    });
    
    // Enemy bullets (same logic but different array)
    gameState.enemyBullets.forEach((bullet, index) => {
        // ... same update/removal logic as above ...
    });
}

function checkCollisions() {
    // Player bullets vs enemies
    gameState.bullets.forEach((bullet, bIndex) => {
        gameState.enemies.forEach((enemy, eIndex) => {
            if (bullet.position.distanceTo(enemy.position) < 1.5) {
                enemy.userData.health -= bullet.userData.damage;
                
                // Remove bullet
                gameState.scene.remove(bullet);
                gameState.bullets.splice(bIndex, 1);
                
                // Handle enemy death
                if (enemy.userData.health <= 0) {
                    createExplosion(enemy.position);
                    gameState.score += enemy.userData.points;
                    gameState.scene.remove(enemy);
                    gameState.enemies.splice(eIndex, 1);
                    
                    // Check if all enemies defeated
                    if (gameState.enemies.length === 0 && !gameState.bossActive) {
                        nextLevel();
                    }
                }
            }
        });
    });
    
    // Enemy bullets vs player
    gameState.enemyBullets.forEach((bullet, index) => {
        if (bullet.position.distanceTo(gameState.player.position) < 1.2) {
            handlePlayerHit();
            gameState.scene.remove(bullet);
            gameState.enemyBullets.splice(index, 1);
        }
    });
}

function handlePlayerHit() {
    gameState.lives--;
    updateHUD();
    
    // Visual feedback
    gameState.player.material.color.setHex(0xff0000);
    setTimeout(() => {
        gameState.player.material.color.setHex(0x00ffff);
    }, 200);
    
    if (gameState.lives <= 0) {
        gameOver();
    }
}

// ==================== FINAL INITIALIZATION ====================
window.addEventListener('load', init);
window.addEventListener('resize', () => {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (gameState.composer) {
        gameState.composer.setSize(window.innerWidth, window.innerHeight);
    }
});
function animate() {
  // Only run if game is active and not paused
  if (!gameState.gameActive || gameState.gamePaused) return;
  
  requestAnimationFrame(animate);
  
  // Basic rendering
  renderer.render(scene, camera);
  
  // Add your game logic here:
  // - Update player
  // - Update enemies
  // - Check collisions
  // etc...
}
