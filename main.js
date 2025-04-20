    function initTitleBackground() {
      const container = document.getElementById('title-background');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      container.appendChild(renderer.domElement);
      
      // Create floating neon particles
      const particles = new THREE.BufferGeometry();
      const particleCount = 500;
      const posArray = new Float32Array(particleCount * 3);
      
      for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
      }
      
      particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x00f7ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      
      const particleSystem = new THREE.Points(particles, particleMaterial);
      scene.add(particleSystem);
      
      // Create pulsing tunnel effect
      const torusGeometry = new THREE.TorusGeometry(8, 1, 16, 100);
      const torusMaterial = new THREE.MeshBasicMaterial({
        color: 0x9d00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const torus = new THREE.Mesh(torusGeometry, torusMaterial);
      torus.rotation.x = Math.PI / 2;
      scene.add(torus);
      
      camera.position.z = 20;
      
      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        
        particleSystem.rotation.y += 0.001;
        torus.rotation.z += 0.01;
        
        // Post-processing setup for glow effects
      function setupPostProcessing() {
      const renderScene = new RenderPass(gameState.scene, gameState.camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // strength
        0.4, // radius
        0.85 // threshold
    );
    
    const composer = new EffectComposer(gameState.renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    
    return composer;
}

// Enhanced tunnel with procedural textures
function createTunnel() {
    // Main tunnel
    const tunnelGeometry = new THREE.TorusGeometry(15, 3, 32, 100);
    const tunnelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3300ff,
        wireframe: false,
        transparent: true,
        opacity: 0.3,
        emissive: 0x110033,
        shininess: 100
    });
    
    // Add noise texture for energy flow
    const noiseTexture = new THREE.CanvasTexture(createNoiseCanvas());
    tunnelMaterial.alphaMap = noiseTexture;
    tunnelMaterial.alphaTest = 0.1;
    
    gameState.tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    gameState.tunnel.rotation.x = Math.PI / 2;
    gameState.scene.add(gameState.tunnel);
    
    // Inner energy core
    const coreGeometry = new THREE.TorusGeometry(12, 1, 16, 50);
    const coreMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(0x00aaff) },
            color2: { value: new THREE.Color(0x9d00ff) }
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
                float wave = sin(vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5;
                vec3 color = mix(color1, color2, wave);
                gl_FragColor = vec4(color, 0.7);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    const energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    energyCore.rotation.x = Math.PI / 2;
    gameState.tunnel.add(energyCore);
    
    // Store reference for animation
    gameState.energyCore = energyCore;
}

// Dynamic noise texture generator
function createNoiseCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    for(let x = 0; x < canvas.width; x++) {
        for(let y = 0; y < canvas.height; y++) {
            const value = Math.floor(Math.random() * 256);
            ctx.fillStyle = `rgb(${value},${value},${value})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    
    return canvas;
}

// Enhanced player model with engine glow
function createPlayer() {
    // Main ship
    const geometry = new THREE.ConeGeometry(1.2, 2.5, 6);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        emissive: 0x004444,
        specular: 0x00ffff,
        shininess: 100,
        flatShading: true
    });
    
    gameState.player = new THREE.Mesh(geometry, material);
    gameState.player.rotation.x = Math.PI / 2;
    gameState.player.position.set(0, -10, 0);
    gameState.scene.add(gameState.player);
    
    // Engine exhaust particles
    const particleCount = 30;
    const particles = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    
    for(let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 0.5;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.2,
        color: 0x00aaff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    gameState.engineParticles = new THREE.Points(particles, particleMaterial);
    gameState.engineParticles.position.y = -1.5;
    gameState.player.add(gameState.engineParticles);
    
    // Engine glow light
    gameState.engineLight = new THREE.PointLight(0x00aaff, 1, 5);
    gameState.engineLight.position.set(0, -1.5, 0);
    gameState.player.add(gameState.engineLight);
}

// Enhanced bullet effects
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
}

// Enhanced explosion effect
function createExplosion(pos) {
    // Particle explosion
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);
    const sizeArray = new Float32Array(particleCount);
    
    for(let i = 0; i < particleCount; i++) {
        // Positions
        posArray[i * 3] = pos.x + (Math.random() - 0.5) * 2;
        posArray[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 2;
        posArray[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 2;
        
        // Colors (gradient from yellow to red)
        colorArray[i * 3] = 1.0; // R
        colorArray[i * 3 + 1] = Math.random() * 0.8; // G
        colorArray[i * 3 + 2] = 0.0; // B
        
        // Sizes
        sizeArray[i] = Math.random() * 0.5 + 0.3;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
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
    
    // Animate particles
    const startTime = Date.now();
    const duration = 1000; // 1 second
    
    function animateParticles() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            // Update particle positions (fly outward)
            const positions = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += (Math.random() - 0.5) * 0.2;
                positions[i * 3 + 1] += (Math.random() - 0.5) * 0.2;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.2;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 1 - progress;
            requestAnimationFrame(animateParticles);
        } else {
            gameState.scene.remove(particleSystem);
        }
    }
    
    animateParticles();
    sounds.explosion.play();
}

// In your animate() function, add these updates:
function animate(currentTime) {
    // ... existing code ...
    
    // Update energy core animation
    if (gameState.energyCore) {
        gameState.energyCore.material.uniforms.time.value = currentTime / 1000;
    }
    
    // Update engine particles
    if (gameState.engineParticles) {
        const positions = gameState.engineParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Random movement for particle effect
            positions[i] += (Math.random() - 0.5) * 0.05;
            positions[i + 1] = -Math.abs(positions[i + 1]) - 0.1;
            if (positions[i + 1] < -1.5) positions[i + 1] = 0;
        }
        gameState.engineParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Update bullet trails
    gameState.bullets.concat(gameState.enemyBullets).forEach(bullet => {
        if (bullet.userData.trail) {
            const geometry = bullet.userData.trail.geometry;
            const positions = [bullet.userData.lastPosition, bullet.position];
            geometry.setFromPoints(positions);
            bullet.userData.lastPosition = bullet.position.clone();
        }
    });
    
    // ... rest of your animation code ...
}
        // Post-processing setup for advanced effects
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

// Enhanced tunnel with procedural textures
function createTunnel() {
  // Main tunnel
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
  
  // Add displacement map for surface detail
  const displacementMap = new THREE.TextureLoader().load('assets/textures/hex_pattern.png');
  displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping;
  tunnelMaterial.displacementMap = displacementMap;
  tunnelMaterial.displacementScale = 0.2;
  
  gameState.tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
  gameState.tunnel.rotation.x = Math.PI / 2;
  gameState.scene.add(gameState.tunnel);

  // Inner energy field
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

// Player ship with engine trail
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

// Enhanced enemy explosions
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
}

// Dynamic lighting effects
function updateLighting() {
  // Pulsing ambient light
  const time = gameState.clock.getElapsedTime();
  const intensity = 0.4 + Math.sin(time * 2) * 0.1;
  gameState.scene.children.forEach(child => {
    if (child instanceof THREE.AmbientLight) {
      child.intensity = intensity;
    }
  });
  
  // Weapon charge glow
  if (gameState.activePowerup === 'LASER') {
    const charge = (gameState.powerupEndTime - time) / POWERUP_TYPES.LASER.duration;
    gameState.player.children.forEach(child => {
      if (child instanceof THREE.PointLight) {
        child.intensity = charge * 2;
        child.distance = 3 + charge * 2;
      }
    });
  }
}

// Enhanced animate function
function animate(currentTime) {
  requestAnimationFrame(animate);
  
  // Calculate delta time for smooth animation
  gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
  gameState.lastFrameTime = currentTime;
  
  if (!gameState.gameActive || gameState.gamePaused) return;
  
  const elapsedTime = gameState.clock.getElapsedTime();
  
  // Update engine trail
  if (gameState.engineTrail) {
    const positions = gameState.engineTrail.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = 0;
      positions[i + 1] = -1 - (i/3 * 0.1) + Math.sin(elapsedTime * 10 + i) * 0.05;
      positions[i + 2] = 0;
    }
    gameState.engineTrail.geometry.attributes.position.needsUpdate = true;
  }
  
  // Update all game systems
  updateTunnel();
  updatePlayer(gameState.deltaTime);
  updateEnemies(gameState.deltaTime);
  updateBullets(gameState.deltaTime);
  updatePowerups();
  updateLighting();
  checkCollisions();
  
  // Render with post-processing
  if (gameState.composer) {
    gameState.composer.render();
  } else {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
}

// Initialize with post-processing
function init() {
  setupScene();
  setupCamera();
  setupRenderer();
  createGameElements();
  setupEventListeners();
  
  // Initialize post-processing after everything else
  gameState.composer = initPostProcessing();
  
  showStartScreen();
  animate();
}
