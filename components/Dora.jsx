import React from 'react';
import styles from './Dora.module.css';

/**
 * Dora Component - 3D-specialist character
 * Voorbereid voor integratie met Figma-ontwerpen
 * Volledig toegankelijk volgens WCAG richtlijnen
 */
const Dora = ({ 
  className = '', 
  tabIndex = 0, 
  ariaLabel = 'Dora, 3D-specialist character',
  onClick,
  ...props 
}) => {
  return (
    <div
      className={`${styles.dora} ${className}`}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      role="img"
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      {...props}
    >
      <div className={styles.doraContainer}>
        <div className={styles.doraPlaceholder}>
          {/* Placeholder voor Figma/SVG/3D illustratie */}
          <div className={styles.placeholderIcon}>
            <span className={styles.placeholderText}>3D</span>
          </div>
        </div>
        <div className={styles.doraLabel}>
          <span className={styles.labelText}>Dora</span>
          <span className={styles.labelSubtext}>3D-specialist</span>
        </div>
      </div>
    </div>
  );
};

export default Dora;