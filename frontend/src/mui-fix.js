// Workaround for MUI styled-engine error
// This file patches the missing internal_processStyles function

import { styled } from '@mui/material/styles';

// Add the missing function to the styled engine if it doesn't exist
if (typeof window !== 'undefined') {
  const styledEngine = require('@mui/styled-engine');
  
  if (!styledEngine.internal_processStyles) {
    styledEngine.internal_processStyles = function(tag, options, theme) {
      // Simple passthrough implementation
      return options.styles;
    };
  }
}

export default styled; 