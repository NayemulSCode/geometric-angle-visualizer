import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Help & Information</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl"
            aria-label="Close help modal"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-gray-700">
          <p className="text-lg">
            Welcome to the Interactive Geometry Explorer! This tool helps you learn about shapes and angles in a fun way.
          </p>

          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">How to Use the Controls</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Number of Sides:</strong> Use the slider to change how many sides your shape has.</li>
              <li><strong>Interior/Exterior Angles:</strong> Check these boxes to see the angles inside and outside the shape.</li>
              <li><strong>Star Shape:</strong> Turn this on to make a star!</li>
              <li><strong>Animate Background:</strong> Toggle the colorful background animation.</li>
              <li><strong>Reset Settings:</strong> Click this to go back to the starting shapes and settings.</li>
              <li><strong>2D View:</strong> Drag the points on the shape to change its size. You can also download a picture (PNG) of your 2D shape!</li>
              <li><strong>3D View:</strong> Click and drag the 3D shape to spin it around. Use your mouse scroll to zoom in and out. You can also download your 3D shape as a GLB or OBJ file.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Understanding Shapes & Angles</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Polygon:</strong> A flat shape with straight sides. Examples: triangles (3 sides), squares (4 sides), pentagons (5 sides).</li>
              <li><strong>Star:</strong> A pointy shape made by connecting vertices of a polygon.</li>
              <li><strong>Interior Angle:</strong> An angle inside the shape at one of its corners.</li>
              <li><strong>Exterior Angle:</strong> An angle outside the shape, formed by one side and extending the next side.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Formulas</h3>
            <p>
              You'll see math formulas for the angles and their sums. These are the rules that tell us how to calculate them!
            </p>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
