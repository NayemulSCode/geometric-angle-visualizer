// src/components/GeometryShapes.tsx
import React, { useEffect, useState } from "react";

interface GeometryShapesProps {
  n: number;
  radius: number;
  showInterior: boolean;
  showExterior: boolean;
  isStar?: boolean;
  onPointsChange: (points: { x: number; y: number }[]) => void;
}

const GeometryShapes: React.FC<GeometryShapesProps> = ({
  n,
  radius,
  showInterior,
  showExterior,
  isStar = false,
  onPointsChange,
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [hovered, setHovered] = useState<number | null>(null); // Index of the hovered drag handle
  const center = { x: 200, y: 200 }; // Center of the SVG canvas

  /**
   * Initializes or re-calculates the points (vertices) of the shape.
   * @param n Number of sides (or spikes for a star).
   * @param radius Current radius of the shape.
   * @param isStar True if the shape should be a star, false for a regular polygon.
   * @returns Array of {x, y} points.
   */
  const initializePoints = (n: number, radius: number, isStar: boolean) => {
    const cx = center.x; // X-coordinate of the center
    const cy = center.y; // Y-coordinate of the center
    const newPoints = [];

    if (!isStar) {
      // Calculate points for a regular polygon
      for (let i = 0; i < n; i++) {
        // Angle for each vertex, adjusted by -PI/2 to start the first point at the top
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        newPoints.push({ x, y });
      }
    } else {
      // Calculate points for a star shape
      const spikes = n; // Number of spikes for the star
      const outerRadius = radius;
      const innerRadius = radius / 2; // Inner radius for the star points

      for (let i = 0; i < spikes * 2; i++) {
        // Alternate between outer and inner radius for each point
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        // Angle for each vertex (both outer and inner points of the star)
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        newPoints.push({ x, y });
      }
    }
    return newPoints;
  };

  /**
   * Calculates the positions and values for displaying interior and exterior angles.
   * Note: This is for regular polygons. Star angles are more complex and not explicitly calculated here for display.
   * @returns Object containing arrays of interior and exterior angle data.
   */
  const calculateAngles = () => {
    if (points.length === 0 || isStar) return { interiorAngles: [], exteriorAngles: [] }; // No angles for stars currently

    // Calculate angle values based on 'n' (number of sides)
    // These are properties of regular polygons.
    const interiorAngleValue = (((n - 2) * 180) / n).toFixed(1);
    const exteriorAngleValue = (360 / n).toFixed(1);

    const interiorAngles = [];
    const exteriorAngles = [];

    for (let i = 0; i < n; i++) {
      const p1 = points[i]; // Current vertex
      const p2 = points[(i + 1) % n]; // Next vertex

      if (!p1 || !p2) continue; // Should not happen with initialized points

      // Midpoint of the side formed by p1 and p2, used as a base for placing angle text
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Direction vector from center to the current vertex p1, used to offset angle text
      // towards/away from the center.
      const angleDir = Math.atan2(p1.y - center.y, p1.x - center.x);

      const interiorOffset = 25; // Distance from edge midpoint towards the center for interior angle text
      const exteriorOffset = 45; // Distance from edge midpoint away from the center for exterior angle text

      // Position for interior angle text
      const interiorX = midX + Math.cos(angleDir) * interiorOffset;
      const interiorY = midY + Math.sin(angleDir) * interiorOffset;

      // Position for exterior angle text
      // Note: The exact placement for visual representation of exterior angles can be complex.
      // This simplified approach places text near the vertex along an outward vector.
      const exteriorX = midX - Math.cos(angleDir) * exteriorOffset; // Crude outward placement
      const exteriorY = midY - Math.sin(angleDir) * exteriorOffset; // Crude outward placement


      interiorAngles.push({ x: interiorX, y: interiorY, value: interiorAngleValue });
      exteriorAngles.push({ x: exteriorX, y: exteriorY, value: exteriorAngleValue });
    }

    return { interiorAngles, exteriorAngles };
  };

  /**
   * Handles mouse down event on a drag handle.
   * Sets the dragging state and changes cursor.
   * @param index Index of the drag handle (vertex) being dragged.
   * @param e Mouse event.
   */
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser drag behavior
    setDraggingIndex(index); // Set the index of the point being dragged
    document.body.style.cursor = "grabbing"; // Change cursor to indicate dragging
  };

  /**
   * Handles mouse move event on the SVG canvas.
   * If a drag handle is being dragged, calculates the new radius and updates points.
   * @param e Mouse event.
   */
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (draggingIndex !== null) { // Check if a point is currently being dragged
      const svg = e.currentTarget; // Get the SVG element
      // Convert mouse coordinates from screen space to SVG coordinate space
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        svg.getScreenCTM()?.inverse()
      );

      // Calculate distance from center to mouse position to get the new radius
      const dx = pt.x - center.x;
      const dy = pt.y - center.y;
      const newRadius = Math.sqrt(dx * dx + dy * dy);

      // Determine the angle of the mouse cursor relative to the center.
      // This helps ensure that we're adjusting the radius based on the original vertex angle.
      // (This part of the logic seems to be simplified; typically, you'd adjust the dragged vertex
      // and then reposition others, or directly use newRadius for all points if maintaining regularity).
      // The current implementation re-initializes all points with the new radius if the dragged
      // vertex is the one being pointed at by angle.
      let angle = Math.atan2(dy, dx) + Math.PI / 2; // Adjust angle to match initialization logic
      if (angle < 0) angle += 2 * Math.PI;

      // Find which vertex is closest to the current mouse angle
      const closestIndex = Math.round((angle / (2 * Math.PI)) * n) % n;

      // Only update if the mouse is still aligned with the vertex being dragged
      // This maintains the shape's regularity during drag-resize.
      if (closestIndex === draggingIndex) {
        const newPoints = initializePoints(n, newRadius, isStar);
        setPoints(newPoints);
        onPointsChange(newPoints); // Notify parent about the point changes
      }
    }
  };

  /**
   * Handles mouse up event.
   * Resets dragging state and cursor.
   */
  const handleMouseUp = () => {
    if (draggingIndex !== null) {
      setDraggingIndex(null); // Clear the index of the point being dragged
      document.body.style.cursor = "default"; // Reset cursor
    }
  };

  /**
   * Handles downloading the current SVG content as a PNG image.
   */
  const downloadPNG = () => {
    const svgElement = document.querySelector("#shape-svg"); // Get the SVG DOM element
    if (!svgElement) return;

    // Serialize the SVG element to an XML string
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);

    // Add XML declaration and standalone attribute for proper SVG rendering from string
    svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;

    const image = new Image(); // Create a new Image object
    const canvas = document.createElement("canvas"); // Create a canvas element
    const ctx = canvas.getContext("2d"); // Get canvas 2D rendering context

    const svgBounds = svgElement.getBoundingClientRect(); // Get dimensions of the SVG
    canvas.width = svgBounds.width;   // Set canvas width to SVG width
    canvas.height = svgBounds.height; // Set canvas height to SVG height

    // Create a Blob from the SVG string and generate a URL for it
    const DOMURL = window.URL || window.webkitURL || window;
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = DOMURL.createObjectURL(svgBlob);

    image.onload = () => {
      // Draw the loaded SVG image onto the canvas
      ctx?.drawImage(image, 0, 0);
      DOMURL.revokeObjectURL(url); // Release the object URL

      // Convert canvas content to a PNG data URL
      const pngDataUrl = canvas.toDataURL("image/png");

      // Create a temporary anchor element to trigger download
      const a = document.createElement("a");
      a.href = pngDataUrl;
      a.download = `shape-${n}-${isStar ? 'star' : 'polygon'}.png`; // Set download filename
      document.body.appendChild(a); // Append to body
      a.click(); // Simulate click to trigger download
      document.body.removeChild(a); // Remove from body
    };

    image.onerror = (e) => {
      console.error("Error loading SVG image for PNG conversion:", e);
      DOMURL.revokeObjectURL(url);
    };

    image.src = url; // Set image source to the SVG Blob URL to start loading
  };

  // Effect to re-initialize points when n, radius, or isStar changes
  useEffect(() => {
    const newPoints = initializePoints(n, radius, isStar);
    setPoints(newPoints);
    onPointsChange(newPoints); // Notify parent of point changes
  }, [n, radius, isStar, onPointsChange]); // Dependencies for the effect

  // Calculate angle data for display (memoized if points don't change often, but here calculated on every render)
  const { interiorAngles, exteriorAngles } = calculateAngles();

  // Dynamically generates a reference to an SVG gradient based on the number of sides 'n'.
  const getShapeColor = () => {
    // const baseHue = n * 30; // Example: Can be used if gradient colors are also dynamic based on n
    return `url(#shapeGradient-${n})`; // Returns a string like "url(#shapeGradient-5)"
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        id="shape-svg" // ID used for PNG download
        width="400"
        height="400"
        className="bg-white/50 backdrop-blur-sm rounded-lg shadow-lg relative" // Styling classes
        onMouseMove={handleMouseMove} // Handle mouse move for dragging
        onMouseUp={handleMouseUp}     // Handle mouse up to end dragging
        onMouseLeave={handleMouseUp}  // Also end dragging if mouse leaves SVG area
      >
        {/* SVG definitions for reusable elements like gradients and filters */}
        <defs>
          {/*
            Radial gradient for the shape's fill.
            The ID is dynamic based on 'n' to potentially allow different gradients per shape type,
            though here the HSL values are fixed for the example gradient stops.
            A more dynamic approach might pass 'n' into HSL calculations if desired.
          */}
          <radialGradient
            id={`shapeGradient-${n}`} // Dynamic ID, e.g., "shapeGradient-5"
            cx="50%" // Center x of gradient
            cy="50%" // Center y of gradient
            r="70%"  // Radius of the gradient
            gradientUnits="userSpaceOnUse" // Gradient coordinates relative to the shape bounds
          >
            <stop offset="0%" stopColor={`hsl(${n * 30}, 80%, 65%)`} /> {/* Gradient start color */}
            <stop offset="90%" stopColor={`hsl(${n * 30}, 70%, 45%)`} /> {/* Gradient end color */}
          </radialGradient>

          {/* Filter for creating a glow effect, e.g., when a drag handle is active */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" /> {/* Blur the source graphic */}
            {/* Composite the original graphic over the blurred version */}
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid background pattern */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20" // Defines a single grid cell line (L-shape)
            fill="none"
            stroke="rgba(0,0,0,0.05)" // Light gray grid lines
            strokeWidth="0.5"
          />
        </pattern>
        <rect width="400" height="400" fill="url(#grid)" /> {/* Apply the grid pattern to the background */}

        {/* Center point of the SVG canvas, for visual reference */}
        <circle cx={center.x} cy={center.y} r="3" fill="rgba(0,0,0,0.3)" />

        {/* The main polygon (or star) shape */}
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={getShapeColor()}
          stroke={`hsl(${n * 30}, 70%, 40%)`}
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter={draggingIndex !== null ? "url(#glow)" : ""}
          className="transition-all duration-300"
        />

        {/* Lines from center to vertices, purely visual */}
        {points.map((p, i) => (
          <line
            key={`line-${i}`} // Unique key for React rendering
            x1={center.x}
            y1={center.y}
            x2={p.x}
            y2={p.y}
            stroke="rgba(0,0,0,0.15)" // Light, dashed lines
            strokeWidth="1"
            strokeDasharray="3,3" // Creates a dashed line effect
          />
        ))}

        {/* Draggable handles (circles) at each vertex of the shape */}
        {points.map((p, i) => (
          <circle
            key={`handle-${i}`}
            cx={p.x}
            cy={p.y}
            r={draggingIndex === i ? 8 : hovered === i ? 7 : 6}
            fill={
              draggingIndex === i
                ? `hsl(${n * 30}, 100%, 60%)`
                : hovered === i
                ? `hsl(${n * 30}, 90%, 50%)`
                : `hsl(${n * 30}, 70%, 50%)`
            }
            stroke="white"
            strokeWidth="2"
            style={{
              cursor: draggingIndex === i ? "grabbing" : "grab",
              transition: "r 0.2s, fill 0.2s",
              filter:
                draggingIndex === i || hovered === i
                  ? "drop-shadow(0 0 3px rgba(0,0,0,0.3))"
                  : "",
            }}
            onMouseDown={(e) => handleMouseDown(i, e)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Display of interior angles if showInterior is true */}
        {showInterior &&
          !isStar && // Currently, angles are only shown for regular polygons
          interiorAngles.map((angleData, i) => (
            <g key={`interior-${i}`}>
              {/* Background circle for the angle text for better readability */}
              <circle
                cx={angleData.x}
                cy={angleData.y}
                r="15"
                fill={`hsl(${n * 30}, 70%, 40%)`} // Dynamic color based on 'n'
                opacity="0.9"
              />
              {/* Angle value text */}
              <text
                x={angleData.x}
                y={angleData.y}
                dy="4.5" // Vertical alignment adjustment
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle" // Horizontal alignment
                fill="white"
                style={{ userSelect: "none" }} // Prevent text selection
              >
                {angleData.value}°
              </text>
            </g>
          ))}

        {/* Display of exterior angles if showExterior is true */}
        {showExterior &&
          !isStar && // Currently, angles are only shown for regular polygons
          exteriorAngles.map((angleData, i) => (
            <g key={`exterior-${i}`}>
              {/* Background circle for the angle text */}
              <circle
                cx={angleData.x}
                cy={angleData.y}
                r="15"
                fill="white"
                stroke={`hsl(${n * 30}, 70%, 40%)`} // Border color dynamic with 'n'
                strokeWidth="1.5"
                opacity="0.9"
              />
              {/* Angle value text */}
              <text
                x={angleData.x}
                y={angleData.y}
                dy="4.5"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                fill={`hsl(${n * 30}, 70%, 40%)`} // Text color dynamic with 'n'
                style={{ userSelect: "none" }}
              >
                {angleData.value}°
              </text>
            </g>
          ))}
      </svg>

      {/* Button to trigger PNG download of the SVG */}
      <button
        onClick={downloadPNG}
        className="mt-4 px-4 py-2 rounded-lg shadow-md transform active:scale-95 transition-all duration-150 text-white font-medium flex items-center gap-2"
        style={{ backgroundColor: `hsl(${n * 30}, 70%, 50%)` }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = `hsl(${n * 30}, 70%, 40%)`)
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = `hsl(${n * 30}, 70%, 50%)`)
        }
      >
        {/* Simple download icon */}
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PNG
      </button>

      <div className="mt-2 text-sm text-gray-500">
        <span>Drag any vertex to resize</span>
      </div>
    </div>
  );
};

export default GeometryShapes;
