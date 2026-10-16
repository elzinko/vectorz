import React from 'react';
import ReactDOM from 'react-dom/client';
import Board from './board/Board';
import './board/board.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Board />
  </React.StrictMode>,
);
