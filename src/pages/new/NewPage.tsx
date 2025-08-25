import React, { useState } from 'react';
import { ScenarioSelectionCards } from '../../components/ScenarioSelectionCards';
import { ScenarioInput } from '../../components/ScenarioInput';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';

type ScenarioType = 'pitch' | 'planning' | 'focus';

const NewPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);

  const handleScenarioSelect = (scenario: ScenarioType) => {
    console.log('Selected scenario:', scenario);
    setSelectedScenario(scenario);
  };

  const handleBack = () => {
    setSelectedScenario(null);
  };

  // If a scenario is selected, show the ScenarioInput component
  if (selectedScenario) {
    return (
      <ScenarioInput 
        scenarioType={selectedScenario} 
        onBack={handleBack} 
      />
    );
  }

  // Otherwise show the scenario selection
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/images/pitchflow_v2.webp)'
      }}
    >
      {/* Logo */}
      <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-20">
        <img 
          src="/images/onboardinglogo_4.png" 
          alt="Logo" 
          className="h-16 md:h-24 w-auto"
        />
      </div>
      <ResponsiveContainer size="lg" className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl">
        <ScenarioSelectionCards onSelectScenario={handleScenarioSelect} />
      </ResponsiveContainer>
    </div>
  );
};

export default NewPage;