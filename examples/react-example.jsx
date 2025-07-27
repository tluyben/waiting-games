import React, { useState } from 'react';
import { WaitingGame } from 'waiting-games';

// Example 1: Simple error page with auto-starting game
export function ErrorPage() {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚧 Oops! Something went wrong</h1>
      <p>Our team has been notified and is working on a fix.</p>
      <p>While you wait, enjoy a quick game of Snake!</p>
      
      <WaitingGame 
        game="snake"
        config={{
          useKeyboard: true,
          useMobile: true,
          width: 400,
          height: 300
        }}
        autoStart={true}
        style={{ 
          margin: '20px auto',
          border: '2px solid #ddd',
          borderRadius: '8px',
          display: 'inline-block'
        }}
      />
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>Controls:</strong> Arrow keys or WASD (desktop) | Tap to move (mobile)</p>
      </div>
    </div>
  );
}

// Example 2: Loading page with manual controls
export function LoadingPage() {
  const [gameConfig, setGameConfig] = useState({
    useKeyboard: true,
    useMobile: true,
    width: 400,
    height: 300,
    theme: 'classic'
  });

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>⏳ Loading Your Data...</h1>
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        margin: '20px auto',
        maxWidth: '600px'
      }}>
        <p>This might take a minute. Want to play while you wait?</p>
        
        <div style={{ margin: '20px 0' }}>
          <label style={{ marginRight: '20px' }}>
            <input 
              type="checkbox" 
              checked={gameConfig.useKeyboard}
              onChange={(e) => setGameConfig({
                ...gameConfig, 
                useKeyboard: e.target.checked
              })}
            />
            Keyboard Controls
          </label>
          
          <label>
            <input 
              type="checkbox" 
              checked={gameConfig.useMobile}
              onChange={(e) => setGameConfig({
                ...gameConfig, 
                useMobile: e.target.checked
              })}
            />
            Touch Controls
          </label>
        </div>
        
        <WaitingGame 
          game="snake"
          config={gameConfig}
          autoStart={false}  // Manual start with controls
          style={{ 
            margin: '20px auto',
            border: '2px solid #007bff',
            borderRadius: '8px',
            display: 'inline-block'
          }}
        />
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#007bff',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '20px'
      }}>
        Loading... 45%
      </div>
    </div>
  );
}

// Example 3: 404 page with multiple game options (when more games are added)
export function NotFoundPage() {
  const [selectedGame, setSelectedGame] = useState('snake');
  
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '4em', margin: '20px 0' }}>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '15px',
        margin: '40px auto',
        maxWidth: '500px',
        backdropFilter: 'blur(10px)'
      }}>
        <h3>Play a Game While You're Here!</h3>
        
        {/* Game selector (for when more games are available) */}
        <div style={{ margin: '20px 0' }}>
          <select 
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: 'none',
              marginBottom: '20px'
            }}
          >
            <option value="snake">Snake</option>
            {/* <option value="pong">Pong (Coming Soon)</option> */}
            {/* <option value="tetris">Tetris (Coming Soon)</option> */}
          </select>
        </div>
        
        <WaitingGame 
          game={selectedGame}
          config={{
            useKeyboard: true,
            useMobile: true,
            width: 350,
            height: 250
          }}
          autoStart={true}
          style={{ 
            margin: '20px auto',
            borderRadius: '8px',
            display: 'inline-block',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}
        />
      </div>
      
      <button 
        onClick={() => window.history.back()}
        style={{
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: '2px solid white',
          padding: '12px 24px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '20px'
        }}
      >
        ← Go Back
      </button>
    </div>
  );
}

// Usage examples:
export default function App() {
  const [currentPage, setCurrentPage] = useState('error');
  
  const pages = {
    error: <ErrorPage />,
    loading: <LoadingPage />,
    notfound: <NotFoundPage />
  };
  
  return (
    <div>
      {/* Navigation for demo purposes */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <select 
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
        >
          <option value="error">Error Page</option>
          <option value="loading">Loading Page</option>
          <option value="notfound">404 Page</option>
        </select>
      </div>
      
      {pages[currentPage]}
    </div>
  );
}