(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WaitingGames = {}, global.React));
})(this, (function (exports, React) { 'use strict';

    class GameEngine {
        constructor(container, config = {}) {
            this.animationId = null;
            this.isRunning = false;
            this.isPaused = false;
            const element = typeof container === 'string'
                ? document.querySelector(container)
                : container;
            if (!element) {
                throw new Error('Container element not found');
            }
            this.config = {
                useKeyboard: true,
                useMobile: false,
                width: 400,
                height: 300,
                theme: 'classic',
                keys: {},
                ...config
            };
            this.keyMap = {
                UP: 'ArrowUp',
                DOWN: 'ArrowDown',
                LEFT: 'ArrowLeft',
                RIGHT: 'ArrowRight',
                FIRE: ' ',
                PAUSE: 'p',
                START: 'Enter',
                ...this.config.keys
            };
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.config.width;
            this.canvas.height = this.config.height;
            this.canvas.style.border = '2px solid #333';
            this.canvas.style.backgroundColor = '#000';
            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get 2D context');
            }
            this.ctx = ctx;
            element.appendChild(this.canvas);
            this.setupControls();
        }
        setupControls() {
            if (this.config.useKeyboard) {
                document.addEventListener('keydown', this.handleKeyDown.bind(this));
                document.addEventListener('keyup', this.handleKeyUp.bind(this));
            }
            if (this.config.useMobile) {
                this.setupMobileControls();
            }
        }
        setupMobileControls() {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        }
        handleKeyDown(event) {
            event.preventDefault();
        }
        isKeyPressed(action, event) {
            const key = this.keyMap[action];
            return event.key === key || event.key.toLowerCase() === key.toLowerCase();
        }
        handleKeyUp(event) {
            event.preventDefault();
        }
        handleTouchStart(event) {
            event.preventDefault();
        }
        handleTouchMove(event) {
            event.preventDefault();
        }
        handleTouchEnd(event) {
            event.preventDefault();
        }
        gameLoop() {
            if (!this.isRunning || this.isPaused)
                return;
            this.update();
            this.render();
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
        start() {
            if (this.isRunning)
                return;
            this.isRunning = true;
            this.isPaused = false;
            this.gameLoop();
        }
        stop() {
            this.isRunning = false;
            this.isPaused = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
        pause() {
            this.isPaused = true;
        }
        resume() {
            if (!this.isRunning)
                return;
            this.isPaused = false;
            this.gameLoop();
        }
        destroy() {
            this.stop();
            if (this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            document.removeEventListener('keydown', this.handleKeyDown.bind(this));
            document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        }
    }

    var Direction$1;
    (function (Direction) {
        Direction["UP"] = "UP";
        Direction["DOWN"] = "DOWN";
        Direction["LEFT"] = "LEFT";
        Direction["RIGHT"] = "RIGHT";
    })(Direction$1 || (Direction$1 = {}));
    class Snake extends GameEngine {
        constructor(container, config = {}) {
            super(container, config);
            this.snake = [];
            this.food = { x: 0, y: 0 };
            this.direction = Direction$1.RIGHT;
            this.gridSize = 20;
            this.score = 0;
            this.gameOver = false;
            this.initGame();
        }
        initGame() {
            this.snake = [{ x: 100, y: 100 }];
            this.generateFood();
            this.score = 0;
            this.gameOver = false;
            this.direction = Direction$1.RIGHT;
        }
        generateFood() {
            const maxX = Math.floor(this.config.width / this.gridSize);
            const maxY = Math.floor(this.config.height / this.gridSize);
            this.food = {
                x: Math.floor(Math.random() * maxX) * this.gridSize,
                y: Math.floor(Math.random() * maxY) * this.gridSize
            };
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
                if (this.direction !== Direction$1.DOWN) {
                    this.direction = Direction$1.UP;
                }
            }
            else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
                if (this.direction !== Direction$1.UP) {
                    this.direction = Direction$1.DOWN;
                }
            }
            else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
                if (this.direction !== Direction$1.RIGHT) {
                    this.direction = Direction$1.LEFT;
                }
            }
            else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
                if (this.direction !== Direction$1.LEFT) {
                    this.direction = Direction$1.RIGHT;
                }
            }
            else if (this.isKeyPressed('START', event) || event.key === ' ') {
                if (this.gameOver) {
                    this.initGame();
                    this.start();
                }
            }
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameOver) {
                this.initGame();
                this.start();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const centerX = this.config.width / 2;
            const centerY = this.config.height / 2;
            const deltaX = x - centerX;
            const deltaY = y - centerY;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0 && this.direction !== Direction$1.LEFT) {
                    this.direction = Direction$1.RIGHT;
                }
                else if (deltaX < 0 && this.direction !== Direction$1.RIGHT) {
                    this.direction = Direction$1.LEFT;
                }
            }
            else {
                if (deltaY > 0 && this.direction !== Direction$1.UP) {
                    this.direction = Direction$1.DOWN;
                }
                else if (deltaY < 0 && this.direction !== Direction$1.DOWN) {
                    this.direction = Direction$1.UP;
                }
            }
        }
        update() {
            if (this.gameOver)
                return;
            const head = { ...this.snake[0] };
            switch (this.direction) {
                case Direction$1.UP:
                    head.y -= this.gridSize;
                    break;
                case Direction$1.DOWN:
                    head.y += this.gridSize;
                    break;
                case Direction$1.LEFT:
                    head.x -= this.gridSize;
                    break;
                case Direction$1.RIGHT:
                    head.x += this.gridSize;
                    break;
            }
            if (head.x < 0 || head.x >= this.config.width ||
                head.y < 0 || head.y >= this.config.height) {
                this.gameOver = true;
                return;
            }
            for (const segment of this.snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    this.gameOver = true;
                    return;
                }
            }
            this.snake.unshift(head);
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                this.generateFood();
            }
            else {
                this.snake.pop();
            }
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#0f0';
            for (const segment of this.snake) {
                this.ctx.fillRect(segment.x, segment.y, this.gridSize - 2, this.gridSize - 2);
            }
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(this.food.x, this.food.y, this.gridSize - 2, this.gridSize - 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 30);
            if (this.gameOver) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
        }
        start() {
            super.start();
            setInterval(() => {
                if (this.isRunning && !this.isPaused && !this.gameOver) {
                    this.update();
                }
            }, 150);
        }
    }

    class Pong extends GameEngine {
        constructor(container, config = {}) {
            super(container, config);
            this.leftScore = 0;
            this.rightScore = 0;
            this.gameState = 'waiting';
            this.keys = {};
            this.initGame();
        }
        initGame() {
            const paddleHeight = 80;
            const paddleWidth = 10;
            const paddleSpeed = 5;
            this.ball = {
                x: this.config.width / 2,
                y: this.config.height / 2,
                vx: Math.random() < 0.5 ? -3 : 3,
                vy: Math.random() * 4 - 2,
                radius: 8
            };
            this.leftPaddle = {
                x: 20,
                y: this.config.height / 2 - paddleHeight / 2,
                width: paddleWidth,
                height: paddleHeight,
                speed: paddleSpeed
            };
            this.rightPaddle = {
                x: this.config.width - 30,
                y: this.config.height / 2 - paddleHeight / 2,
                width: paddleWidth,
                height: paddleHeight,
                speed: paddleSpeed
            };
            this.leftScore = 0;
            this.rightScore = 0;
            this.gameState = 'waiting';
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                if (this.gameState === 'waiting') {
                    this.gameState = 'playing';
                }
                else if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                }
                else if (this.gameState === 'paused') {
                    this.gameState = 'playing';
                }
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            if (this.gameState === 'waiting') {
                this.gameState = 'playing';
                return;
            }
            if (x < this.config.width / 2) {
                this.leftPaddle.y = y - this.leftPaddle.height / 2;
            }
            else {
                this.rightPaddle.y = y - this.rightPaddle.height / 2;
            }
            this.clampPaddles();
        }
        handleTouchMove(event) {
            super.handleTouchMove(event);
            this.handleTouchStart(event);
        }
        clampPaddles() {
            this.leftPaddle.y = Math.max(0, Math.min(this.config.height - this.leftPaddle.height, this.leftPaddle.y));
            this.rightPaddle.y = Math.max(0, Math.min(this.config.height - this.rightPaddle.height, this.rightPaddle.y));
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            if (this.config.useKeyboard) {
                if (this.isKeyPressed('UP', { key: Object.keys(this.keys).find(k => this.keys[k] && k === this.keyMap.UP) || '' }) || this.keys['w'] || this.keys['W']) {
                    this.leftPaddle.y -= this.leftPaddle.speed;
                }
                if (this.isKeyPressed('DOWN', { key: Object.keys(this.keys).find(k => this.keys[k] && k === this.keyMap.DOWN) || '' }) || this.keys['s'] || this.keys['S']) {
                    this.leftPaddle.y += this.leftPaddle.speed;
                }
                if (this.keys[this.keyMap.UP] || this.keys['i'] || this.keys['I']) {
                    this.rightPaddle.y -= this.rightPaddle.speed;
                }
                if (this.keys[this.keyMap.DOWN] || this.keys['k'] || this.keys['K']) {
                    this.rightPaddle.y += this.rightPaddle.speed;
                }
            }
            this.clampPaddles();
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            if (this.ball.y <= this.ball.radius || this.ball.y >= this.config.height - this.ball.radius) {
                this.ball.vy = -this.ball.vy;
            }
            if (this.checkPaddleCollision(this.leftPaddle) || this.checkPaddleCollision(this.rightPaddle)) {
                this.ball.vx = -this.ball.vx;
                this.ball.vx *= 1.05;
                this.ball.vy *= 1.05;
            }
            if (this.ball.x < 0) {
                this.rightScore++;
                this.resetBall();
            }
            else if (this.ball.x > this.config.width) {
                this.leftScore++;
                this.resetBall();
            }
        }
        checkPaddleCollision(paddle) {
            return this.ball.x - this.ball.radius < paddle.x + paddle.width &&
                this.ball.x + this.ball.radius > paddle.x &&
                this.ball.y - this.ball.radius < paddle.y + paddle.height &&
                this.ball.y + this.ball.radius > paddle.y;
        }
        resetBall() {
            this.ball.x = this.config.width / 2;
            this.ball.y = this.config.height / 2;
            this.ball.vx = Math.random() < 0.5 ? -3 : 3;
            this.ball.vy = Math.random() * 4 - 2;
            this.gameState = 'waiting';
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.config.width / 2, 0);
            this.ctx.lineTo(this.config.width / 2, this.config.height);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
            this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.leftScore.toString(), this.config.width / 4, 50);
            this.ctx.fillText(this.rightScore.toString(), (3 * this.config.width) / 4, 50);
            if (this.gameState === 'waiting') {
                this.ctx.font = '20px Arial';
                this.ctx.fillText('Press SPACE or tap to start', this.config.width / 2, this.config.height / 2 + 50);
                if (this.config.useKeyboard) {
                    this.ctx.font = '14px Arial';
                    this.ctx.fillText('Left: W/S or ↑/↓ | Right: I/K', this.config.width / 2, this.config.height / 2 + 80);
                }
            }
            else if (this.gameState === 'paused') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.fillText('PAUSED', this.config.width / 2, this.config.height / 2);
                this.ctx.font = '16px Arial';
                this.ctx.fillText('Press SPACE to resume', this.config.width / 2, this.config.height / 2 + 30);
            }
            this.ctx.textAlign = 'left';
        }
    }

    class Breakout extends GameEngine {
        constructor(container, config = {}) {
            super(container, config);
            this.bricks = [];
            this.score = 0;
            this.lives = 3;
            this.gameState = 'waiting';
            this.keys = {};
            this.initGame();
        }
        initGame() {
            this.ball = {
                x: this.config.width / 2,
                y: this.config.height - 80,
                vx: 0,
                vy: 0,
                radius: 8
            };
            this.paddle = {
                x: this.config.width / 2 - 40,
                y: this.config.height - 30,
                width: 80,
                height: 10,
                speed: 6
            };
            this.score = 0;
            this.lives = 3;
            this.gameState = 'waiting';
            this.createBricks();
        }
        createBricks() {
            this.bricks = [];
            const rows = 6;
            const cols = 8;
            const brickWidth = this.config.width / cols - 4;
            const brickHeight = 20;
            const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#0000ff'];
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    this.bricks.push({
                        x: col * (brickWidth + 4) + 2,
                        y: row * (brickHeight + 4) + 50,
                        width: brickWidth,
                        height: brickHeight,
                        color: colors[row],
                        destroyed: false
                    });
                }
            }
        }
        launchBall() {
            this.ball.vx = Math.random() * 4 - 2;
            this.ball.vy = -4;
            this.gameState = 'playing';
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                if (this.gameState === 'waiting') {
                    this.launchBall();
                }
                else if (this.gameState === 'gameOver' || this.gameState === 'won') {
                    this.initGame();
                }
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameState === 'waiting') {
                this.launchBall();
                return;
            }
            if (this.gameState === 'gameOver' || this.gameState === 'won') {
                this.initGame();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            this.paddle.x = x - this.paddle.width / 2;
            this.clampPaddle();
        }
        handleTouchMove(event) {
            super.handleTouchMove(event);
            if (this.gameState === 'playing') {
                this.handleTouchStart(event);
            }
        }
        clampPaddle() {
            this.paddle.x = Math.max(0, Math.min(this.config.width - this.paddle.width, this.paddle.x));
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            if (this.config.useKeyboard) {
                if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                    this.paddle.x -= this.paddle.speed;
                }
                if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                    this.paddle.x += this.paddle.speed;
                }
            }
            this.clampPaddle();
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            if (this.ball.x <= this.ball.radius || this.ball.x >= this.config.width - this.ball.radius) {
                this.ball.vx = -this.ball.vx;
            }
            if (this.ball.y <= this.ball.radius) {
                this.ball.vy = -this.ball.vy;
            }
            if (this.checkPaddleCollision()) {
                this.ball.vy = -Math.abs(this.ball.vy);
                const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
                this.ball.vx = (hitPos - 0.5) * 6;
            }
            this.checkBrickCollisions();
            if (this.ball.y > this.config.height) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
                else {
                    this.resetBall();
                }
            }
            const remainingBricks = this.bricks.filter(brick => !brick.destroyed);
            if (remainingBricks.length === 0) {
                this.gameState = 'won';
            }
        }
        checkPaddleCollision() {
            return this.ball.x >= this.paddle.x &&
                this.ball.x <= this.paddle.x + this.paddle.width &&
                this.ball.y + this.ball.radius >= this.paddle.y &&
                this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height;
        }
        checkBrickCollisions() {
            for (const brick of this.bricks) {
                if (brick.destroyed)
                    continue;
                if (this.ball.x + this.ball.radius >= brick.x &&
                    this.ball.x - this.ball.radius <= brick.x + brick.width &&
                    this.ball.y + this.ball.radius >= brick.y &&
                    this.ball.y - this.ball.radius <= brick.y + brick.height) {
                    brick.destroyed = true;
                    this.score += 10;
                    this.ball.vy = -this.ball.vy;
                    break;
                }
            }
        }
        resetBall() {
            this.ball.x = this.config.width / 2;
            this.ball.y = this.config.height - 80;
            this.ball.vx = 0;
            this.ball.vy = 0;
            this.gameState = 'waiting';
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            for (const brick of this.bricks) {
                if (!brick.destroyed) {
                    this.ctx.fillStyle = brick.color;
                    this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
                }
            }
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
            this.ctx.beginPath();
            this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 30);
            this.ctx.fillText(`Lives: ${this.lives}`, this.config.width - 100, 30);
            if (this.gameState === 'waiting') {
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Press SPACE or tap to launch ball', this.config.width / 2, this.config.height / 2);
                if (this.config.useKeyboard) {
                    this.ctx.font = '14px Arial';
                    this.ctx.fillText('Use A/D or ←/→ to move paddle', this.config.width / 2, this.config.height / 2 + 30);
                }
            }
            else if (this.gameState === 'gameOver') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
            }
            else if (this.gameState === 'won') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
            }
            this.ctx.textAlign = 'left';
        }
    }

    class SpaceInvaders extends GameEngine {
        constructor(container, config = {}) {
            super(container, config);
            this.bullets = [];
            this.invaders = [];
            this.score = 0;
            this.lives = 3;
            this.gameState = 'playing';
            this.keys = {};
            this.invaderDirection = 1;
            this.invaderDropTimer = 0;
            this.shootCooldown = 0;
            this.initGame();
        }
        initGame() {
            this.player = {
                x: this.config.width / 2 - 15,
                y: this.config.height - 40,
                width: 30,
                height: 20,
                speed: 5
            };
            this.score = 0;
            this.lives = 3;
            this.gameState = 'playing';
            this.bullets = [];
            this.invaderDirection = 1;
            this.invaderDropTimer = 0;
            this.shootCooldown = 0;
            this.createInvaders();
        }
        createInvaders() {
            this.invaders = [];
            const rows = 5;
            const cols = 10;
            const invaderWidth = 24;
            const invaderHeight = 20;
            const spacing = 8;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    this.invaders.push({
                        x: col * (invaderWidth + spacing) + 50,
                        y: row * (invaderHeight + spacing) + 50,
                        width: invaderWidth,
                        height: invaderHeight,
                        active: true,
                        type: row < 2 ? 3 : row < 4 ? 2 : 1
                    });
                }
            }
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.isKeyPressed('FIRE', event) && this.shootCooldown <= 0) {
                this.playerShoot();
                this.shootCooldown = 20;
            }
            if (this.isKeyPressed('START', event) && (this.gameState === 'gameOver' || this.gameState === 'won')) {
                this.initGame();
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameState === 'gameOver' || this.gameState === 'won') {
                this.initGame();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            if (x < this.config.width / 3) {
                this.keys['left'] = true;
            }
            else if (x > (2 * this.config.width) / 3) {
                this.keys['right'] = true;
            }
            else {
                if (this.shootCooldown <= 0) {
                    this.playerShoot();
                    this.shootCooldown = 20;
                }
            }
        }
        handleTouchEnd(event) {
            super.handleTouchEnd(event);
            this.keys['left'] = false;
            this.keys['right'] = false;
        }
        playerShoot() {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 1,
                y: this.player.y,
                vx: 0,
                vy: -8,
                width: 2,
                height: 8,
                active: true,
                isPlayer: true
            });
        }
        invaderShoot() {
            const activeInvaders = this.invaders.filter(inv => inv.active);
            if (activeInvaders.length === 0)
                return;
            if (Math.random() < 0.02) {
                const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
                this.bullets.push({
                    x: shooter.x + shooter.width / 2 - 1,
                    y: shooter.y + shooter.height,
                    vx: 0,
                    vy: 3,
                    width: 2,
                    height: 8,
                    active: true,
                    isPlayer: false
                });
            }
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            if (this.shootCooldown > 0)
                this.shootCooldown--;
            if (this.config.useKeyboard) {
                if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['left']) {
                    this.player.x -= this.player.speed;
                }
                if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['right']) {
                    this.player.x += this.player.speed;
                }
            }
            this.player.x = Math.max(0, Math.min(this.config.width - this.player.width, this.player.x));
            this.bullets = this.bullets.filter(bullet => {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                return bullet.active && bullet.y > -bullet.height && bullet.y < this.config.height + bullet.height;
            });
            this.checkBulletCollisions();
            this.updateInvaders();
            this.invaderShoot();
            const activeInvaders = this.invaders.filter(inv => inv.active);
            if (activeInvaders.length === 0) {
                this.gameState = 'won';
            }
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
            }
            const lowestInvader = Math.max(...activeInvaders.map(inv => inv.y));
            if (lowestInvader > this.player.y) {
                this.gameState = 'gameOver';
            }
        }
        updateInvaders() {
            let shouldDrop = false;
            const activeInvaders = this.invaders.filter(inv => inv.active);
            for (const invader of activeInvaders) {
                invader.x += this.invaderDirection * 0.5;
                if (invader.x <= 0 || invader.x >= this.config.width - invader.width) {
                    shouldDrop = true;
                }
            }
            if (shouldDrop) {
                this.invaderDirection *= -1;
                for (const invader of activeInvaders) {
                    invader.y += 20;
                }
            }
        }
        checkBulletCollisions() {
            for (const bullet of this.bullets) {
                if (!bullet.active)
                    continue;
                if (bullet.isPlayer) {
                    for (const invader of this.invaders) {
                        if (invader.active && this.checkCollision(bullet, invader)) {
                            bullet.active = false;
                            invader.active = false;
                            this.score += invader.type * 10;
                            break;
                        }
                    }
                }
                else {
                    if (this.checkCollision(bullet, this.player)) {
                        bullet.active = false;
                        this.lives--;
                    }
                }
            }
        }
        checkCollision(obj1, obj2) {
            return obj1.x < obj2.x + obj2.width &&
                obj1.x + obj1.width > obj2.x &&
                obj1.y < obj2.y + obj2.height &&
                obj1.y + obj1.height > obj2.y;
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            for (const invader of this.invaders) {
                if (invader.active) {
                    this.ctx.fillStyle = invader.type === 3 ? '#f00' : invader.type === 2 ? '#ff0' : '#fff';
                    this.ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
                }
            }
            for (const bullet of this.bullets) {
                if (bullet.active) {
                    this.ctx.fillStyle = bullet.isPlayer ? '#0ff' : '#f0f';
                    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                }
            }
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 25);
            this.ctx.fillText(`Lives: ${this.lives}`, this.config.width - 80, 25);
            if (this.gameState === 'gameOver') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
            }
            else if (this.gameState === 'won') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
            }
            else if (this.config.useMobile) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(10, this.config.height - 60, 60, 50);
                this.ctx.fillRect(this.config.width - 70, this.config.height - 60, 60, 50);
                this.ctx.fillRect(this.config.width / 2 - 30, this.config.height - 60, 60, 50);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('←', 40, this.config.height - 30);
                this.ctx.fillText('→', this.config.width - 40, this.config.height - 30);
                this.ctx.fillText('FIRE', this.config.width / 2, this.config.height - 30);
            }
            this.ctx.textAlign = 'left';
        }
    }

    const TETROMINOS = {
        I: [
            [[1, 1, 1, 1]],
            [[1], [1], [1], [1]]
        ],
        O: [
            [[1, 1], [1, 1]]
        ],
        T: [
            [[0, 1, 0], [1, 1, 1]],
            [[1, 0], [1, 1], [1, 0]],
            [[1, 1, 1], [0, 1, 0]],
            [[0, 1], [1, 1], [0, 1]]
        ],
        S: [
            [[0, 1, 1], [1, 1, 0]],
            [[1, 0], [1, 1], [0, 1]]
        ],
        Z: [
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1], [1, 1], [1, 0]]
        ],
        J: [
            [[1, 0, 0], [1, 1, 1]],
            [[1, 1], [1, 0], [1, 0]],
            [[1, 1, 1], [0, 0, 1]],
            [[0, 1], [0, 1], [1, 1]]
        ],
        L: [
            [[0, 0, 1], [1, 1, 1]],
            [[1, 0], [1, 0], [1, 1]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1], [0, 1], [0, 1]]
        ]
    };
    const COLORS = {
        I: '#00ffff',
        O: '#ffff00',
        T: '#800080',
        S: '#00ff00',
        Z: '#ff0000',
        J: '#0000ff',
        L: '#ffa500'
    };
    class Tetris extends GameEngine {
        constructor(container, config = {}) {
            super(container, config);
            this.currentPiece = null;
            this.nextPiece = null;
            this.score = 0;
            this.lines = 0;
            this.level = 1;
            this.dropTimer = 0;
            this.dropInterval = 60;
            this.gameState = 'playing';
            this.keys = {};
            this.blockSize = 20;
            this.gridWidth = 10;
            this.gridHeight = 20;
            this.initGame();
        }
        initGame() {
            this.grid = Array(this.gridHeight).fill(null).map(() => Array(this.gridWidth).fill(''));
            this.score = 0;
            this.lines = 0;
            this.level = 1;
            this.dropTimer = 0;
            this.dropInterval = 60;
            this.gameState = 'playing';
            this.currentPiece = this.createRandomPiece();
            this.nextPiece = this.createRandomPiece();
        }
        createRandomPiece() {
            const types = Object.keys(TETROMINOS);
            const type = types[Math.floor(Math.random() * types.length)];
            const shapes = TETROMINOS[type];
            return {
                blocks: this.shapeToBlocks(shapes[0], COLORS[type]),
                color: COLORS[type],
                x: Math.floor(this.gridWidth / 2) - 1,
                y: 0,
                rotation: 0
            };
        }
        shapeToBlocks(shape, color) {
            const blocks = [];
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        blocks.push({ x, y, color });
                    }
                }
            }
            return blocks;
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.gameState === 'gameOver') {
                if (this.isKeyPressed('START', event) || event.key === ' ') {
                    this.initGame();
                }
                return;
            }
            if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
                this.movePiece(-1, 0);
            }
            else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
                this.movePiece(1, 0);
            }
            else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
                this.movePiece(0, 1);
            }
            else if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
                this.rotatePiece();
            }
            else if (event.key === ' ') {
                this.dropPiece();
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameState === 'gameOver') {
                this.initGame();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const gameAreaWidth = this.gridWidth * this.blockSize;
            const gameAreaHeight = this.gridHeight * this.blockSize;
            const offsetX = (this.config.width - gameAreaWidth) / 2;
            const offsetY = 20;
            if (x < offsetX) {
                this.movePiece(-1, 0);
            }
            else if (x > offsetX + gameAreaWidth) {
                this.movePiece(1, 0);
            }
            else if (y > offsetY + gameAreaHeight - 60) {
                this.dropPiece();
            }
            else {
                this.rotatePiece();
            }
        }
        movePiece(dx, dy) {
            if (!this.currentPiece)
                return false;
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            if (this.checkCollision()) {
                this.currentPiece.x -= dx;
                this.currentPiece.y -= dy;
                return false;
            }
            return true;
        }
        rotatePiece() {
            if (!this.currentPiece)
                return;
            const rotatedBlocks = this.currentPiece.blocks.map(block => ({
                ...block,
                x: -block.y,
                y: block.x
            }));
            const originalBlocks = this.currentPiece.blocks;
            this.currentPiece.blocks = rotatedBlocks;
            if (this.checkCollision()) {
                this.currentPiece.blocks = originalBlocks;
            }
        }
        dropPiece() {
            if (!this.currentPiece)
                return;
            while (this.movePiece(0, 1)) {
                // Keep dropping
            }
        }
        checkCollision() {
            if (!this.currentPiece)
                return false;
            for (const block of this.currentPiece.blocks) {
                const x = this.currentPiece.x + block.x;
                const y = this.currentPiece.y + block.y;
                if (x < 0 || x >= this.gridWidth || y >= this.gridHeight) {
                    return true;
                }
                if (y >= 0 && this.grid[y][x]) {
                    return true;
                }
            }
            return false;
        }
        placePiece() {
            if (!this.currentPiece)
                return;
            for (const block of this.currentPiece.blocks) {
                const x = this.currentPiece.x + block.x;
                const y = this.currentPiece.y + block.y;
                if (y >= 0) {
                    this.grid[y][x] = this.currentPiece.color;
                }
            }
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.createRandomPiece();
            if (this.checkCollision()) {
                this.gameState = 'gameOver';
            }
        }
        clearLines() {
            let linesCleared = 0;
            for (let y = this.gridHeight - 1; y >= 0; y--) {
                if (this.grid[y].every(cell => cell !== '')) {
                    this.grid.splice(y, 1);
                    this.grid.unshift(Array(this.gridWidth).fill(''));
                    linesCleared++;
                    y++; // Check the same row again
                }
            }
            if (linesCleared > 0) {
                this.lines += linesCleared;
                this.score += linesCleared * 100 * this.level;
                this.level = Math.floor(this.lines / 10) + 1;
                this.dropInterval = Math.max(10, 60 - (this.level - 1) * 5);
            }
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            this.dropTimer++;
            if (this.dropTimer >= this.dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.placePiece();
                }
                this.dropTimer = 0;
            }
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            const gameAreaWidth = this.gridWidth * this.blockSize;
            const gameAreaHeight = this.gridHeight * this.blockSize;
            const offsetX = (this.config.width - gameAreaWidth) / 2;
            const offsetY = 20;
            // Draw grid
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            for (let x = 0; x <= this.gridWidth; x++) {
                this.ctx.beginPath();
                this.ctx.moveTo(offsetX + x * this.blockSize, offsetY);
                this.ctx.lineTo(offsetX + x * this.blockSize, offsetY + gameAreaHeight);
                this.ctx.stroke();
            }
            for (let y = 0; y <= this.gridHeight; y++) {
                this.ctx.beginPath();
                this.ctx.moveTo(offsetX, offsetY + y * this.blockSize);
                this.ctx.lineTo(offsetX + gameAreaWidth, offsetY + y * this.blockSize);
                this.ctx.stroke();
            }
            // Draw placed blocks
            for (let y = 0; y < this.gridHeight; y++) {
                for (let x = 0; x < this.gridWidth; x++) {
                    if (this.grid[y][x]) {
                        this.ctx.fillStyle = this.grid[y][x];
                        this.ctx.fillRect(offsetX + x * this.blockSize + 1, offsetY + y * this.blockSize + 1, this.blockSize - 2, this.blockSize - 2);
                    }
                }
            }
            // Draw current piece
            if (this.currentPiece) {
                this.ctx.fillStyle = this.currentPiece.color;
                for (const block of this.currentPiece.blocks) {
                    const x = this.currentPiece.x + block.x;
                    const y = this.currentPiece.y + block.y;
                    if (y >= 0) {
                        this.ctx.fillRect(offsetX + x * this.blockSize + 1, offsetY + y * this.blockSize + 1, this.blockSize - 2, this.blockSize - 2);
                    }
                }
            }
            // Draw UI
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 20);
            this.ctx.fillText(`Lines: ${this.lines}`, 10, 40);
            this.ctx.fillText(`Level: ${this.level}`, 10, 60);
            // Draw next piece
            if (this.nextPiece) {
                this.ctx.fillText('Next:', this.config.width - 80, 20);
                this.ctx.fillStyle = this.nextPiece.color;
                for (const block of this.nextPiece.blocks) {
                    this.ctx.fillRect(this.config.width - 70 + block.x * 15, 30 + block.y * 15, 13, 13);
                }
            }
            if (this.gameState === 'gameOver') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
        }
    }

    var Direction;
    (function (Direction) {
        Direction["UP"] = "UP";
        Direction["DOWN"] = "DOWN";
        Direction["LEFT"] = "LEFT";
        Direction["RIGHT"] = "RIGHT";
    })(Direction || (Direction = {}));
    const MAZE = [
        '############################',
        '#............##............#',
        '#.####.#####.##.#####.####.#',
        '#o####.#####.##.#####.####o#',
        '#..........................#',
        '#.####.##.########.##.####.#',
        '#......##....##....##......#',
        '######.#####.##.#####.######',
        '     #.##..........##.#     ',
        '######.##.###  ###.##.######',
        '#........#      #........#',
        '######.##.########.##.######',
        '     #.##..........##.#     ',
        '######.##.########.##.######',
        '#............##............#',
        '#.####.#####.##.#####.####.#',
        '#o..##................##..o#',
        '###.##.##.########.##.##.###',
        '#......##....##....##......#',
        '#.##########.##.##########.#',
        '#..........................#',
        '############################'
    ];
    class PacMan extends GameEngine {
        constructor(container, config = {}) {
            const mazeConfig = {
                ...config,
                width: config.width || MAZE[0].length * 14,
                height: config.height || MAZE.length * 14
            };
            super(container, mazeConfig);
            this.ghosts = [];
            this.dots = [];
            this.score = 0;
            this.lives = 3;
            this.gameState = 'playing';
            this.cellSize = 14;
            this.frightModeTimer = 0;
            this.keys = {};
            this.initGame();
        }
        initGame() {
            this.pacman = {
                x: 13,
                y: 18,
                direction: Direction.RIGHT,
                nextDirection: Direction.RIGHT
            };
            this.ghosts = [
                { x: 13, y: 9, direction: Direction.UP, color: '#ff0000', mode: 'scatter', modeTimer: 0 },
                { x: 13, y: 10, direction: Direction.UP, color: '#ffb8ff', mode: 'scatter', modeTimer: 30 },
                { x: 12, y: 10, direction: Direction.UP, color: '#00ffff', mode: 'scatter', modeTimer: 60 },
                { x: 14, y: 10, direction: Direction.UP, color: '#ffb852', mode: 'scatter', modeTimer: 90 }
            ];
            this.dots = [];
            this.score = 0;
            this.lives = 3;
            this.gameState = 'playing';
            this.frightModeTimer = 0;
            this.createDots();
        }
        createDots() {
            for (let y = 0; y < MAZE.length; y++) {
                for (let x = 0; x < MAZE[y].length; x++) {
                    if (MAZE[y][x] === '.') {
                        this.dots.push({ x, y, isPowerPellet: false, collected: false });
                    }
                    else if (MAZE[y][x] === 'o') {
                        this.dots.push({ x, y, isPowerPellet: true, collected: false });
                    }
                }
            }
        }
        isWall(x, y) {
            if (y < 0 || y >= MAZE.length || x < 0 || x >= MAZE[0].length)
                return true;
            return MAZE[y][x] === '#';
        }
        wrapPosition(x, y) {
            // Tunnel wrapping
            if (x < 0)
                x = MAZE[0].length - 1;
            if (x >= MAZE[0].length)
                x = 0;
            return { x, y };
        }
        getNextPosition(x, y, direction) {
            let newX = x;
            let newY = y;
            switch (direction) {
                case Direction.UP:
                    newY--;
                    break;
                case Direction.DOWN:
                    newY++;
                    break;
                case Direction.LEFT:
                    newX--;
                    break;
                case Direction.RIGHT:
                    newX++;
                    break;
            }
            return this.wrapPosition(newX, newY);
        }
        canMove(x, y, direction) {
            const next = this.getNextPosition(x, y, direction);
            return !this.isWall(next.x, next.y);
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.gameState === 'gameOver' || this.gameState === 'won') {
                if (this.isKeyPressed('START', event) || event.key === ' ') {
                    this.initGame();
                }
                return;
            }
            if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
                this.pacman.nextDirection = Direction.UP;
            }
            else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
                this.pacman.nextDirection = Direction.DOWN;
            }
            else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
                this.pacman.nextDirection = Direction.LEFT;
            }
            else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
                this.pacman.nextDirection = Direction.RIGHT;
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameState === 'gameOver' || this.gameState === 'won') {
                this.initGame();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const pacmanScreenX = (this.pacman.x + 0.5) * this.cellSize;
            const pacmanScreenY = (this.pacman.y + 0.5) * this.cellSize;
            const deltaX = x - pacmanScreenX;
            const deltaY = y - pacmanScreenY;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.pacman.nextDirection = deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
            }
            else {
                this.pacman.nextDirection = deltaY > 0 ? Direction.DOWN : Direction.UP;
            }
        }
        movePacman() {
            // Try to change direction
            if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
                this.pacman.direction = this.pacman.nextDirection;
            }
            // Move in current direction
            if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction)) {
                const next = this.getNextPosition(this.pacman.x, this.pacman.y, this.pacman.direction);
                this.pacman.x = next.x;
                this.pacman.y = next.y;
            }
        }
        moveGhost(ghost) {
            ghost.modeTimer--;
            if (ghost.modeTimer <= 0) {
                if (ghost.mode === 'scatter') {
                    ghost.mode = 'chase';
                    ghost.modeTimer = 200;
                }
                else if (ghost.mode === 'chase') {
                    ghost.mode = 'scatter';
                    ghost.modeTimer = 100;
                }
            }
            const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
            const validDirections = directions.filter(dir => this.canMove(ghost.x, ghost.y, dir));
            if (validDirections.length > 0) {
                if (ghost.mode === 'frightened') {
                    // Random movement when frightened
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                }
                else {
                    // Simple AI: move towards pacman
                    let bestDirection = ghost.direction;
                    let bestDistance = Infinity;
                    for (const dir of validDirections) {
                        const next = this.getNextPosition(ghost.x, ghost.y, dir);
                        const distance = Math.abs(next.x - this.pacman.x) + Math.abs(next.y - this.pacman.y);
                        if (ghost.mode === 'chase' && distance < bestDistance) {
                            bestDistance = distance;
                            bestDirection = dir;
                        }
                        else if (ghost.mode === 'scatter' && distance > bestDistance) {
                            bestDistance = distance;
                            bestDirection = dir;
                        }
                    }
                    ghost.direction = bestDirection;
                }
                const next = this.getNextPosition(ghost.x, ghost.y, ghost.direction);
                ghost.x = next.x;
                ghost.y = next.y;
            }
        }
        checkCollisions() {
            // Check dot collection
            for (const dot of this.dots) {
                if (!dot.collected && dot.x === this.pacman.x && dot.y === this.pacman.y) {
                    dot.collected = true;
                    this.score += dot.isPowerPellet ? 50 : 10;
                    if (dot.isPowerPellet) {
                        this.frightModeTimer = 200;
                        this.ghosts.forEach(ghost => {
                            ghost.mode = 'frightened';
                            ghost.modeTimer = 200;
                        });
                    }
                }
            }
            // Check ghost collisions
            for (const ghost of this.ghosts) {
                if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                    if (ghost.mode === 'frightened') {
                        // Eat ghost
                        this.score += 200;
                        ghost.x = 13;
                        ghost.y = 9;
                        ghost.mode = 'scatter';
                        ghost.modeTimer = 100;
                    }
                    else {
                        // Pacman dies
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameState = 'gameOver';
                        }
                        else {
                            // Reset positions
                            this.pacman.x = 13;
                            this.pacman.y = 18;
                            this.pacman.direction = Direction.RIGHT;
                            this.pacman.nextDirection = Direction.RIGHT;
                        }
                    }
                }
            }
            // Check win condition
            const remainingDots = this.dots.filter(dot => !dot.collected);
            if (remainingDots.length === 0) {
                this.gameState = 'won';
            }
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            if (this.frightModeTimer > 0) {
                this.frightModeTimer--;
                if (this.frightModeTimer === 0) {
                    this.ghosts.forEach(ghost => {
                        if (ghost.mode === 'frightened') {
                            ghost.mode = 'scatter';
                            ghost.modeTimer = 100;
                        }
                    });
                }
            }
            this.movePacman();
            this.ghosts.forEach(ghost => this.moveGhost(ghost));
            this.checkCollisions();
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            // Draw maze
            this.ctx.fillStyle = '#0000ff';
            for (let y = 0; y < MAZE.length; y++) {
                for (let x = 0; x < MAZE[y].length; x++) {
                    if (MAZE[y][x] === '#') {
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    }
                }
            }
            // Draw dots
            for (const dot of this.dots) {
                if (!dot.collected) {
                    this.ctx.fillStyle = '#ffff00';
                    if (dot.isPowerPellet) {
                        this.ctx.beginPath();
                        this.ctx.arc((dot.x + 0.5) * this.cellSize, (dot.y + 0.5) * this.cellSize, this.cellSize / 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    else {
                        this.ctx.beginPath();
                        this.ctx.arc((dot.x + 0.5) * this.cellSize, (dot.y + 0.5) * this.cellSize, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
            // Draw ghosts
            for (const ghost of this.ghosts) {
                this.ctx.fillStyle = ghost.mode === 'frightened' && this.frightModeTimer > 0 ? '#0000ff' : ghost.color;
                this.ctx.beginPath();
                this.ctx.arc((ghost.x + 0.5) * this.cellSize, (ghost.y + 0.5) * this.cellSize, this.cellSize / 2 - 1, 0, Math.PI * 2);
                this.ctx.fill();
                // Ghost eyes
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(ghost.x * this.cellSize + 3, ghost.y * this.cellSize + 3, 3, 3);
                this.ctx.fillRect(ghost.x * this.cellSize + 8, ghost.y * this.cellSize + 3, 3, 3);
            }
            // Draw Pacman
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc((this.pacman.x + 0.5) * this.cellSize, (this.pacman.y + 0.5) * this.cellSize, this.cellSize / 2 - 1, 0, Math.PI * 2);
            this.ctx.fill();
            // Pacman mouth
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            const mouthAngle = Math.PI / 3;
            let startAngle = 0;
            switch (this.pacman.direction) {
                case Direction.RIGHT:
                    startAngle = -mouthAngle / 2;
                    break;
                case Direction.LEFT:
                    startAngle = Math.PI - mouthAngle / 2;
                    break;
                case Direction.UP:
                    startAngle = -Math.PI / 2 - mouthAngle / 2;
                    break;
                case Direction.DOWN:
                    startAngle = Math.PI / 2 - mouthAngle / 2;
                    break;
            }
            this.ctx.moveTo((this.pacman.x + 0.5) * this.cellSize, (this.pacman.y + 0.5) * this.cellSize);
            this.ctx.arc((this.pacman.x + 0.5) * this.cellSize, (this.pacman.y + 0.5) * this.cellSize, this.cellSize / 2 - 1, startAngle, startAngle + mouthAngle);
            this.ctx.closePath();
            this.ctx.fill();
            // UI
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 20);
            this.ctx.fillText(`Lives: ${this.lives}`, 10, 40);
            if (this.gameState === 'gameOver') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#ffff00';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
            else if (this.gameState === 'won') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#ffff00';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
        }
        start() {
            super.start();
            setInterval(() => {
                if (this.isRunning && !this.isPaused && this.gameState === 'playing') {
                    this.update();
                }
            }, 150);
        }
    }

    class Asteroids extends GameEngine {
        constructor(container, config = {}) {
            super(container, config);
            this.bullets = [];
            this.asteroids = [];
            this.score = 0;
            this.lives = 3;
            this.gameState = 'playing';
            this.keys = {};
            this.shootCooldown = 0;
            this.invulnerabilityTime = 0;
            this.initGame();
        }
        initGame() {
            this.ship = {
                x: this.config.width / 2,
                y: this.config.height / 2,
                angle: 0,
                vx: 0,
                vy: 0,
                thrust: false,
                size: 8
            };
            this.bullets = [];
            this.asteroids = [];
            this.score = 0;
            this.lives = 3;
            this.gameState = 'playing';
            this.shootCooldown = 0;
            this.invulnerabilityTime = 0;
            this.createAsteroids(4);
        }
        createAsteroids(count) {
            for (let i = 0; i < count; i++) {
                this.createAsteroid(64, Math.random() * this.config.width, Math.random() * this.config.height);
            }
        }
        createAsteroid(size, x, y) {
            this.asteroids.push({
                x: x !== null && x !== void 0 ? x : Math.random() * this.config.width,
                y: y !== null && y !== void 0 ? y : Math.random() * this.config.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                angle: Math.random() * Math.PI * 2,
                size: size,
                active: true
            });
        }
        wrapPosition(obj) {
            if (obj.x < 0)
                obj.x = this.config.width;
            if (obj.x > this.config.width)
                obj.x = 0;
            if (obj.y < 0)
                obj.y = this.config.height;
            if (obj.y > this.config.height)
                obj.y = 0;
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.gameState === 'gameOver') {
                if (this.isKeyPressed('START', event) || event.key === ' ') {
                    this.initGame();
                }
                return;
            }
            if (this.isKeyPressed('FIRE', event) && this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = 10;
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameState === 'gameOver') {
                this.initGame();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const centerX = this.config.width / 2;
            const centerY = this.config.height / 2;
            if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
                // Horizontal touch - rotate
                if (x > centerX) {
                    this.keys['rotateRight'] = true;
                }
                else {
                    this.keys['rotateLeft'] = true;
                }
            }
            else {
                // Vertical touch
                if (y < centerY) {
                    this.keys['thrust'] = true;
                }
                else {
                    // Bottom area - shoot
                    if (this.shootCooldown <= 0) {
                        this.shoot();
                        this.shootCooldown = 10;
                    }
                }
            }
        }
        handleTouchEnd(event) {
            super.handleTouchEnd(event);
            this.keys['rotateLeft'] = false;
            this.keys['rotateRight'] = false;
            this.keys['thrust'] = false;
        }
        shoot() {
            const bulletSpeed = 8;
            this.bullets.push({
                x: this.ship.x,
                y: this.ship.y,
                vx: Math.cos(this.ship.angle) * bulletSpeed + this.ship.vx,
                vy: Math.sin(this.ship.angle) * bulletSpeed + this.ship.vy,
                life: 60,
                active: true
            });
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            if (this.shootCooldown > 0)
                this.shootCooldown--;
            if (this.invulnerabilityTime > 0)
                this.invulnerabilityTime--;
            // Ship controls
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['rotateLeft']) {
                this.ship.angle -= 0.15;
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['rotateRight']) {
                this.ship.angle += 0.15;
            }
            this.ship.thrust = this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['thrust'];
            if (this.ship.thrust) {
                const thrustPower = 0.3;
                this.ship.vx += Math.cos(this.ship.angle) * thrustPower;
                this.ship.vy += Math.sin(this.ship.angle) * thrustPower;
            }
            // Apply friction and max speed
            this.ship.vx *= 0.98;
            this.ship.vy *= 0.98;
            const maxSpeed = 8;
            const speed = Math.sqrt(this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy);
            if (speed > maxSpeed) {
                this.ship.vx = (this.ship.vx / speed) * maxSpeed;
                this.ship.vy = (this.ship.vy / speed) * maxSpeed;
            }
            // Update ship position
            this.ship.x += this.ship.vx;
            this.ship.y += this.ship.vy;
            this.wrapPosition(this.ship);
            // Update bullets
            this.bullets = this.bullets.filter(bullet => {
                if (!bullet.active)
                    return false;
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                bullet.life--;
                this.wrapPosition(bullet);
                if (bullet.life <= 0) {
                    bullet.active = false;
                    return false;
                }
                return true;
            });
            // Update asteroids
            for (const asteroid of this.asteroids) {
                if (!asteroid.active)
                    continue;
                asteroid.x += asteroid.vx;
                asteroid.y += asteroid.vy;
                asteroid.angle += 0.02;
                this.wrapPosition(asteroid);
            }
            this.checkCollisions();
            // Check if level complete
            const activeAsteroids = this.asteroids.filter(a => a.active);
            if (activeAsteroids.length === 0) {
                this.createAsteroids(Math.min(8, 4 + Math.floor(this.score / 1000)));
            }
        }
        checkCollisions() {
            // Bullet vs Asteroid collisions
            for (const bullet of this.bullets) {
                if (!bullet.active)
                    continue;
                for (const asteroid of this.asteroids) {
                    if (!asteroid.active)
                        continue;
                    const dx = bullet.x - asteroid.x;
                    const dy = bullet.y - asteroid.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < asteroid.size / 2) {
                        bullet.active = false;
                        asteroid.active = false;
                        // Score based on asteroid size
                        if (asteroid.size >= 64) {
                            this.score += 20;
                        }
                        else if (asteroid.size >= 32) {
                            this.score += 50;
                        }
                        else {
                            this.score += 100;
                        }
                        // Split asteroid
                        if (asteroid.size >= 32) {
                            const newSize = asteroid.size / 2;
                            for (let i = 0; i < 2; i++) {
                                this.createAsteroid(newSize, asteroid.x, asteroid.y);
                            }
                        }
                        break;
                    }
                }
            }
            // Ship vs Asteroid collisions
            if (this.invulnerabilityTime <= 0) {
                for (const asteroid of this.asteroids) {
                    if (!asteroid.active)
                        continue;
                    const dx = this.ship.x - asteroid.x;
                    const dy = this.ship.y - asteroid.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < (asteroid.size / 2) + this.ship.size) {
                        this.lives--;
                        this.invulnerabilityTime = 120;
                        // Reset ship position and velocity
                        this.ship.x = this.config.width / 2;
                        this.ship.y = this.config.height / 2;
                        this.ship.vx = 0;
                        this.ship.vy = 0;
                        this.ship.angle = 0;
                        if (this.lives <= 0) {
                            this.gameState = 'gameOver';
                        }
                        break;
                    }
                }
            }
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            // Draw asteroids
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            for (const asteroid of this.asteroids) {
                if (!asteroid.active)
                    continue;
                this.ctx.save();
                this.ctx.translate(asteroid.x, asteroid.y);
                this.ctx.rotate(asteroid.angle);
                this.ctx.beginPath();
                const sides = 8;
                const radius = asteroid.size / 2;
                for (let i = 0; i <= sides; i++) {
                    const angle = (i / sides) * Math.PI * 2;
                    const r = radius + Math.sin(angle * 3) * (radius * 0.2);
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    }
                    else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.stroke();
                this.ctx.restore();
            }
            // Draw ship (with invulnerability flashing)
            if (this.invulnerabilityTime <= 0 || Math.floor(this.invulnerabilityTime / 5) % 2 === 0) {
                this.ctx.save();
                this.ctx.translate(this.ship.x, this.ship.y);
                this.ctx.rotate(this.ship.angle);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(this.ship.size, 0);
                this.ctx.lineTo(-this.ship.size / 2, -this.ship.size / 2);
                this.ctx.lineTo(-this.ship.size / 4, 0);
                this.ctx.lineTo(-this.ship.size / 2, this.ship.size / 2);
                this.ctx.closePath();
                this.ctx.stroke();
                // Thrust flame
                if (this.ship.thrust) {
                    this.ctx.strokeStyle = '#ff4400';
                    this.ctx.beginPath();
                    this.ctx.moveTo(-this.ship.size / 4, 0);
                    this.ctx.lineTo(-this.ship.size * 1.5, 0);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }
            // Draw bullets
            this.ctx.fillStyle = '#fff';
            for (const bullet of this.bullets) {
                if (bullet.active) {
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            // UI
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 25);
            this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
            if (this.gameState === 'gameOver') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
            else if (this.config.useMobile) {
                // Mobile control hints
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(10, this.config.height - 60, 60, 50);
                this.ctx.fillRect(this.config.width - 70, this.config.height - 60, 60, 50);
                this.ctx.fillRect(this.config.width / 2 - 30, 10, 60, 50);
                this.ctx.fillRect(this.config.width / 2 - 30, this.config.height - 60, 60, 50);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('↺', 40, this.config.height - 30);
                this.ctx.fillText('↻', this.config.width - 40, this.config.height - 30);
                this.ctx.fillText('↑', this.config.width / 2, 35);
                this.ctx.fillText('FIRE', this.config.width / 2, this.config.height - 30);
                this.ctx.textAlign = 'left';
            }
        }
    }

    class Frogger extends GameEngine {
        constructor(container, config = {}) {
            const froggerConfig = {
                ...config,
                width: config.width || 13 * 32,
                height: config.height || 14 * 32
            };
            super(container, froggerConfig);
            this.vehicles = [];
            this.logs = [];
            this.lilyPads = [];
            this.score = 0;
            this.lives = 3;
            this.time = 60;
            this.gameState = 'playing';
            this.cellSize = 32;
            this.timer = 0;
            this.keys = {};
            this.initGame();
        }
        initGame() {
            this.frog = {
                x: 6,
                y: 13,
                isOnLog: false,
                logSpeed: 0
            };
            this.vehicles = [];
            this.logs = [];
            this.lilyPads = [];
            this.score = 0;
            this.lives = 3;
            this.time = 60;
            this.gameState = 'playing';
            this.timer = 0;
            this.createVehicles();
            this.createLogs();
            this.createLilyPads();
        }
        createVehicles() {
            // Row 12 - Cars (slow)
            for (let i = 0; i < 3; i++) {
                this.vehicles.push({
                    x: i * 4,
                    y: 12,
                    width: 2,
                    height: 1,
                    speed: 1,
                    color: '#ff0000'
                });
            }
            // Row 11 - Trucks (medium)
            for (let i = 0; i < 2; i++) {
                this.vehicles.push({
                    x: i * 6 + 1,
                    y: 11,
                    width: 3,
                    height: 1,
                    speed: -1.5,
                    color: '#00ff00'
                });
            }
            // Row 10 - Cars (fast)
            for (let i = 0; i < 4; i++) {
                this.vehicles.push({
                    x: i * 3,
                    y: 10,
                    width: 2,
                    height: 1,
                    speed: 2,
                    color: '#ffff00'
                });
            }
            // Row 8 - Trucks (slow reverse)
            for (let i = 0; i < 2; i++) {
                this.vehicles.push({
                    x: i * 7,
                    y: 8,
                    width: 3,
                    height: 1,
                    speed: -1,
                    color: '#ff8800'
                });
            }
            // Row 7 - Cars (medium reverse)
            for (let i = 0; i < 3; i++) {
                this.vehicles.push({
                    x: i * 4 + 2,
                    y: 7,
                    width: 2,
                    height: 1,
                    speed: -1.5,
                    color: '#8800ff'
                });
            }
        }
        createLogs() {
            // Row 6 - Long logs (slow)
            for (let i = 0; i < 2; i++) {
                this.logs.push({
                    x: i * 7,
                    y: 6,
                    width: 4,
                    height: 1,
                    speed: 0.8
                });
            }
            // Row 5 - Medium logs (medium)
            for (let i = 0; i < 3; i++) {
                this.logs.push({
                    x: i * 4 + 1,
                    y: 5,
                    width: 3,
                    height: 1,
                    speed: -1.2
                });
            }
            // Row 4 - Short logs (fast)
            for (let i = 0; i < 4; i++) {
                this.logs.push({
                    x: i * 3,
                    y: 4,
                    width: 2,
                    height: 1,
                    speed: 1.5
                });
            }
            // Row 3 - Turtles (medium, reverse)
            for (let i = 0; i < 3; i++) {
                this.logs.push({
                    x: i * 4 + 2,
                    y: 3,
                    width: 2,
                    height: 1,
                    speed: -1
                });
            }
            // Row 2 - Long logs (slow, reverse)
            for (let i = 0; i < 2; i++) {
                this.logs.push({
                    x: i * 6 + 1,
                    y: 2,
                    width: 3,
                    height: 1,
                    speed: -0.7
                });
            }
        }
        createLilyPads() {
            for (let i = 0; i < 5; i++) {
                this.lilyPads.push({
                    x: i * 2.5 + 1,
                    y: 1,
                    occupied: false
                });
            }
        }
        handleKeyDown(event) {
            super.handleKeyDown(event);
            this.keys[event.key] = true;
            if (this.gameState === 'gameOver' || this.gameState === 'won') {
                if (this.isKeyPressed('START', event) || event.key === ' ') {
                    this.initGame();
                }
                return;
            }
            if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
                this.moveFrog(0, -1);
            }
            else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
                this.moveFrog(0, 1);
            }
            else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
                this.moveFrog(-1, 0);
            }
            else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
                this.moveFrog(1, 0);
            }
        }
        handleKeyUp(event) {
            super.handleKeyUp(event);
            this.keys[event.key] = false;
        }
        handleTouchStart(event) {
            super.handleTouchStart(event);
            if (this.gameState === 'gameOver' || this.gameState === 'won') {
                this.initGame();
                return;
            }
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const frogScreenX = (this.frog.x + 0.5) * this.cellSize;
            const frogScreenY = (this.frog.y + 0.5) * this.cellSize;
            const deltaX = x - frogScreenX;
            const deltaY = y - frogScreenY;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.moveFrog(deltaX > 0 ? 1 : -1, 0);
            }
            else {
                this.moveFrog(0, deltaY > 0 ? 1 : -1);
            }
        }
        moveFrog(dx, dy) {
            const newX = this.frog.x + dx;
            const newY = this.frog.y + dy;
            // Bounds checking
            if (newX < 0 || newX >= 13 || newY < 1 || newY > 13)
                return;
            // Don't allow moving into occupied lily pad
            if (newY === 1) {
                const lilyPad = this.lilyPads.find(pad => Math.floor(pad.x) === newX && pad.y === newY && pad.occupied);
                if (lilyPad)
                    return;
            }
            this.frog.x = newX;
            this.frog.y = newY;
            this.frog.isOnLog = false;
            this.frog.logSpeed = 0;
            // Score for moving forward
            if (dy < 0 && this.frog.y < 7) {
                this.score += 10;
            }
        }
        update() {
            if (this.gameState !== 'playing')
                return;
            this.timer++;
            if (this.timer % 60 === 0) {
                this.time--;
                if (this.time <= 0) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                        return;
                    }
                    this.resetFrog();
                }
            }
            // Update vehicles
            for (const vehicle of this.vehicles) {
                vehicle.x += vehicle.speed * 0.02;
                // Wrap around
                if (vehicle.speed > 0 && vehicle.x > 13) {
                    vehicle.x = -vehicle.width;
                }
                else if (vehicle.speed < 0 && vehicle.x < -vehicle.width) {
                    vehicle.x = 13;
                }
            }
            // Update logs
            for (const log of this.logs) {
                log.x += log.speed * 0.02;
                // Wrap around
                if (log.speed > 0 && log.x > 13) {
                    log.x = -log.width;
                }
                else if (log.speed < 0 && log.x < -log.width) {
                    log.x = 13;
                }
            }
            this.checkCollisions();
            this.checkWinCondition();
        }
        checkCollisions() {
            // Water collision (if not on log)
            if (this.frog.y >= 2 && this.frog.y <= 6) {
                this.frog.isOnLog = false;
                this.frog.logSpeed = 0;
                // Check if on a log
                for (const log of this.logs) {
                    if (this.frog.y === log.y &&
                        this.frog.x >= log.x &&
                        this.frog.x < log.x + log.width) {
                        this.frog.isOnLog = true;
                        this.frog.logSpeed = log.speed;
                        break;
                    }
                }
                // If not on log, drown
                if (!this.frog.isOnLog) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                        return;
                    }
                    this.resetFrog();
                    return;
                }
            }
            // Move frog with log
            if (this.frog.isOnLog) {
                this.frog.x += this.frog.logSpeed * 0.02;
                // Check if frog moved off screen
                if (this.frog.x < 0 || this.frog.x >= 13) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                        return;
                    }
                    this.resetFrog();
                    return;
                }
            }
            // Vehicle collision
            if (this.frog.y >= 7 && this.frog.y <= 12) {
                for (const vehicle of this.vehicles) {
                    if (this.frog.y === vehicle.y &&
                        this.frog.x >= vehicle.x &&
                        this.frog.x < vehicle.x + vehicle.width) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameState = 'gameOver';
                            return;
                        }
                        this.resetFrog();
                        return;
                    }
                }
            }
            // Lily pad collision
            if (this.frog.y === 1) {
                for (const lilyPad of this.lilyPads) {
                    if (Math.abs(this.frog.x - lilyPad.x) < 0.5) {
                        if (!lilyPad.occupied) {
                            lilyPad.occupied = true;
                            this.score += 50;
                            this.resetFrog();
                        }
                        return;
                    }
                }
            }
        }
        checkWinCondition() {
            if (this.lilyPads.every(pad => pad.occupied)) {
                this.gameState = 'won';
            }
        }
        resetFrog() {
            this.frog.x = 6;
            this.frog.y = 13;
            this.frog.isOnLog = false;
            this.frog.logSpeed = 0;
            this.time = 60;
        }
        render() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            // Draw background areas
            // Safe areas (green)
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(0, 0, this.config.width, this.cellSize); // Top
            this.ctx.fillRect(0, 6 * this.cellSize, this.config.width, this.cellSize); // Middle
            this.ctx.fillRect(0, 13 * this.cellSize, this.config.width, this.cellSize); // Bottom
            // Road (gray)
            this.ctx.fillStyle = '#404040';
            this.ctx.fillRect(0, 7 * this.cellSize, this.config.width, 6 * this.cellSize);
            // Water (blue)
            this.ctx.fillStyle = '#4169E1';
            this.ctx.fillRect(0, 2 * this.cellSize, this.config.width, 5 * this.cellSize);
            // Draw lane dividers
            this.ctx.fillStyle = '#ffff00';
            for (let y = 8; y <= 11; y++) {
                for (let x = 0; x < 13; x += 2) {
                    this.ctx.fillRect(x * this.cellSize + this.cellSize * 0.4, y * this.cellSize + this.cellSize * 0.45, this.cellSize * 0.2, this.cellSize * 0.1);
                }
            }
            // Draw lily pads
            for (const lilyPad of this.lilyPads) {
                this.ctx.fillStyle = lilyPad.occupied ? '#32CD32' : '#006400';
                this.ctx.beginPath();
                this.ctx.arc((lilyPad.x + 0.5) * this.cellSize, (lilyPad.y + 0.5) * this.cellSize, this.cellSize * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            // Draw logs
            this.ctx.fillStyle = '#8B4513';
            for (const log of this.logs) {
                this.ctx.fillRect(log.x * this.cellSize, log.y * this.cellSize + this.cellSize * 0.1, log.width * this.cellSize, this.cellSize * 0.8);
            }
            // Draw vehicles
            for (const vehicle of this.vehicles) {
                this.ctx.fillStyle = vehicle.color;
                this.ctx.fillRect(vehicle.x * this.cellSize, vehicle.y * this.cellSize + this.cellSize * 0.1, vehicle.width * this.cellSize, this.cellSize * 0.8);
            }
            // Draw frog
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc((this.frog.x + 0.5) * this.cellSize, (this.frog.y + 0.5) * this.cellSize, this.cellSize * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            // Frog eyes
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc((this.frog.x + 0.3) * this.cellSize, (this.frog.y + 0.3) * this.cellSize, this.cellSize * 0.05, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc((this.frog.x + 0.7) * this.cellSize, (this.frog.y + 0.3) * this.cellSize, this.cellSize * 0.05, 0, Math.PI * 2);
            this.ctx.fill();
            // UI
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, 10, 20);
            this.ctx.fillText(`Lives: ${this.lives}`, 120, 20);
            this.ctx.fillText(`Time: ${this.time}`, 220, 20);
            if (this.gameState === 'gameOver') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
            else if (this.gameState === 'won') {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, this.config.width, this.config.height);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
                this.ctx.font = '16px Arial';
                this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
                this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
                this.ctx.textAlign = 'left';
            }
        }
    }

    const WaitingGame = ({ game, config = {}, autoStart = true, className, style }) => {
        const containerRef = React.useRef(null);
        const gameInstanceRef = React.useRef(null);
        React.useEffect(() => {
            if (!containerRef.current)
                return;
            let gameInstance;
            switch (game) {
                case 'snake':
                    gameInstance = new Snake(containerRef.current, config);
                    break;
                case 'pong':
                    gameInstance = new Pong(containerRef.current, config);
                    break;
                case 'breakout':
                    gameInstance = new Breakout(containerRef.current, config);
                    break;
                case 'spaceinvaders':
                    gameInstance = new SpaceInvaders(containerRef.current, config);
                    break;
                case 'tetris':
                    gameInstance = new Tetris(containerRef.current, config);
                    break;
                case 'pacman':
                    gameInstance = new PacMan(containerRef.current, config);
                    break;
                case 'asteroids':
                    gameInstance = new Asteroids(containerRef.current, config);
                    break;
                case 'frogger':
                    gameInstance = new Frogger(containerRef.current, config);
                    break;
                default:
                    throw new Error(`Game type "${game}" not implemented`);
            }
            gameInstanceRef.current = gameInstance;
            if (autoStart) {
                gameInstance.start();
            }
            return () => {
                gameInstance.destroy();
            };
        }, [game, config, autoStart]);
        const handleStart = () => {
            var _a;
            (_a = gameInstanceRef.current) === null || _a === void 0 ? void 0 : _a.start();
        };
        const handleStop = () => {
            var _a;
            (_a = gameInstanceRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        };
        const handlePause = () => {
            var _a;
            (_a = gameInstanceRef.current) === null || _a === void 0 ? void 0 : _a.pause();
        };
        const handleResume = () => {
            var _a;
            (_a = gameInstanceRef.current) === null || _a === void 0 ? void 0 : _a.resume();
        };
        return (React.createElement("div", { className: className, style: style },
            React.createElement("div", { ref: containerRef }),
            !autoStart && (React.createElement("div", { style: { marginTop: '10px', textAlign: 'center' } },
                React.createElement("button", { onClick: handleStart }, "Start"),
                React.createElement("button", { onClick: handleStop, style: { marginLeft: '5px' } }, "Stop"),
                React.createElement("button", { onClick: handlePause, style: { marginLeft: '5px' } }, "Pause"),
                React.createElement("button", { onClick: handleResume, style: { marginLeft: '5px' } }, "Resume")))));
    };

    function createGame(game, container, config = {}) {
        switch (game) {
            case 'snake':
                return new Snake(container, config);
            case 'pong':
                return new Pong(container, config);
            case 'breakout':
                return new Breakout(container, config);
            case 'spaceinvaders':
                return new SpaceInvaders(container, config);
            case 'tetris':
                return new Tetris(container, config);
            case 'pacman':
                return new PacMan(container, config);
            case 'asteroids':
                return new Asteroids(container, config);
            case 'frogger':
                return new Frogger(container, config);
            default:
                throw new Error(`Game type "${game}" not implemented`);
        }
    }
    var index = {
        createGame,
        Snake,
        Pong,
        Breakout,
        SpaceInvaders,
        Tetris,
        PacMan,
        Asteroids,
        Frogger
    };

    exports.Asteroids = Asteroids;
    exports.Breakout = Breakout;
    exports.Frogger = Frogger;
    exports.PacMan = PacMan;
    exports.Pong = Pong;
    exports.Snake = Snake;
    exports.SpaceInvaders = SpaceInvaders;
    exports.Tetris = Tetris;
    exports.WaitingGame = WaitingGame;
    exports.createGame = createGame;
    exports.default = index;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
