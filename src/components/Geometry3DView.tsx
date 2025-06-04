// src/components/Geometry3DViewer.tsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";

interface Geometry3DViewerProps {
  sides: number;
  radius: number;
}

const Geometry3DViewer: React.FC<Geometry3DViewerProps> = ({
  sides,
  radius,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null); // Ref for the animation frame request
  const [isExporting, setIsExporting] = useState<boolean>(false); // State to track if export is in progress
  const [exportFormat, setExportFormat] = useState<string>(""); // State to track current export format for UI feedback
  const [autoRotate, setAutoRotate] = useState<boolean>(true); // State for auto-rotation toggle

  /**
   * Creates or updates the 3D geometry (extruded polygon) in the scene.
   * @param sides Number of sides for the polygon base.
   * @param radius Radius of the polygon base.
   * @param scene The THREE.js scene to add the mesh to.
   */
  const createGeometry = (
    sides: number,
    radius: number,
    scene: THREE.Scene
  ) => {
    // If a mesh already exists, remove it and dispose of its geometry/material
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach((material) => material.dispose());
      } else {
        meshRef.current.material.dispose();
      }
    }

    // Create a 2D shape (polygon) which will be extruded.
    const shape = new THREE.Shape();
    const angleStep = (2 * Math.PI) / sides; // Angle between vertices

    // Define vertices for the 2D polygon
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      if (i === 0) {
        shape.moveTo(x, y); // Starting point
      } else {
        shape.lineTo(x, y); // Subsequent points
      }
    }
    shape.closePath(); // Close the shape to form a polygon

    // Settings for extruding the 2D shape into a 3D geometry.
    // Bevels add rounded edges for a smoother, more realistic look.
    const extrudeSettings = {
      depth: 40,             // How far to extrude the shape
      bevelEnabled: true,    // Enable beveling
      bevelThickness: 2,   // How deep the bevel goes
      bevelSize: 3,          // How far the bevel extends from the edge
      bevelOffset: 0,        // Offset of the bevel from the original shape outline
      bevelSegments: 3,      // Number of segments for the bevel (smoother curves)
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Material for the mesh. MeshStandardMaterial interacts with lights.
    const material = new THREE.MeshStandardMaterial({
      color: `hsl(${sides * 30}, 70%, 50%)`, // Dynamic color based on number of sides
      metalness: 0.6,         // How metallic the material looks (0-1)
      roughness: 0.4,         // How rough the surface is (0-1, less rough = more reflective)
      flatShading: false,     // Use smooth shading for a polished look
      // envMapIntensity: 0.8, // Intensity of environment map reflection (if envMap is set)
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;    // The mesh will cast shadows
    mesh.receiveShadow = true; // The mesh will receive shadows
    mesh.rotation.x = -Math.PI / 2; // Rotate to lay it flat on the XZ plane (as if Y is up)

    scene.add(mesh); // Add the mesh to the scene
    meshRef.current = mesh; // Store reference to the mesh
  };

  /**
   * Exports the current 3D shape to either GLB or OBJ format.
   * @param format The desired export format ("glb" or "obj").
   */
  const exportShape = (format: "glb" | "obj") => {
    if (!meshRef.current || !sceneRef.current) return; // Ensure mesh and scene exist

    setIsExporting(true); // Set exporting state for UI feedback
    setExportFormat(format);

    // Use setTimeout to allow UI to update before potentially blocking export operation
    setTimeout(() => {
      try {
        if (format === "glb") {
          const exporter = new GLTFExporter();
          // Parse the mesh (or a group/scene containing it)
          exporter.parse(
            meshRef.current as THREE.Object3D, // The object to export
            (gltf) => { // Success callback
              // Create a Blob from the GLTF data (which is an ArrayBuffer for binary GLB)
              const blob = new Blob([gltf as ArrayBuffer], {
                type: "application/octet-stream", // MIME type for binary files
              });
              // Create a temporary link and trigger download
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `shape-${sides}-sides.glb`; // Filename
              link.click();
              URL.revokeObjectURL(link.href); // Clean up object URL

              setTimeout(() => { setIsExporting(false); setExportFormat(""); }, 1000); // Reset UI
            },
            (error) => { // Error callback
              console.error("An error happened during GLB export:", error);
              setIsExporting(false); setExportFormat("");
            },
            { binary: true } // Options: binary true for GLB, false for glTF JSON
          );
        } else if (format === "obj") {
          const exporter = new OBJExporter();
          const result = exporter.parse(meshRef.current as THREE.Object3D); // Parse returns string data
          // Create a Blob from the OBJ string data
          const blob = new Blob([result], { type: "text/plain" });
          // Create a temporary link and trigger download
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `shape-${sides}-sides.obj`; // Filename
          link.click();
          URL.revokeObjectURL(link.href); // Clean up object URL

          setTimeout(() => { setIsExporting(false); setExportFormat(""); }, 1000); // Reset UI
        }
      } catch (error) {
        console.error("Error exporting model:", error);
        setIsExporting(false); setExportFormat("");
      }
    }, 100); // Small delay to allow UI to show "Exporting..."
  };

  // Main useEffect hook for setting up and managing the Three.js scene.
  // Runs when `sides`, `radius`, or `autoRotate` props/state change.
  useEffect(() => {
    if (!mountRef.current) return; // Ensure the mount point exists in the DOM

    // Core Three.js components setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa); // Light gray background color

    // Perspective camera: fov, aspect ratio, near clip, far clip
    // Aspect ratio is 1 because the canvas is fixed at 400x400
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      antialias: true, // Enable anti-aliasing for smoother edges
      alpha: true,     // Allow transparent background (though scene.background is set)
    });
    renderer.setSize(400, 400); // Set renderer size (matches canvas size)
    renderer.shadowMap.enabled = true; // Enable shadow mapping
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadow edges
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Correct color space for display (updated from outputEncoding)
    renderer.setPixelRatio(window.devicePixelRatio); // Use device pixel ratio for sharper rendering on high DPI screens
    mountRef.current.appendChild(renderer.domElement); // Attach renderer's canvas to the DOM

    // Lighting setup for the scene
    // Ambient light provides a base level of illumination for all objects
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // color, intensity
    scene.add(ambientLight);

    // Directional light simulates sunlight, casts shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7); // Position of the light
    directionalLight.castShadow = true;      // Enable shadow casting for this light
    // Configure shadow map resolution for quality
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Fill light to soften shadows and add more dimensionality
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -7); // Positioned opposite to the main directional light
    scene.add(fillLight);

    // Rim light to create highlights on edges, separating object from background
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -5, -2); // Positioned to hit edges
    scene.add(rimLight);

    // Grid helper for visual reference of the ground plane
    const gridHelper = new THREE.GridHelper(200, 20, 0xaaaaaa, 0xdddddd); // size, divisions, colorCenterLine, colorGrid
    gridHelper.position.y = -50; // Position below the shape
    scene.add(gridHelper);

    // Environment cube (skybox-like) for a subtle background feel
    // Using basic materials for a simple colored environment rather than a texture.
    const cubeGeometry = new THREE.BoxGeometry(500, 500, 500); // Large box
    const cubeMaterials = [ // One material per face
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }), // right
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }), // left
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }), // top
      new THREE.MeshBasicMaterial({ color: 0xf0f0f0, side: THREE.BackSide }), // bottom (slightly darker floor)
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }), // front
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }), // back
    ];
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    scene.add(cube);

    // Initial camera position and orientation
    camera.position.set(0, 50, 300); // Positioned to view the shape from a distance
    camera.lookAt(0, 0, 0); // Look at the center of the scene

    // OrbitControls for user interaction (rotate, zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;    // Smooths out camera movement
    controls.dampingFactor = 0.05;  // Damping intensity
    controls.autoRotate = autoRotate; // Enable/disable auto-rotation based on state
    controls.autoRotateSpeed = 1.5; // Speed of auto-rotation
    controls.enablePan = false;     // Disable panning the camera
    controls.minDistance = 150;     // Minimum zoom distance
    controls.maxDistance = 400;     // Maximum zoom distance
    controls.update(); // Must be called after any manual changes to the camera's transform
    controlsRef.current = controls; // Store reference to controls

    // Create the main 3D shape geometry
    createGeometry(sides, radius, scene);

    // Animation loop function
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate); // Request next frame

      // Update controls if damping or auto-rotation is enabled
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate; // Update autoRotate state
        controlsRef.current.update(); // Required for damping and auto-rotation
      }

      renderer.render(scene, camera); // Render the scene from the camera's perspective
    };

    animate(); // Start the animation loop

    // Event listener for window resize (though canvas size is fixed here, good practice)
    const onWindowResize = () => {
      if (camera && renderer) {
        // Canvas is fixed size 400x400, so aspect is always 1.
        // If it were responsive, you'd calculate aspect from mountRef.current.clientWidth / clientHeight
        camera.aspect = 1;
        camera.updateProjectionMatrix(); // Update camera projection matrix on aspect change
        renderer.setSize(400, 400);    // Ensure renderer size matches
      }
    };
    window.addEventListener("resize", onWindowResize);
    onWindowResize(); // Call once initially to set size

    // Store references to scene, camera, renderer for potential use or cleanup
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Cleanup function: called when the component unmounts or dependencies change
    return () => {
      window.removeEventListener("resize", onWindowResize); // Remove resize listener

      // Stop the animation loop
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Remove renderer's canvas from DOM if it's still there
      if (
        mountRef.current &&
        renderer.domElement.parentNode === mountRef.current
      ) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose of the main shape's geometry and material
      if (meshRef.current) {
        scene.remove(meshRef.current); // Remove from scene first
        meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach((material) => material.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }

      // Traverse the scene and dispose of all other geometries and materials
      // This is important for freeing up GPU memory and preventing leaks.
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              // Check if material has a dispose method (some, like ShaderMaterial, might not directly)
              if (typeof (object.material as any).dispose === 'function') {
                 (object.material as any).dispose();
              }
            }
          }
        }
      });

      // Dispose of lights (though often not strictly necessary for basic lights unless they have complex resources)
      // For this example, basic lights don't hold significant resources needing manual disposal beyond scene removal.

      // Dispose of the renderer itself
      renderer.dispose();
    };
  }, [sides, radius, autoRotate]); // Re-run effect if these change

  return (
    <div className="flex flex-col items-center">
      {/* 3D Viewer Container */}
      <div
        ref={mountRef}
        className="relative w-full h-80 md:h-96 rounded-lg overflow-hidden border-2 border-gray-100 shadow-inner mb-4"
        style={{
          touchAction: "none",
          cursor: "grab",
          background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
        }}
        onMouseDown={() => {
          if (mountRef.current) {
            mountRef.current.style.cursor = "grabbing";
          }
        }}
        onMouseUp={() => {
          if (mountRef.current) {
            mountRef.current.style.cursor = "grab";
          }
        }}
        onMouseLeave={() => {
          if (mountRef.current) {
            mountRef.current.style.cursor = "grab";
          }
        }}
      >
        {/* Loading Indicator */}
        {isExporting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
            <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mb-2"></div>
              <p className="text-gray-800 font-medium">
                Exporting {exportFormat.toUpperCase()}...
              </p>
            </div>
          </div>
        )}

        {/* Auto-rotate toggle */}
        <button
          className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-md z-10 flex items-center justify-center transition-colors duration-200 ${
            autoRotate ? "bg-green-500 text-white" : "bg-white text-gray-700"
          }`}
          onClick={() => setAutoRotate(!autoRotate)}
          title={autoRotate ? "Disable Auto-Rotation" : "Enable Auto-Rotation"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <button
          onClick={() => exportShape("glb")}
          disabled={isExporting}
          className={`px-4 py-2 rounded-lg shadow-md transition-all duration-150 flex items-center gap-2
            ${
              isExporting
                ? "bg-gray-300 cursor-not-allowed"
                : `bg-green-500 text-white hover:bg-green-600 active:transform active:scale-95`
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isExporting && exportFormat === "glb"
            ? "Exporting..."
            : "Export .glb"}
        </button>

        <button
          onClick={() => exportShape("obj")}
          disabled={isExporting}
          className={`px-4 py-2 rounded-lg shadow-md transition-all duration-150 flex items-center gap-2
            ${
              isExporting
                ? "bg-gray-300 cursor-not-allowed"
                : `bg-purple-500 text-white hover:bg-purple-600 active:transform active:scale-95`
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isExporting && exportFormat === "obj"
            ? "Exporting..."
            : "Export .obj"}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Click and drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default Geometry3DViewer;
