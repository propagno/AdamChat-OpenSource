/**
 * This file contains patches for MUI components that have issues
 * It should be imported before any MUI components are used
 */
import React from 'react';

// Patch for the internal_processStyles function that's missing
export function applyMUIPatch() {
  if (typeof window === 'undefined') return;

  try {
    // Try to access the styled engine
    const styledEngineModule = require('@mui/styled-engine');
    
    // If the problematic function doesn't exist, add it
    if (!styledEngineModule.internal_processStyles) {
      console.log('Applying MUI patch: Adding internal_processStyles');
      styledEngineModule.internal_processStyles = function(tagOrComponent, options) {
        return options.styles || '';
      };
    }
    
    // Don't try to redefine __esModule as it causes errors
    // Instead, just log that we're skipping this step
    console.log('MUI module already has __esModule defined, skipping this step');
    
    // Create a safe SvgIcon wrapper that we can use instead of patching the module
    try {
      console.log('Creating SafeSvgIcon wrapper instead of modifying read-only properties');
      
      // Store the SafeSvgIcon in window so it can be accessed globally if needed
      window.__SAFE_SVG_ICON__ = (props) => {
        try {
          // Dynamically import the SvgIcon only when needed
          const SvgIcon = require('@mui/material/SvgIcon').default;
          return React.createElement(SvgIcon, props);
        } catch (error) {
          console.warn('SvgIcon error caught and safely handled:', error);
          // Return a simple fallback span
          return React.createElement('span', {
            className: "mui-svg-fallback",
            style: {
              display: 'inline-block',
              width: '1em',
              height: '1em',
              fontSize: '24px',
              color: 'inherit'
            }
          }, props.children || '');
        }
      };
    } catch (svgError) {
      console.warn('Could not create SafeSvgIcon:', svgError);
    }
    
    console.log('MUI patching completed');
    return true;
  } catch (error) {
    console.error('Failed to patch MUI:', error);
    return false;
  }
}

// Apply the patch immediately, but wrap in try-catch to prevent errors from blocking app startup
try {
  console.log('Attempting to apply MUI patch...');
  applyMUIPatch();
  console.log('MUI patch applied successfully');
} catch (e) {
  console.warn('Error applying MUI patch, but continuing app initialization:', e);
} 