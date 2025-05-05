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
  const [hovered, setHovered] = useState<number | null>(null);
  const center = { x: 200, y: 200 };

  const initializePoints = (n: number, radius: number, isStar: boolean) => {
    const cx = 200;
    const cy = 200;
    const newPoints = [];

    if (!isStar) {
      for (let i = 0; i < n; i++) {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        newPoints.push({ x, y });
      }
    } else {
      const spikes = n;
      const outerRadius = radius;
      const innerRadius = radius / 2;

      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        newPoints.push({ x, y });
      }
    }

    return newPoints;
  };

  const calculateAngles = () => {
    if (points.length === 0) return { interiorAngles: [], exteriorAngles: [] };

    const interiorAngle = (((n - 2) * 180) / n).toFixed(1);
    const exteriorAngle = (360 / n).toFixed(1);

    const interiorAngles = [];
    const exteriorAngles = [];

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      if (!p1 || !p2) continue;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const angleDir = Math.atan2(p1.y - center.y, p1.x - center.x);

      const interiorOffset = 25;
      const exteriorOffset = 45;

      const interiorX = midX + Math.cos(angleDir) * interiorOffset;
      const interiorY = midY + Math.sin(angleDir) * interiorOffset;

      const exteriorX = midX - Math.cos(angleDir) * exteriorOffset;
      const exteriorY = midY - Math.sin(angleDir) * exteriorOffset;

      interiorAngles.push({ x: interiorX, y: interiorY, value: interiorAngle });
      exteriorAngles.push({ x: exteriorX, y: exteriorY, value: exteriorAngle });
    }

    return { interiorAngles, exteriorAngles };
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
    // Add focus/active styles to the dragged point
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (draggingIndex !== null) {
      const svg = e.currentTarget;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        svg.getScreenCTM()?.inverse()
      );

      const dx = pt.x - center.x;
      const dy = pt.y - center.y;
      const newRadius = Math.sqrt(dx * dx + dy * dy);

      const angleStep = (2 * Math.PI) / n;
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;

      const closestIndex = Math.round((angle / (2 * Math.PI)) * n) % n;

      if (closestIndex === draggingIndex) {
        const newPoints = initializePoints(n, newRadius, isStar);
        setPoints(newPoints);
        onPointsChange(newPoints);
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingIndex !== null) {
      setDraggingIndex(null);
      document.body.style.cursor = "default";
    }
  };

  const downloadPNG = () => {
    const svg = document.querySelector("#shape-svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const image = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgSize = svg.getBoundingClientRect();

    canvas.width = svgSize.width;
    canvas.height = svgSize.height;

    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(
      new Blob([source], { type: "image/svg+xml" })
    );

    image.onload = () => {
      ctx?.drawImage(image, 0, 0);
      DOMURL.revokeObjectURL(url);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `shape-${n}-sides.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    image.src = url;
  };

  useEffect(() => {
    const newPoints = initializePoints(n, radius, isStar);
    setPoints(newPoints);
    onPointsChange(newPoints);
  }, [n, radius, isStar, onPointsChange]);

  const { interiorAngles, exteriorAngles } = calculateAngles();

  // Generate a gradient color based on the number of sides
  const getShapeColor = () => {
    const baseHue = n * 30;
    return `url(#shapeGradient-${n})`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        id="shape-svg"
        width="400"
        height="400"
        className="bg-white/50 backdrop-blur-sm rounded-lg shadow-lg relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Define gradients for different shapes */}
        <defs>
          <radialGradient
            id={`shapeGradient-${n}`}
            cx="50%"
            cy="50%"
            r="70%"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={`hsl(${n * 30}, 80%, 65%)`} />
            <stop offset="90%" stopColor={`hsl(${n * 30}, 70%, 45%)`} />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid background */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="0.5"
          />
        </pattern>
        <rect width="400" height="400" fill="url(#grid)" />

        {/* Center point */}
        <circle cx={center.x} cy={center.y} r="3" fill="rgba(0,0,0,0.3)" />

        {/* Polygon */}
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill={getShapeColor()}
          stroke={`hsl(${n * 30}, 70%, 40%)`}
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter={draggingIndex !== null ? "url(#glow)" : ""}
          className="transition-all duration-300"
        />

        {/* Lines from center to vertices */}
        {points.map((p, i) => (
          <line
            key={`line-${i}`}
            x1={center.x}
            y1={center.y}
            x2={p.x}
            y2={p.y}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        {/* Drag handles */}
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

        {/* Interior angles */}
        {showInterior &&
          interiorAngles.map((a, i) => (
            <g key={`interior-${i}`}>
              <circle
                cx={a.x}
                cy={a.y}
                r="14"
                fill={`hsl(${n * 30}, 70%, 40%)`}
                opacity="0.9"
              />
              <text
                x={a.x}
                y={a.y}
                dy="4" // Center text vertically
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
                style={{ userSelect: "none" }}
              >
                {a.value}°
              </text>
            </g>
          ))}

        {/* Exterior angles */}
        {showExterior &&
          exteriorAngles.map((a, i) => (
            <g key={`exterior-${i}`}>
              <circle
                cx={a.x}
                cy={a.y}
                r="14"
                fill="white"
                stroke={`hsl(${n * 30}, 70%, 40%)`}
                strokeWidth="1.5"
                opacity="0.9"
              />
              <text
                x={a.x}
                y={a.y}
                dy="4" // Center text vertically
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fill={`hsl(${n * 30}, 70%, 40%)`}
                style={{ userSelect: "none" }}
              >
                {a.value}°
              </text>
            </g>
          ))}
      </svg>

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
