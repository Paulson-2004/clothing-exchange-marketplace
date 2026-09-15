// Entry point for the React application.
// This file is loaded by index.html via <script type="module">.
// It finds the empty <div id="root"> in the HTML shell and mounts the
// entire React component tree into it. StrictMode activates extra
// development-only checks (e.g. detecting side-effect problems).
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
