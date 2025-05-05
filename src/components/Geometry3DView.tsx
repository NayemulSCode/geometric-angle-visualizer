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
  const animationFrameRef = useRef<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<string>("");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Create geometry based on sides and radius
  const createGeometry = (
    sides: number,
    radius: number,
    scene: THREE.Scene
  ) => {
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach((material) => material.dispose());
      } else {
        meshRef.current.material.dispose();
      }
    }

    // Create polygon shape
    const shape = new THREE.Shape();
    const angleStep = (2 * Math.PI) / sides;

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    // Extrude settings with beveling for a more polished look
    const extrudeSettings = {
      depth: 40,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 3,
      bevelOffset: 0,
      bevelSegments: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Create material with environment mapping for a more reflective look
    const material = new THREE.MeshStandardMaterial({
      color: `hsl(${sides * 30}, 70%, 50%)`,
      metalness: 0.6,
      roughness: 0.4,
      flatShading: false,
      envMapIntensity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2; // Lay flat

    scene.add(mesh);
    meshRef.current = mesh;
  };

  // Export shape to GLB or OBJ format
  const exportShape = (format: "glb" | "obj") => {
    if (!meshRef.current || !sceneRef.current) return;

    setIsExporting(true);
    setExportFormat(format);

    setTimeout(() => {
      try {
        if (format === "glb") {
          const exporter = new GLTFExporter();
          exporter.parse(
            meshRef.current as THREE.Object3D,
            (gltf) => {
              const blob = new Blob([gltf as ArrayBuffer], {
                type: "application/octet-stream",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `shape-${sides}-sides.glb`;
              link.click();

              setTimeout(() => {
                setIsExporting(false);
                setExportFormat("");
              }, 1000);
            },
            (error) => {
              console.error("An error happened during GLB export:", error);
              setIsExporting(false);
              setExportFormat("");
            },
            { binary: true }
          );
        } else if (format === "obj") {
          const exporter = new OBJExporter();
          const result = exporter.parse(meshRef.current as THREE.Object3D);
          const blob = new Blob([result], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `shape-${sides}-sides.obj`;
          link.click();

          setTimeout(() => {
            setIsExporting(false);
            setExportFormat("");
          }, 1000);
        }
      } catch (error) {
        console.error("Error exporting model:", error);
        setIsExporting(false);
        setExportFormat("");
      }
    }, 100);
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(400, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // @ts-ignore
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add a soft light from opposite direction for more depth
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -7);
    scene.add(fillLight);

    // Add a subtle rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -5, -2);
    scene.add(rimLight);

    // Add a grid for better 3D visualization
    const gridHelper = new THREE.GridHelper(200, 20, 0xaaaaaa, 0xdddddd);
    gridHelper.position.y = -50;
    scene.add(gridHelper);

    // Add a subtle environment cube
    const cubeGeometry = new THREE.BoxGeometry(500, 500, 500);
    const cubeMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0xf0f0f0, side: THREE.BackSide }), // Floor is slightly darker
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }),
      new THREE.MeshBasicMaterial({ color: 0xf8f9fa, side: THREE.BackSide }),
    ];
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    scene.add(cube);

    // Camera position
    camera.position.set(0, 50, 300);
    camera.lookAt(0, 0, 0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;
    controls.enablePan = false;
    controls.minDistance = 150;
    controls.maxDistance = 400;
    controls.update();
    controlsRef.current = controls;

    // Create geometry based on sides
    createGeometry(sides, radius, scene);

    // Handle animation
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    // Start animation
    animate();

    // Handle window resize
    const onWindowResize = () => {
      if (camera && renderer) {
        camera.aspect = 1;
        camera.updateProjectionMatrix();
        renderer.setSize(400, 400);
      }
    };

    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    // Save references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Clean up on unmount
    return () => {
      window.removeEventListener("resize", onWindowResize);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (
        mountRef.current &&
        renderer.domElement.parentNode === mountRef.current
      ) {
        mountRef.current.removeChild(renderer.domElement);
      }

      if (meshRef.current) {
        scene.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach((material) => material.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }

      // Dispose of cube mesh
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
    };
  }, [sides, radius, autoRotate]);

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
