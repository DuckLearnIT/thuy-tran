import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Preorder from './components/Preorder'
import Rules from './components/Rules'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {new URLSearchParams(window.location.search).get('page') === 'dat-truoc' ? <Preorder />
      : new URLSearchParams(window.location.search).get('page') === 'cach-choi' ? <Rules /> : <App />}
  </React.StrictMode>,
)
