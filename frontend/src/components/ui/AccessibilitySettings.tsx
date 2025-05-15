import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';

interface AccessibilitySettingsProps {
  className?: string;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ className = '' }) => {
  const { reducedMotion, toggleReducedMotion, highContrast, toggleHighContrast } = useAccessibility();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-bold text-primary-800 mb-4">Accessibility Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Reduced Motion</h3>
            <p className="text-sm text-gray-600">Minimize animations and transitions</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={reducedMotion} 
              onChange={toggleReducedMotion}
              className="sr-only peer"
              aria-label="Toggle reduced motion"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">High Contrast</h3>
            <p className="text-sm text-gray-600">Increase color contrast for better visibility</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={highContrast} 
              onChange={toggleHighContrast}
              className="sr-only peer"
              aria-label="Toggle high contrast"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>These settings will be saved for your next visit.</p>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
