// Ensure DOM is fully loaded before executing scripts
document.addEventListener("DOMContentLoaded", () => {
    console.log("Website Loaded Successfully");

    // Load Three.js dynamically if not already available
    if (typeof THREE === "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        script.onload = initializeThreeJS;
        document.head.appendChild(script);
    } else {
        initializeThreeJS();
    }
    
    // Function to initialize Three.js elements
    function initializeThreeJS() {
        console.log("Three.js Initialized");

        // Create scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Create a rotating 3D cube as a test
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Lighting
        const light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);

        // Position camera
        camera.position.z = 5;

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }

        animate();

        // Adjust canvas on window resize
        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        console.log("Three.js Scene Rendered Successfully");
    }
});
