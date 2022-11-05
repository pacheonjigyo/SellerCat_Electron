import App from './App';
import React from 'react';

import { render } from 'react-dom';
import { AppContext, stores } from "../AppContext";

render(
    <AppContext.Provider value={stores}>
      <App />
    </AppContext.Provider>, 
    
    document.getElementById('root')
);
