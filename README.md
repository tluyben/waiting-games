# 🕹️ Waiting Games

Retro games for error pages and waiting screens. Add engaging mini-games to keep users entertained while they wait.

**20 Classic Arcade Games** from the golden age of gaming (1970s-1980s) including Snake, Pong, Pac-Man, Tetris, Space Invaders, Asteroids, and many more!

## 🚀 Quick Start

### Vanilla JavaScript / HTML

```html
<!-- Via CDN -->
<script src="https://unpkg.com/waiting-games@latest/dist/waiting-games.js"></script>

<!-- Or via npm -->
<script>
// npm install waiting-games
import { createGame } from 'waiting-games';
</script>

<div id="game-container"></div>

<script>
  const game = WaitingGames.createGame('snake', '#game-container', {
    useKeyboard: true,
    useMobile: true,
    width: 400,
    height: 300
  });
  
  game.start();
</script>
```

### React

```jsx
import { WaitingGame } from 'waiting-games';

function ErrorPage() {
  return (
    <div>
      <h1>Oops! Something went wrong</h1>
      <p>While we fix this, why not play a game?</p>
      
      <WaitingGame 
        game="snake"
        config={{
          useKeyboard: true,
          useMobile: true,
          width: 400,
          height: 300
        }}
        autoStart={true}
      />
    </div>
  );
}
```

## 🎮 Available Games

### Snake (1970s)
Classic snake game with modern controls.

```javascript
const snake = createGame('snake', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300,
  keys: { UP: 'w', DOWN: 's', LEFT: 'a', RIGHT: 'd' } // Custom keys
});
```

**Controls:** Arrow keys or WASD, Space to restart | Mobile: Tap direction

### Pong (1972) 
The original video game! Two paddles, one ball.

