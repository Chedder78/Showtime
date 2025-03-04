// Three.js Setup for 3D Flip Animation
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.module.js';

// Initialize Scene, Camera, and Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Adding a Rotating 3D Card
const geometry = new THREE.BoxGeometry(3, 2, 0.1);
const material = new THREE.MeshBasicMaterial({ color: 0xffd700, wireframe: true });
const card = new THREE.Mesh(geometry, material);
scene.add(card);
camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    card.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

// GSAP Scroll Animations
gsap.registerPlugin(ScrollTrigger);

gsap.from('.showcase-item', {
    scrollTrigger: {
        trigger: '.showcase-item',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 50,
    duration: 1
});

gsap.from('.feature-item', {
    scrollTrigger: {
        trigger: '.feature-item',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.2
});

// Video Background with Image Fades
let videoBg = document.createElement('video');
videoBg.src = 'luxury-home-theater.mp4';
videoBg.autoplay = true;
videoBg.loop = true;
videoBg.muted = true;
videoBg.classList.add('video-background');
document.body.prepend(videoBg);

const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
let imageIndex = 0;
const fadingImage = document.createElement('img');
fadingImage.classList.add('fading-image');
document.body.appendChild(fadingImage);

function fadeImages() {
    fadingImage.src = images[imageIndex];
    gsap.to(fadingImage, { opacity: 1, duration: 2, onComplete: () => {
        setTimeout(() => {
            gsap.to(fadingImage, { opacity: 0, duration: 2 });
            imageIndex = (imageIndex + 1) % images.length;
        }, 3000);
    }});
}
setInterval(fadeImages, 5000);
