"use client"

import React from 'react';
import Aurora from '@/components/ui/aurora';

const AuroraBackground: React.FC = () => {
  return (
    <div className="aurora-background">
      {/* Aurora WebGL Background */}
      <Aurora
        colorStops={["#7CFF67", "#B19EEF", "#5227FF"]}
        blend={0.6}
        amplitude={0.8}
        speed={0.7}
      />
    </div>
  );
};

export default AuroraBackground;
