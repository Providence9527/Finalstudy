
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.css'
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './styles/main.css';
import { ClickToComponent } from 'click-to-react-component';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClickToComponent />
    <App />
  </React.StrictMode>
)