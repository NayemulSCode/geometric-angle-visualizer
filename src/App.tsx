// src/App.tsx
import React, { useState, useEffect } from "react";
import GeometryShapes from "./components/GeometryShapes";
import Geometry3DViewer from "./components/Geometry3DView";

const App: React.FC = () => {
  const [n, setN] = useState<number>(5);
  const [radius, setRadius] = useState<number>(100);
  const [showInterior, setShowInterior] = useState<boolean>(true);
  const [showExterior, setShowExterior] = useState<boolean>(true);
  const [bgHue, setBgHue] = useState<number>(0);
  const [animate, setAnimate] = useState<boolean>(true);
  const [isStar, setIsStar] = useState<boolean>(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  // Background animation (for color change)
  useEffect(() => {
    let frameId: number;

    const animateFrame = () => {
      setBgHue((prev) => (prev + 0.5) % 360);
      frameId = requestAnimationFrame(animateFrame);
    };

    if (animate) {
      frameId = requestAnimationFrame(animateFrame);
    }

    return () => cancelAnimationFrame(frameId);
  }, [animate]);

  const reset = () => {
    setN(5);
    setRadius(100);
    setShowInterior(true);
    setShowExterior(true);
    setIsStar(false);
  };

  const handlePointsChange = (newPoints: { x: number; y: number }[]) => {
    setPoints(newPoints);
  };

  // Calculate complementary color for buttons based on background
  const buttonHue = (bgHue + 180) % 360;

  return (
    <div
      className="flex flex-col min-h-screen transition-colors duration-1000 p-4 md:p-8"
      style={{ backgroundColor: `hsl(${bgHue}, 70%, 95%)` }}
    >
      {/* Header */}
      <header className="text-center mb-6">
        <h1
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ color: `hsl(${bgHue}, 70%, 25%)` }}
        >
          Geometry Explorer
        </h1>
        <p
          className="text-lg opacity-75"
          style={{ color: `hsl(${bgHue}, 60%, 30%)` }}
        >
          Interactive 2D and 3D geometry visualization
        </p>
      </header>

      {/* Controls Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 mx-auto w-full max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 mb-6">
          {/* Checkbox Controls */}
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showInterior}
                onChange={() => setShowInterior(!showInterior)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 bg-gray-200 rounded-full shadow-inner transition-colors duration-300 ${
                  showInterior ? `bg-[hsl(${buttonHue},70%,50%)]` : ""
                }`}
              ></div>
              <div
                className={`absolute w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  showInterior ? "translate-x-5" : "translate-x-1"
                } top-0.5`}
              ></div>
            </div>
            <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors">
              Interior Angles
            </span>
          </label>

          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showExterior}
                onChange={() => setShowExterior(!showExterior)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 bg-gray-200 rounded-full shadow-inner transition-colors duration-300 ${
                  showExterior ? `bg-[hsl(${buttonHue},70%,50%)]` : ""
                }`}
              ></div>
              <div
                className={`absolute w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  showExterior ? "translate-x-5" : "translate-x-1"
                } top-0.5`}
              ></div>
            </div>
            <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors">
              Exterior Angles
            </span>
          </label>

          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isStar}
                onChange={() => setIsStar(!isStar)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 bg-gray-200 rounded-full shadow-inner transition-colors duration-300 ${
                  isStar ? `bg-[hsl(${buttonHue},70%,50%)]` : ""
                }`}
              ></div>
              <div
                className={`absolute w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  isStar ? "translate-x-5" : "translate-x-1"
                } top-0.5`}
              ></div>
            </div>
            <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors">
              Star Shape
            </span>
          </label>
        </div>

        {/* Sliders */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            <span>Number of Sides: </span>
            <span
              className="text-xl font-bold"
              style={{ color: `hsl(${bgHue}, 70%, 40%)` }}
            >
              {n}
            </span>
          </label>
          <input
            type="range"
            min="3"
            max="12"
            value={n}
            onChange={(e) => setN(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[hsl(var(--btn-hue),70%,50%)]"
            style={{ "--btn-hue": buttonHue } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3</span>
            <span>12</span>
          </div>
        </div>

        {/* Animation Toggle */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={animate}
                onChange={() => setAnimate(!animate)}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 bg-gray-200 rounded-full shadow-inner transition-colors duration-300 ${
                  animate ? `bg-[hsl(${buttonHue},70%,50%)]` : ""
                }`}
              ></div>
              <div
                className={`absolute w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  animate ? "translate-x-5" : "translate-x-1"
                } top-0.5`}
              ></div>
            </div>
            <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors">
              Animate Background
            </span>
          </label>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg shadow-md transform active:scale-95 transition-all duration-150 font-medium text-white"
            style={{ backgroundColor: `hsl(${buttonHue}, 70%, 50%)` }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = `hsl(${buttonHue}, 70%, 40%)`)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = `hsl(${buttonHue}, 70%, 50%)`)
            }
          >
            Reset Settings
          </button>
        </div>
      </div>

      {/* Side by Side Views */}
      <div className="flex flex-col lg:flex-row gap-8 justify-center w-full mb-8">
        {/* 2D View Card */}
        <div
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 flex flex-col items-center w-full lg:w-auto transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
          style={{
            boxShadow: `0 10px 25px -5px hsla(${bgHue}, 70%, 40%, 0.3)`,
          }}
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: `hsl(${bgHue}, 70%, 40%)` }}
          >
            2D View
          </h2>
          <GeometryShapes
            n={n}
            radius={radius}
            showInterior={showInterior}
            showExterior={showExterior}
            isStar={isStar}
            onPointsChange={handlePointsChange}
          />
        </div>

        {/* 3D View Card */}
        <div
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 flex flex-col items-center w-full lg:w-auto transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
          style={{
            boxShadow: `0 10px 25px -5px hsla(${bgHue}, 70%, 40%, 0.3)`,
          }}
        >
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: `hsl(${bgHue}, 70%, 40%)` }}
          >
            3D View
          </h2>
          <Geometry3DViewer sides={n} radius={radius} />
        </div>
      </div>

      {/* Shape Info Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 mx-auto w-full max-w-3xl">
        <h2
          className="text-xl font-bold mb-3"
          style={{ color: `hsl(${bgHue}, 70%, 40%)` }}
        >
          {isStar ? "Star" : "Regular Polygon"} Properties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
            <p className="text-gray-700">
              <span className="font-medium">Shape:</span>{" "}
              {isStar ? `${n}-pointed Star` : `${n}-sided Polygon`}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Interior Angle:</span>{" "}
              {isStar ? "Variable" : `${(((n - 2) * 180) / n).toFixed(1)}°`}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Exterior Angle:</span>{" "}
              {`${(360 / n).toFixed(1)}°`}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
            <p className="text-gray-700">
              <span className="font-medium">Sum of Interior Angles:</span>{" "}
              {isStar ? "Variable" : `${(n - 2) * 180}°`}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Sum of Exterior Angles:</span> 360°
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center py-4">
        <p
          className="text-sm opacity-70"
          style={{ color: `hsl(${bgHue}, 50%, 30%)` }}
        >
          Interactive Geometry Explorer © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