```javascript
const pong = createGame('pong', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** Left paddle: W/S or ↑/↓, Right paddle: I/K | Mobile: Tap sides

### Breakout (1976)
Bounce ball to break colorful bricks.

```javascript
const breakout = createGame('breakout', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D or ←/→ to move paddle, Space to launch | Mobile: Touch to position

### Space Invaders (1978)
Defend Earth from descending alien invaders!

```javascript
const spaceInvaders = createGame('spaceinvaders', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D or ←/→ to move, Space to shoot | Mobile: Tap sides to move, center to fire

### Tetris (1984)
The ultimate falling blocks puzzle game.

```javascript
const tetris = createGame('tetris', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 240,
  height: 420
});
```

**Controls:** A/D or ←/→ to move, W/↑ to rotate, S/↓ soft drop, Space hard drop

### Pac-Man (1980)
Navigate mazes, eat dots, avoid ghosts. The arcade legend!

```javascript
const pacman = createGame('pacman', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 392,
  height: 308
});
```

**Controls:** Arrow keys or WASD to move | Mobile: Tap direction to move

### Asteroids (1979)
Rotate, thrust, and shoot space rocks in zero gravity.

```javascript
const asteroids = createGame('asteroids', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D or ←/→ to rotate, W/↑ to thrust, Space to shoot | Mobile: Tap sides to rotate

### Frogger (1981)
Cross busy roads and rivers safely to reach lily pads.

```javascript
const frogger = createGame('frogger', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 416,
  height: 448
});
```

**Controls:** Arrow keys or WASD to hop | Mobile: Tap direction to move

### Donkey Kong (1981)
Help Mario climb ladders and avoid barrels to rescue Pauline!

```javascript
const donkeyKong = createGame('donkeykong', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D or ←/→ to move, W/↑ to jump/climb | Mobile: Tap to move and jump

### Q*bert (1982)
Hop on cubes to change their colors while avoiding enemies.

```javascript
const qbert = createGame('qbert', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** Arrow keys or WASD to hop diagonally | Mobile: Tap to hop in direction

### Kaboom! (1981)
Catch falling bombs with your bucket before they explode!

```javascript
const kaboom = createGame('kaboom', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 500
});
```

**Controls:** A/D or ←/→ to move bucket | Mobile: Touch to position bucket

### Adventure (1979)
Explore rooms, find the key and sword, slay the dragon, get the chalice!

```javascript
const adventure = createGame('adventure', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** Arrow keys or WASD to move, Space to attack | Mobile: Tap to move and attack

### Missile Command (1980)
Defend your cities by intercepting incoming missiles!

```javascript
const missileCommand = createGame('missilecommand', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 500,
  height: 400
});
```

**Controls:** WASD to move crosshair, Space to fire | Mobile: Touch to aim and fire

### Joust (1982)
Flying ostrich combat with realistic physics!

```javascript
const joust = createGame('joust', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D to fly left/right, W to flap wings | Mobile: Tap sides to move, tap to flap

### Lunar Lander (1979)
Land your spacecraft safely on the moon surface!

```javascript
const lunarLander = createGame('lunarlander', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D to rotate, W to thrust | Mobile: Tap sides to rotate, top to thrust

### Battlezone (1980)
3D tank combat in wireframe vector graphics!

```javascript
const battlezone = createGame('battlezone', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D to turn, W/S to move, Space to fire | Mobile: Touch controls

### Berzerk (1980)
Navigate robot-filled mazes and survive Evil Otto!

```javascript
const berzerk = createGame('berzerk', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** WASD to move, Space to fire | Mobile: Tap to move and shoot

### Circus Atari (1977)
Bounce clowns to pop balloons in this physics game!

```javascript
const circusAtari = createGame('circusatari', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** A/D to move seesaw | Mobile: Touch to position seesaw

### Elevator Action (1983)
Spy infiltration with elevators and secret documents!

```javascript
const elevatorAction = createGame('elevatoraction', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 400,
  height: 300
});
```

**Controls:** WASD to move, Space to fire/enter elevators | Mobile: Touch controls

### Dig Dug (1982)
Dig tunnels underground and inflate enemies!

```javascript
const digDug = createGame('digdug', '#container', {
  useKeyboard: true,
  useMobile: true,
  width: 512,
  height: 384
});
```

**Controls:** WASD to move/dig, Space to pump (hold to inflate) | Mobile: Tap to move, hold to pump

## ⚙️ Configuration Options

```typescript
interface GameConfig {
  useKeyboard?: boolean;  // Enable keyboard controls (default: true)
  useMobile?: boolean;    // Enable mobile touch controls (default: false)
  width?: number;         // Game canvas width (default: 400)
  height?: number;        // Game canvas height (default: 300)
  theme?: 'classic' | 'neon' | 'retro';  // Visual theme (default: 'classic')
  keys?: KeyMapping;      // Custom key mappings (optional)
}

interface KeyMapping {
  UP?: string;      // Default: 'ArrowUp'
  DOWN?: string;    // Default: 'ArrowDown'  
  LEFT?: string;    // Default: 'ArrowLeft'
  RIGHT?: string;   // Default: 'ArrowRight'
  FIRE?: string;    // Default: ' ' (Space)
  PAUSE?: string;   // Default: 'p'
  START?: string;   // Default: 'Enter'
}
```

### Custom Key Mapping

You can customize keyboard controls for any game:

```javascript
const game = createGame('snake', '#container', {
  useKeyboard: true,
  keys: {
    UP: 'w',           // Use W instead of arrow up
    DOWN: 's',         // Use S instead of arrow down
    LEFT: 'a',         // Use A instead of arrow left
    RIGHT: 'd',        // Use D instead of arrow right
    FIRE: 'f',         // Use F instead of space (for shooting games)
    PAUSE: 'p',        // Use P to pause
    START: 'Enter'     // Use Enter to start/restart
  }
});
```

**Note:** Games still support default WASD keys alongside custom mappings.

## 🎯 API Reference

### createGame(type, container, config)

Creates a new game instance.

- `type`: Game type ('snake' | 'pong' | 'breakout' | 'spaceinvaders' | 'tetris' | 'pacman' | 'asteroids' | 'frogger' | 'donkeykong' | 'qbert' | 'kaboom' | 'adventure' | 'missilecommand' | 'joust' | 'lunarlander' | 'battlezone' | 'berzerk' | 'circusatari' | 'elevatoraction' | 'digdug')
- `container`: HTML element or selector string
- `config`: Configuration options

Returns a game instance with methods:
- `start()`: Start the game
- `stop()`: Stop the game
- `pause()`: Pause the game
- `resume()`: Resume the game
- `destroy()`: Clean up and remove the game

### React Component

```jsx
<WaitingGame 
  game="pacman"             // Required: 'snake' | 'pong' | 'breakout' | 'spaceinvaders' | 'tetris' | 'pacman' | 'asteroids' | 'frogger' | 'donkeykong' | 'qbert' | 'kaboom' | 'adventure' | 'missilecommand' | 'joust' | 'lunarlander' | 'battlezone' | 'berzerk' | 'circusatari' | 'elevatoraction' | 'digdug'
  config={{
    useKeyboard: true,
    useMobile: true,
    keys: { UP: 'w', DOWN: 's', LEFT: 'a', RIGHT: 'd' }
  }}                        // Optional: game configuration
  autoStart={true}          // Optional: auto-start game (default: true)
  className="my-game"       // Optional: CSS class
  style={{}}                // Optional: inline styles
/>
```

## 📱 Mobile Support

When `useMobile: true` is enabled:

- **Snake**: Tap in the direction you want the snake to move
- **Pong**: Tap left/right side of screen to move respective paddle
- **Breakout**: Touch to position paddle, tap to launch ball
- **Space Invaders**: Tap left/right to move, center to shoot
- **Tetris**: Tap sides to move, center to rotate, bottom to hard drop
- **Pac-Man**: Tap in direction you want to move
- **Asteroids**: Tap sides to rotate, top to thrust, bottom to shoot
- **Frogger**: Tap direction to hop
- **Donkey Kong**: Tap to move and jump
- **Q*bert**: Tap to hop in direction
- **Kaboom!**: Touch to position bucket
- **Adventure**: Tap to move and attack
- **Missile Command**: Touch to aim crosshair and fire
- **Joust**: Tap sides to move, tap to flap wings
- **Lunar Lander**: Tap sides to rotate, top to thrust
- **Battlezone**: Touch controls for tank movement and firing
- **Berzerk**: Tap to move and shoot
- **Circus Atari**: Touch to position seesaw
- **Elevator Action**: Touch controls for movement and actions
- **Dig Dug**: Tap to move/dig, hold to pump
- Touch controls work alongside keyboard controls
- Prevents default touch behaviors to avoid scrolling while playing

## 🎨 Themes

### Classic (default)
- Black background
- Green snake, red food
- White text

### Neon (coming soon)
- Dark background with neon colors
- Glowing effects

### Retro (coming soon)
- Pixel-perfect styling
- 8-bit color palette

## 🛠️ Installation

```bash
npm install waiting-games
```

Or use via CDN:
```html
<script src="https://unpkg.com/waiting-games@latest/dist/waiting-games.js"></script>
```

## 📦 Bundle Size

- Core library: ~25KB minified (all 20 games included)
- Individual games: ~2-5KB each when tree-shaken
- Tree-shakeable when using ES modules
- Zero external dependencies

## 🔧 Development

```bash
git clone https://github.com/yourusername/waiting-games.git
cd waiting-games
npm install
npm run dev    # Development with hot reload
npm run build  # Build for production
npm test       # Run tests
```

## 🎮 Features

- **20 Classic Games**: Complete collection of retro arcade games from 1970s-1980s
- **Modern Controls**: Keyboard and mobile touch support for all games
- **Custom Key Mapping**: Remap any control to your preference
- **React Integration**: Ready-to-use React components
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Zero Dependencies**: Lightweight and self-contained
- **TypeScript Support**: Full type definitions included
- **Tree Shakeable**: Import only the games you need

## 🚀 Roadmap

- More visual themes (neon, retro)
- Sound effects and music
- High score persistence
- Multiplayer modes
- Additional classic games

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

## 🐛 Issues

Found a bug or have a feature request? [Open an issue](https://github.com/yourusername/waiting-games/issues).

---

Made with ❤️ for better user experiences during waiting times.