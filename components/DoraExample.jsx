import React from 'react';
import Dora from './Dora.jsx';

/**
 * Voorbeeld implementatie van de Dora component
 * Dit toont hoe de component gebruikt kan worden
 */
const DoraExample = () => {
  const handleDoraClick = () => {
    console.log('Dora clicked - ready for 3D interactions!');
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5' }}>
      <h2>Dora Component - 3D Specialist</h2>
      <p>Klik op Dora om interactie te starten:</p>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Standaard Dora */}
        <Dora onClick={handleDoraClick} />
        
        {/* Dora met custom aria-label */}
        <Dora 
          onClick={handleDoraClick}
          ariaLabel="Dora 3D-specialist, klik voor 3D functies"
        />
        
        {/* Dora met custom styling */}
        <Dora 
          onClick={handleDoraClick}
          className="custom-dora"
          style={{ margin: '10px' }}
        />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Toegankelijkheid Features:</h3>
        <ul>
          <li>✅ Toetsenbord navigatie (Tab)</li>
          <li>✅ Enter/Spatie activatie</li>
          <li>✅ ARIA labels voor screen readers</li>
          <li>✅ Focus styling voor duidelijke navigatie</li>
          <li>✅ High contrast ondersteuning</li>
          <li>✅ Reduced motion ondersteuning</li>
          <li>✅ Responsief design</li>
        </ul>
      </div>
    </div>
  );
};

export default DoraExample;