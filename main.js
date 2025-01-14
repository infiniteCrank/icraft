import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics world setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Standard gravity

// Create ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Align it horizontally
scene.add(ground);

// Create a physics body for the ground
const groundBody = new CANNON.Body({
    mass: 0 // Make it static
});
groundBody.addShape(new CANNON.Plane());
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Align the plane
world.addBody(groundBody);

// Create player cube (body)
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Create a physics body for the player
const playerBody = new CANNON.Body({
    mass: 1,
    linearDamping: 0.9,
    angularDamping: 0.9,
});
playerBody.addShape(new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)));
playerBody.position.set(0, 2.5, 0); // Start above the ground
world.addBody(playerBody);

// Create feet
const footGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const footMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
leftFoot.position.set(-0.3, 2, 0); // Position left foot
scene.add(leftFoot);

const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
rightFoot.position.set(0.3, 2, 0); // Position right foot
scene.add(rightFoot);

// Create physics bodies for feet
const leftFootBody = new CANNON.Body({
    mass: 1,
    linearDamping: 0.9,
    angularDamping: 0.9,
});
leftFootBody.addShape(new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1)));
leftFootBody.position.set(-0.3, 2, 0); // Position left foot
world.addBody(leftFootBody);

const rightFootBody = new CANNON.Body({
    mass: 1,
    linearDamping: 0.9,
    angularDamping: 0.9,
});
rightFootBody.addShape(new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1)));
rightFootBody.position.set(0.3, 2, 0); // Position right foot
world.addBody(rightFootBody);

// Camera positioning
camera.position.set(0, 2, 5);
camera.lookAt(player.position);

// Event listener for keyboard controls
const keys = {};
let isGrounded = false;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Jump when the spacebar is pressed
    if (e.code === 'Space' && isGrounded) {
        playerBody.velocity.y = 5; // Apply an upward force for jump
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Target velocity for player movement
    const targetVelocity = new CANNON.Vec3(0, 0, 0);

    // Handle player movement based on key presses
    if (keys['ArrowUp']) {
        targetVelocity.z = -5; // Move forward
    }
    if (keys['ArrowDown']) {
        targetVelocity.z = 5; // Move backward
    }
    if (keys['ArrowLeft']) {
        targetVelocity.x = -5; // Move left
    }
    if (keys['ArrowRight']) {
        targetVelocity.x = 5; // Move right
    }

    // Set the linear velocity directly to control player movement
    playerBody.velocity.x = targetVelocity.x;
    playerBody.velocity.z = targetVelocity.z;

    // Disable rotation
    playerBody.angularVelocity.set(0, 0, 0); // Reset angular velocity to zero
    playerBody.quaternion.set(0, 0, 0, 1); // Keep the player upright

    // Sync Three.js and Cannon.js
    player.position.copy(playerBody.position);
    player.quaternion.copy(playerBody.quaternion);

    // Sync feet positions with the player
    leftFoot.position.set(player.position.x - 0.3, player.position.y, player.position.z); // Update left foot position
    rightFoot.position.set(player.position.x + 0.3, player.position.y, player.position.z); // Update right foot position

    // Basic animation: "bouncing" effect on movement
    const scaleFactor = 0.1; // Adjust this value for bounce strength
    if (targetVelocity.x !== 0 || targetVelocity.z !== 0) {
        player.scale.y = 1 + Math.sin(Date.now() * 0.005) * scaleFactor; // Bounce while moving
    } else {
        player.scale.y = 1; // Reset scale when not moving
    }

    // Update grounded state (considering the height of the player)
    isGrounded = playerBody.position.y <= 0.5;

    // Update camera position to follow the player
    camera.position.set(player.position.x, player.position.y + 2, player.position.z + 5); // Follow the player
    camera.lookAt(player.position);

    // Update physics world
    world.step(1 / 60);

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
