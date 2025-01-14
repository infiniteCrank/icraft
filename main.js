import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics world setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Set gravity

// Create ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Create physics body for ground
const groundBody = new CANNON.Body({
    mass: 0 // Static body
});
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Correct rotation
world.addBody(groundBody);

// Create player cube
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Create physics body for player
const playerBody = new CANNON.Body({
    mass: 1 // Dynamic body
});
playerBody.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)));
playerBody.position.set(0, 0.5, 0); // Adjust initial position to be above the ground
world.addBody(playerBody);

// Camera positioning
camera.position.set(0, 2, 5); // Start position behind and above the player
camera.lookAt(player.position);

// Event listener for keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Jump when spacebar is pressed
    if (e.code === 'Space') {
        if (playerBody.position.y <= 0.5) { // Only jump if touching the ground
            playerBody.velocity.y = 5; // Apply an upward force for jump
        }
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    // Handle player movement
    if (keys['ArrowUp']) {
        playerBody.position.z -= 0.1; // Move forward
    }
    if (keys['ArrowDown']) {
        playerBody.position.z += 0.1; // Move backward
    }
    if (keys['ArrowLeft']) {
        playerBody.position.x -= 0.1; // Move left
    }
    if (keys['ArrowRight']) {
        playerBody.position.x += 0.1; // Move right
    }

    // Sync Three.js and Cannon.js
    player.position.copy(playerBody.position);
    player.quaternion.copy(playerBody.quaternion);

    // Update camera position to follow the player
    camera.position.set(player.position.x, player.position.y + 2, player.position.z + 5); // Follow the player
    camera.lookAt(player.position); // Look at player

    // Update physics world
    world.step(1 / 60);
    
    // Render the scene
    renderer.render(scene, camera);
}

animate();