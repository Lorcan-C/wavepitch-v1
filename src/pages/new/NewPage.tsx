import React from 'react';
import { ScenarioSelectionCards } from '../../components/ScenarioSelectionCards';

const NewPage: React.FC = () => {
  const handleScenarioSelect = (scenario: 'pitch' | 'planning' | 'focus') => {
    console.log('Selected scenario:', scenario);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{
        backgroundImage: 'url(/images/pitchflow.webp)'
      }}
    >
      <div className="max-w-4xl w-full mx-auto px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl">
          <ScenarioSelectionCards onSelectScenario={handleScenarioSelect} />
        </div>
      </div>
    </div>
  );
};

export default NewPage;