import * as THREE from "three";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics world setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Standard gravity

// Create ground
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Align it horizontally
scene.add(ground);

// Create a physics body for the ground
const groundBody = new CANNON.Body({ mass: 0 });
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

// Variables to track collected items
let collectedCubes = 0;
// This will hold the physics bodies of cubes to be removed
const cubesToRemove = [];

// Function to create random platforms and collectable cubes
function createPlatforms(numPlatforms) {
  for (let i = 0; i < numPlatforms; i++) {
    const platformWidth = 1; // Width of the platform
    const platformDepth = 1; // Depth of the platform
    const platformHeight = 0.1; // Height of the platform

    // Create the platform geometry and material
    const platformGeometry = new THREE.BoxGeometry(
      platformWidth,
      platformHeight,
      platformDepth
    );
    const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Color of the platform
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);

    // Generate random positions for the platforms within the bounds
    const maxPosition = 4; // Maximum X/Z position (within ground size)
    const minY = 0.5; // Minimum height (above ground)
    const maxY = 2; // Set max height to ensure it's less than the player's jump height

    // Setting the random position for the platform
    platform.position.set(
      Math.random() * (maxPosition * 2) - maxPosition, // Random X
      Math.random() * (maxY - minY) + minY, // Random Y (platform's height)
      Math.random() * (maxPosition * 2) - maxPosition // Random Z
    );

    // Add the platform to the scene
    scene.add(platform);

    // Create a physics body for the platform
    const platformBody = new CANNON.Body({
      mass: 0, // Static platform
    });
    platformBody.addShape(
      new CANNON.Box(
        new CANNON.Vec3(
          platformWidth / 2,
          platformHeight / 2,
          platformDepth / 2
        )
      )
    ); // Half dimensions for physics
    platformBody.position.copy(platform.position); // Position the physics body at the same location
    world.addBody(platformBody); // Add platform body to the physics world

    // Create a cube (object) to place on top of the platform
    const cubeSize = 0.3; // Size of the cube
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Color of the cube
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // Position the cube on top of the platform
    cube.position.set(
      platform.position.x,
      platform.position.y + platformHeight / 2 + cubeSize / 2,
      platform.position.z
    );

    // Add the cube to the scene
    scene.add(cube);

    // Create a physics body for the cube
    const cubeBody = new CANNON.Body({
      mass: 1, // Give it mass to be affected by physics
    });
    cubeBody.addShape(
      new CANNON.Box(new CANNON.Vec3(cubeSize / 2, cubeSize / 2, cubeSize / 2))
    ); // Half dimensions for physics
    cubeBody.position.copy(cube.position); // Position the physics body at the same location
    world.addBody(cubeBody); // Add cube body to the physics world

    // Set a custom property to identify this cube
    cubeBody.userData = { isCollectible: true, mesh: cube }; // Store a reference to its Three.js mesh

    // Handle player collision with the cube
    cubeBody.addEventListener('collide', (event) => {
        if (event.body === playerBody && cubeBody.userData.isCollectible) {
            cubeBody.userData.isCollectible = false; // Prevent further collections
            cubesToRemove.push(cubeBody);
            scene.remove(cube); // Remove from scene
            collectedCubes++; // Increment the collected cubes count
            console.log(`Collected cubes: ${collectedCubes}`);
        }
    });
  }
}

// Create 5 random platforms
createPlatforms(5);

// Camera positioning
camera.position.set(0, 2, 5);
camera.lookAt(player.position);

// Event listener for keyboard controls
const keys = {};
let isGrounded = false;

// Player collision detection
playerBody.addEventListener("collide", (event) => {
  // Check if collision is with static bodies (ground or platforms)
  if (event.body === groundBody || event.body.mass === 0) {
    isGrounded = true; // Player is grounded when colliding with platforms or ground
  }
});

playerBody.addEventListener("endContact", (event) => {
  // Check if leaving collision with static bodies
  if (event.body === groundBody || event.body.mass === 0) {
    isGrounded = false; // Player is no longer grounded after leaving platforms or ground
  }
});

// Control logic
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  // Jump when the spacebar is pressed
  if (e.code === "Space" && isGrounded) {
    playerBody.velocity.y = 5; // Apply an upward force for jump
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  // Update physics world
  world.step(1 / 60);

  // Remove marked cubes from the physics world
  while (cubesToRemove.length) {
    const bodyToRemove = cubesToRemove.pop();
    world.remove(bodyToRemove); // Remove from physics world
  }

  // Sync Three.js objects with Cannon.js bodies
  player.position.copy(playerBody.position);
  player.quaternion.copy(playerBody.quaternion);

  // Sync feet positions with the player
  leftFoot.position.set(
    player.position.x - 0.3,
    player.position.y,
    player.position.z
  );
  rightFoot.position.set(
    player.position.x + 0.3,
    player.position.y,
    player.position.z
  );

  // Basic animation: "bouncing" effect on movement
  const scaleFactor = 0.1; // Adjust this value for bounce strength
  if (
    keys["ArrowUp"] ||
    keys["ArrowDown"] ||
    keys["ArrowLeft"] ||
    keys["ArrowRight"]
  ) {
    player.scale.y = 1 + Math.sin(Date.now() * 0.005) * scaleFactor; // Bounce while moving
  } else {
    player.scale.y = 1; // Reset scale when not moving
  }

  // Update camera position to follow the player
  camera.position.set(
    player.position.x,
    player.position.y + 2,
    player.position.z + 5
  );
  camera.lookAt(player.position);

  // Set the linear velocity directly to control player movement
  const targetVelocity = new CANNON.Vec3(0, 0, 0);
  if (keys["ArrowUp"]) {
    targetVelocity.z = -5; // Move forward
  }
  if (keys["ArrowDown"]) {
    targetVelocity.z = 5; // Move backward
  }
  if (keys["ArrowLeft"]) {
    targetVelocity.x = -5; // Move left
  }
  if (keys["ArrowRight"]) {
    targetVelocity.x = 5; // Move right
  }

  // Set the player's linear velocity
  playerBody.velocity.x = targetVelocity.x;
  playerBody.velocity.z = targetVelocity.z;

  // Disable rotation
  playerBody.angularVelocity.set(0, 0, 0); // Reset angular velocity to zero
  playerBody.quaternion.set(0, 0, 0, 1); // Keep the player upright

  // Render the scene
  renderer.render(scene, camera);
}

// Start the animation loop
animate();
