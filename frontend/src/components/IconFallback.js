// Fallback component for MUI icons in case of styled-engine problems
import React from 'react';

const IconFallback = ({ iconName, ...props }) => {
  // Simple fallback that renders a span with icon name
  return (
    <span 
      className="mui-icon-fallback"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        color: 'inherit',
        ...props.style
      }}
    >
      {iconName || ''}
    </span>
  );
};

export default IconFallback; 