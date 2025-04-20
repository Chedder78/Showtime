// Input handling that works like classic arcade games
const keys = {};
const gamepadState = {
    connected: false,
    index: null,
    axes: [0, 0],
    buttons: {}
};

function setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Gamepad controls
    window.addEventListener('gamepadconnected', (e) => {
        gamepadState.connected = true;
        gamepadState.index = e.gamepad.index;
        console.log('Gamepad connected');
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
        if (e.gamepad.index === gamepadState.index) {
            gamepadState.connected = false;
            gamepadState.index = null;
            console.log('Gamepad disconnected');
        }
    });
    
    // Touch controls for mobile
    if ('ontouchstart' in window) {
        setupTouchControls();
    }
}

function updatePlayer(delta) {
    if (!gameState.player) return;
    
    const speed = 8 * delta;
    let moveX = 0;
    let moveZ = 0;
    
    // Keyboard controls (simultaneous movement + firing works)
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) moveX -= speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX += speed;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) moveZ -= speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) moveZ += speed;
    
    // Gamepad controls
    if (gamepadState.connected) {
        const gamepad = navigator.getGamepads()[gamepadState.index];
        if (gamepad) {
            // Left stick movement
            moveX += gamepad.axes[0] * speed;
            moveZ += gamepad.axes[1] * speed;
            
            // Fire button (standard mapping for most gamepads)
            if (gamepad.buttons[0]?.pressed || gamepad.buttons[7]?.pressed) {
                fireBullet();
            }
        }
    }
    
    // Apply movement
    gameState.player.position.x += moveX;
    gameState.player.position.z += moveZ;
    
    // Boundary checking
    gameState.player.position.x = Math.max(-15, Math.min(15, gameState.player.position.x));
    gameState.player.position.z = Math.max(-15, Math.min(15, gameState.player.position.z));
    
    // Firing (works simultaneously with movement)
    if (keys[' '] || keys['Spacebar']) {
        fireBullet();
    }
}

function fireBullet() {
    const currentTime = gameState.clock.getElapsedTime();
    if (currentTime - gameState.lastShotTime > gameState.shootCooldown) {
        if (gameState.activePowerup === 'SPREAD') {
            // Classic 3-way spread shot
            [-0.2, 0, 0.2].forEach(angle => {
                const direction = new THREE.Vector3(angle, 1, 0).normalize();
                createBullet(
                    gameState.player.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
                    direction, 
                    true
                );
            });
        } else {
            // Standard single shot
            createBullet(
                gameState.player.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
                new THREE.Vector3(0, 1, 0),
                true
            );
        }
        gameState.lastShotTime = currentTime;
    }
}

// Mobile touch controls (optional)
function setupTouchControls() {
    const touchArea = document.getElementById('game-container');
    const fireButton = document.createElement('div');
    fireButton.id = 'fire-button';
    fireButton.className = 'touch-control';
    fireButton.textContent = 'FIRE';
    touchArea.appendChild(fireButton);
    
    let touchX = 0;
    let touchY = 0;
    let touchId = null;
    
    touchArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!touchId) {
            const touch = e.touches[0];
            touchId = touch.identifier;
            touchX = touch.clientX;
            touchY = touch.clientY;
        }
    });
    
    touchArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === touchId) {
                const deltaX = touch.clientX - touchX;
                const deltaY = touch.clientY - touchY;
                gameState.player.position.x += deltaX * 0.1;
                gameState.player.position.z += deltaY * 0.1;
                touchX = touch.clientX;
                touchY = touch.clientY;
            }
        }
    });
    
    touchArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
            }
        }
    });
    
    fireButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[' '] = true;
    });
    
    fireButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[' '] = false;
    });
}
