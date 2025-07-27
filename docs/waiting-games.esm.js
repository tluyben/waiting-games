import React, { useRef, useEffect } from 'react';

class GameEngine {
    constructor(container, config = {}) {
        this.keys = {};
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
        this.keys[event.key] = true;
    }
    isKeyPressed(action, event) {
        const key = this.keyMap[action];
        return event.key === key || event.key.toLowerCase() === key.toLowerCase();
    }
    handleKeyUp(event) {
        event.preventDefault();
        this.keys[event.key] = false;
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
        this.lastMoveTime = 0;
        this.moveInterval = 200; // Move every 200ms
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
        // Only move snake at controlled intervals
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveInterval) {
            return;
        }
        this.lastMoveTime = currentTime;
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
        this.lastMoveTime = Date.now();
    }
}

class Pong extends GameEngine {
    constructor(container, config = {}) {
        super(container, config);
        this.leftScore = 0;
        this.rightScore = 0;
        this.gameState = 'waiting';
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
        // Only allow touch control of right paddle (human player)
        if (x > this.config.width / 2) {
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
        // AI for left paddle (computer player)
        const leftPaddleCenter = this.leftPaddle.y + this.leftPaddle.height / 2;
        const ballY = this.ball.y;
        const aiSpeed = this.leftPaddle.speed * 0.8; // Slightly slower than human for fairness
        if (ballY < leftPaddleCenter - 10) {
            this.leftPaddle.y -= aiSpeed;
        }
        else if (ballY > leftPaddleCenter + 10) {
            this.leftPaddle.y += aiSpeed;
        }
        // Human controls for right paddle
        if (this.config.useKeyboard) {
            if (this.isKeyPressed('UP', { key: Object.keys(this.keys).find(k => this.keys[k] && k === this.keyMap.UP) || '' }) || this.keys['w'] || this.keys['W']) {
                this.rightPaddle.y -= this.rightPaddle.speed;
            }
            if (this.isKeyPressed('DOWN', { key: Object.keys(this.keys).find(k => this.keys[k] && k === this.keyMap.DOWN) || '' }) || this.keys['s'] || this.keys['S']) {
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
                this.ctx.fillText('Use W/S or ↑/↓ to control right paddle', this.config.width / 2, this.config.height / 2 + 80);
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

class DonkeyKong extends GameEngine {
    constructor(container, config = {}) {
        const dkConfig = {
            ...config,
            width: config.width || 400,
            height: config.height || 500
        };
        super(container, dkConfig);
        this.platforms = [];
        this.ladders = [];
        this.barrels = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';
        this.barrelTimer = 0;
        this.gravity = 0.5;
        this.jumpPower = -12;
        this.initGame();
    }
    initGame() {
        this.mario = {
            x: 50,
            y: this.config.height - 80,
            vx: 0,
            vy: 0,
            width: 16,
            height: 24,
            onGround: false,
            climbing: false,
            facingRight: true
        };
        this.princess = {
            x: this.config.width - 60,
            y: 30,
            width: 16,
            height: 24
        };
        this.donkeyKong = {
            x: 50,
            y: 30,
            width: 32,
            height: 32
        };
        this.platforms = [];
        this.ladders = [];
        this.barrels = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';
        this.barrelTimer = 0;
        this.createLevel();
    }
    createLevel() {
        // Ground platform
        this.platforms.push({ x: 0, y: this.config.height - 20, width: this.config.width, height: 20 });
        // Level platforms (slanted construction site style)
        for (let level = 1; level <= 4; level++) {
            const y = this.config.height - 20 - (level * 100);
            const isEven = level % 2 === 0;
            if (isEven) {
                // Platform goes from left to right, slanted down
                this.platforms.push({ x: 0, y: y, width: this.config.width - 50, height: 10 });
            }
            else {
                // Platform goes from right to left, slanted down
                this.platforms.push({ x: 50, y: y, width: this.config.width - 50, height: 10 });
            }
            // Add ladders connecting levels
            if (level < 4) {
                const ladderX = isEven ? this.config.width - 70 : 70;
                this.ladders.push({ x: ladderX, y: y - 90, width: 16, height: 90 });
            }
        }
        // Top platform for princess and DK
        this.platforms.push({ x: 0, y: 60, width: this.config.width, height: 10 });
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
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.jump();
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
        this.mario.x;
        const marioScreenY = this.mario.y;
        // Touch controls
        if (x < this.config.width / 3) {
            this.keys['left'] = true;
        }
        else if (x > (2 * this.config.width) / 3) {
            this.keys['right'] = true;
        }
        else if (y < this.config.height / 2) {
            this.jump();
        }
        else {
            // Check for ladder climbing
            const deltaY = y - marioScreenY;
            if (Math.abs(deltaY) > 20) {
                this.keys[deltaY > 0 ? 'down' : 'up'] = true;
            }
        }
    }
    handleTouchEnd(event) {
        super.handleTouchEnd(event);
        this.keys['left'] = false;
        this.keys['right'] = false;
        this.keys['up'] = false;
        this.keys['down'] = false;
    }
    jump() {
        if (this.mario.onGround && !this.mario.climbing) {
            this.mario.vy = this.jumpPower;
            this.mario.onGround = false;
        }
    }
    checkPlatformCollision(x, y, width, height) {
        for (const platform of this.platforms) {
            if (x < platform.x + platform.width &&
                x + width > platform.x &&
                y < platform.y + platform.height &&
                y + height > platform.y) {
                return platform;
            }
        }
        return null;
    }
    checkLadderCollision(x, y, width, height) {
        for (const ladder of this.ladders) {
            if (x < ladder.x + ladder.width &&
                x + width > ladder.x &&
                y < ladder.y + ladder.height &&
                y + height > ladder.y) {
                return ladder;
            }
        }
        return null;
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        // Spawn barrels
        this.barrelTimer++;
        if (this.barrelTimer > 120) {
            this.spawnBarrel();
            this.barrelTimer = 0;
        }
        this.updateMario();
        this.updateBarrels();
        this.checkCollisions();
    }
    updateMario() {
        // Handle input
        const onLadder = this.checkLadderCollision(this.mario.x, this.mario.y, this.mario.width, this.mario.height);
        if (onLadder) {
            if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['up']) {
                this.mario.climbing = true;
                this.mario.vy = -2;
                this.mario.vx = 0;
            }
            else if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S'] || this.keys['down']) {
                this.mario.climbing = true;
                this.mario.vy = 2;
                this.mario.vx = 0;
            }
            else if (this.mario.climbing) {
                this.mario.vy = 0;
            }
        }
        else {
            this.mario.climbing = false;
        }
        if (!this.mario.climbing) {
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['left']) {
                this.mario.vx = -3;
                this.mario.facingRight = false;
            }
            else if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['right']) {
                this.mario.vx = 3;
                this.mario.facingRight = true;
            }
            else {
                this.mario.vx = 0;
            }
            // Apply gravity
            if (!this.mario.onGround) {
                this.mario.vy += this.gravity;
            }
        }
        // Update position
        const newX = this.mario.x + this.mario.vx;
        const newY = this.mario.y + this.mario.vy;
        // Horizontal collision
        if (!this.checkPlatformCollision(newX, this.mario.y, this.mario.width, this.mario.height)) {
            this.mario.x = Math.max(0, Math.min(this.config.width - this.mario.width, newX));
        }
        // Vertical collision
        this.mario.onGround = false;
        const platformHit = this.checkPlatformCollision(this.mario.x, newY, this.mario.width, this.mario.height);
        if (platformHit) {
            if (this.mario.vy > 0) { // Falling down
                this.mario.y = platformHit.y - this.mario.height;
                this.mario.vy = 0;
                this.mario.onGround = true;
            }
            else if (this.mario.vy < 0) { // Jumping up
                this.mario.y = platformHit.y + platformHit.height;
                this.mario.vy = 0;
            }
        }
        else {
            this.mario.y = newY;
        }
        // Prevent falling off screen
        if (this.mario.y > this.config.height) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
            }
            else {
                this.resetMario();
            }
        }
    }
    resetMario() {
        this.mario.x = 50;
        this.mario.y = this.config.height - 80;
        this.mario.vx = 0;
        this.mario.vy = 0;
        this.mario.onGround = false;
        this.mario.climbing = false;
    }
    spawnBarrel() {
        this.barrels.push({
            x: this.donkeyKong.x + this.donkeyKong.width,
            y: this.donkeyKong.y + this.donkeyKong.height,
            vx: 2,
            vy: 0,
            width: 12,
            height: 12,
            onGround: false,
            active: true
        });
    }
    updateBarrels() {
        for (const barrel of this.barrels) {
            if (!barrel.active)
                continue;
            // Apply gravity
            if (!barrel.onGround) {
                barrel.vy += this.gravity;
            }
            // Update position
            const newX = barrel.x + barrel.vx;
            const newY = barrel.y + barrel.vy;
            // Platform collision
            barrel.onGround = false;
            const platformHit = this.checkPlatformCollision(newX, newY, barrel.width, barrel.height);
            if (platformHit && barrel.vy >= 0) {
                barrel.y = platformHit.y - barrel.height;
                barrel.vy = 0;
                barrel.onGround = true;
                barrel.x = newX;
                // Bounce at platform edges
                if (barrel.x <= platformHit.x || barrel.x + barrel.width >= platformHit.x + platformHit.width) {
                    barrel.vx *= -1;
                }
            }
            else {
                barrel.x = newX;
                barrel.y = newY;
            }
            // Remove barrels that fall off screen
            if (barrel.y > this.config.height) {
                barrel.active = false;
            }
        }
        // Clean up inactive barrels
        this.barrels = this.barrels.filter(barrel => barrel.active);
    }
    checkCollisions() {
        // Mario vs barrels
        for (const barrel of this.barrels) {
            if (!barrel.active)
                continue;
            if (this.mario.x < barrel.x + barrel.width &&
                this.mario.x + this.mario.width > barrel.x &&
                this.mario.y < barrel.y + barrel.height &&
                this.mario.y + this.mario.height > barrel.y) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
                else {
                    this.resetMario();
                }
                return;
            }
        }
        // Mario vs princess (win condition)
        if (this.mario.x < this.princess.x + this.princess.width &&
            this.mario.x + this.mario.width > this.princess.x &&
            this.mario.y < this.princess.y + this.princess.height &&
            this.mario.y + this.mario.height > this.princess.y) {
            this.gameState = 'won';
            this.score += 1000;
        }
    }
    render() {
        this.ctx.fillStyle = '#000080';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw platforms
        this.ctx.fillStyle = '#8B4513';
        for (const platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
        // Draw ladders
        this.ctx.fillStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        for (const ladder of this.ladders) {
            this.ctx.strokeStyle = '#FFD700';
            for (let y = ladder.y; y < ladder.y + ladder.height; y += 10) {
                this.ctx.beginPath();
                this.ctx.moveTo(ladder.x, y);
                this.ctx.lineTo(ladder.x + ladder.width, y);
                this.ctx.stroke();
            }
            // Side rails
            this.ctx.beginPath();
            this.ctx.moveTo(ladder.x, ladder.y);
            this.ctx.lineTo(ladder.x, ladder.y + ladder.height);
            this.ctx.moveTo(ladder.x + ladder.width, ladder.y);
            this.ctx.lineTo(ladder.x + ladder.width, ladder.y + ladder.height);
            this.ctx.stroke();
        }
        // Draw Donkey Kong
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.donkeyKong.x, this.donkeyKong.y, this.donkeyKong.width, this.donkeyKong.height);
        // DK face
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.donkeyKong.x + 5, this.donkeyKong.y + 5, 4, 4);
        this.ctx.fillRect(this.donkeyKong.x + 23, this.donkeyKong.y + 5, 4, 4);
        // Draw princess
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.fillRect(this.princess.x, this.princess.y, this.princess.width, this.princess.height);
        // Draw Mario
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.mario.x, this.mario.y, this.mario.width, this.mario.height);
        // Mario hat
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.mario.x, this.mario.y, this.mario.width, 8);
        // Mario face
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.fillRect(this.mario.x + 2, this.mario.y + 8, this.mario.width - 4, 8);
        // Draw barrels
        this.ctx.fillStyle = '#8B4513';
        for (const barrel of this.barrels) {
            if (barrel.active) {
                this.ctx.fillRect(barrel.x, barrel.y, barrel.width, barrel.height);
                // Barrel stripes
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(barrel.x, barrel.y + 3);
                this.ctx.lineTo(barrel.x + barrel.width, barrel.y + 3);
                this.ctx.moveTo(barrel.x, barrel.y + 9);
                this.ctx.lineTo(barrel.x + barrel.width, barrel.y + 9);
                this.ctx.stroke();
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
        else if (this.gameState === 'won') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Rescued the Princess!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
            this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
            this.ctx.textAlign = 'left';
        }
        else if (this.config.useMobile) {
            // Mobile control hints
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(10, this.config.height - 60, 60, 50);
            this.ctx.fillRect(this.config.width - 70, this.config.height - 60, 60, 50);
            this.ctx.fillRect(this.config.width / 2 - 30, 10, 60, 50);
            this.ctx.fillRect(this.config.width / 2 - 30, this.config.height - 120, 60, 50);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('←', 40, this.config.height - 30);
            this.ctx.fillText('→', this.config.width - 40, this.config.height - 30);
            this.ctx.fillText('JUMP', this.config.width / 2, 35);
            this.ctx.fillText('↕', this.config.width / 2, this.config.height - 90);
            this.ctx.textAlign = 'left';
        }
    }
}

class Qbert extends GameEngine {
    constructor(container, config = {}) {
        const qbertConfig = {
            ...config,
            width: config.width || 450,
            height: config.height || 400
        };
        super(container, qbertConfig);
        this.cubes = [];
        this.enemies = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.pyramidSize = 7;
        this.cubeSize = 40;
        this.jumpDuration = 20;
        this.enemySpawnTimer = 0;
        this.initGame();
    }
    initGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.enemySpawnTimer = 0;
        this.initLevel();
    }
    initLevel() {
        this.enemies = [];
        this.createPyramid();
        this.qbert = {
            cubeX: 0,
            cubeY: 0,
            x: 0,
            y: 0,
            isJumping: false,
            jumpProgress: 0,
            targetX: 0,
            targetY: 0
        };
        this.updateQBertPosition();
    }
    createPyramid() {
        this.cubes = [];
        const offsetX = this.config.width / 2;
        const offsetY = 50;
        for (let row = 0; row < this.pyramidSize; row++) {
            this.cubes[row] = [];
            for (let col = 0; col <= row; col++) {
                const isoX = (col - row / 2) * this.cubeSize;
                const isoY = row * this.cubeSize * 0.5;
                this.cubes[row][col] = {
                    x: offsetX + isoX,
                    y: offsetY + isoY,
                    color: 0,
                    targetColor: this.level % 3 + 1,
                    isActive: true
                };
            }
        }
    }
    updateQBertPosition() {
        if (this.qbert.cubeY >= 0 && this.qbert.cubeY < this.cubes.length &&
            this.qbert.cubeX >= 0 && this.qbert.cubeX < this.cubes[this.qbert.cubeY].length) {
            const cube = this.cubes[this.qbert.cubeY][this.qbert.cubeX];
            this.qbert.x = cube.x;
            this.qbert.y = cube.y - 20;
        }
    }
    isValidPosition(cubeX, cubeY) {
        return cubeY >= 0 && cubeY < this.cubes.length &&
            cubeX >= 0 && cubeX < this.cubes[cubeY].length;
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
        if (this.qbert.isJumping)
            return;
        // Diagonal movement for Q*bert
        if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
            this.moveQBert(-1, -1); // Up-left
        }
        else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
            this.moveQBert(1, 1); // Down-right
        }
        else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
            this.moveQBert(0, -1); // Up-right
        }
        else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
            this.moveQBert(-1, 0); // Down-left
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
        if (this.qbert.isJumping)
            return;
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const centerX = this.config.width / 2;
        const centerY = this.config.height / 2;
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        // Diagonal touch controls
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.moveQBert(-1, 0); // Down-left
            }
            else {
                this.moveQBert(0, -1); // Up-right
            }
        }
        else {
            if (deltaY > 0) {
                this.moveQBert(1, 1); // Down-right
            }
            else {
                this.moveQBert(-1, -1); // Up-left
            }
        }
    }
    moveQBert(deltaX, deltaY) {
        const newCubeX = this.qbert.cubeX + deltaX;
        const newCubeY = this.qbert.cubeY + deltaY;
        if (this.isValidPosition(newCubeX, newCubeY)) {
            this.qbert.cubeX = newCubeX;
            this.qbert.cubeY = newCubeY;
            this.startJump();
            // Change cube color
            const cube = this.cubes[newCubeY][newCubeX];
            cube.color = (cube.color + 1) % 4;
            // Score points
            this.score += 25;
            this.checkWinCondition();
        }
        else {
            // Jumped off pyramid
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
            }
            else {
                this.resetQBert();
            }
        }
    }
    startJump() {
        this.qbert.isJumping = true;
        this.qbert.jumpProgress = 0;
        this.qbert.targetX = this.cubes[this.qbert.cubeY][this.qbert.cubeX].x;
        this.qbert.targetY = this.cubes[this.qbert.cubeY][this.qbert.cubeX].y - 20;
    }
    resetQBert() {
        this.qbert.cubeX = 0;
        this.qbert.cubeY = 0;
        this.qbert.isJumping = false;
        this.qbert.jumpProgress = 0;
        this.updateQBertPosition();
    }
    spawnEnemy() {
        const types = ['coily', 'wrongway', 'ugg'];
        const type = types[Math.floor(Math.random() * types.length)];
        const colors = {
            coily: '#800080',
            wrongway: '#ff0000',
            ugg: '#00ff00'
        };
        this.enemies.push({
            cubeX: Math.floor(Math.random() * this.cubes[this.pyramidSize - 1].length),
            cubeY: this.pyramidSize - 1,
            x: 0,
            y: 0,
            type: type,
            color: colors[type],
            moveTimer: 60 + Math.random() * 120,
            isJumping: false,
            jumpProgress: 0,
            targetX: 0,
            targetY: 0
        });
    }
    updateEnemies() {
        for (const enemy of this.enemies) {
            if (enemy.isJumping) {
                enemy.jumpProgress++;
                if (enemy.jumpProgress >= this.jumpDuration) {
                    enemy.isJumping = false;
                    enemy.x = enemy.targetX;
                    enemy.y = enemy.targetY;
                }
                else {
                    const progress = enemy.jumpProgress / this.jumpDuration;
                    const jumpHeight = Math.sin(progress * Math.PI) * 15;
                    enemy.x = enemy.x + (enemy.targetX - enemy.x) * progress;
                    enemy.y = enemy.y + (enemy.targetY - enemy.y) * progress - jumpHeight;
                }
            }
            else {
                enemy.moveTimer--;
                if (enemy.moveTimer <= 0) {
                    this.moveEnemy(enemy);
                    enemy.moveTimer = 60 + Math.random() * 120;
                }
                // Update enemy position to match cube
                if (this.isValidPosition(enemy.cubeX, enemy.cubeY)) {
                    const cube = this.cubes[enemy.cubeY][enemy.cubeX];
                    enemy.x = cube.x;
                    enemy.y = cube.y - 20;
                }
            }
        }
        // Remove enemies that fell off
        this.enemies = this.enemies.filter(enemy => this.isValidPosition(enemy.cubeX, enemy.cubeY));
    }
    moveEnemy(enemy) {
        const moves = [
            { dx: -1, dy: -1 }, // Up-left
            { dx: 1, dy: 1 }, // Down-right
            { dx: 0, dy: -1 }, // Up-right
            { dx: -1, dy: 0 } // Down-left
        ];
        const validMoves = moves.filter(move => this.isValidPosition(enemy.cubeX + move.dx, enemy.cubeY + move.dy));
        if (validMoves.length > 0) {
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            enemy.cubeX += move.dx;
            enemy.cubeY += move.dy;
            enemy.isJumping = true;
            enemy.jumpProgress = 0;
            enemy.targetX = this.cubes[enemy.cubeY][enemy.cubeX].x;
            enemy.targetY = this.cubes[enemy.cubeY][enemy.cubeX].y - 20;
        }
    }
    checkCollisions() {
        for (const enemy of this.enemies) {
            if (enemy.cubeX === this.qbert.cubeX && enemy.cubeY === this.qbert.cubeY) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
                else {
                    this.resetQBert();
                }
                return;
            }
        }
    }
    checkWinCondition() {
        let allCorrect = true;
        for (let row = 0; row < this.cubes.length; row++) {
            for (let col = 0; col < this.cubes[row].length; col++) {
                const cube = this.cubes[row][col];
                if (cube.color !== cube.targetColor) {
                    allCorrect = false;
                    break;
                }
            }
            if (!allCorrect)
                break;
        }
        if (allCorrect) {
            this.level++;
            this.score += 1000;
            this.initLevel();
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        // Update Q*bert jumping
        if (this.qbert.isJumping) {
            this.qbert.jumpProgress++;
            if (this.qbert.jumpProgress >= this.jumpDuration) {
                this.qbert.isJumping = false;
                this.qbert.x = this.qbert.targetX;
                this.qbert.y = this.qbert.targetY;
            }
            else {
                const progress = this.qbert.jumpProgress / this.jumpDuration;
                const jumpHeight = Math.sin(progress * Math.PI) * 20;
                this.qbert.x = this.qbert.x + (this.qbert.targetX - this.qbert.x) * progress;
                this.qbert.y = this.qbert.y + (this.qbert.targetY - this.qbert.y) * progress - jumpHeight;
            }
        }
        // Spawn enemies
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer > 180) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        this.updateEnemies();
        this.checkCollisions();
    }
    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw pyramid cubes
        for (let row = 0; row < this.cubes.length; row++) {
            for (let col = 0; col < this.cubes[row].length; col++) {
                const cube = this.cubes[row][col];
                this.drawCube(cube.x, cube.y, cube.color, cube.targetColor);
            }
        }
        // Draw Q*bert
        this.ctx.fillStyle = '#ff8800';
        this.ctx.beginPath();
        this.ctx.arc(this.qbert.x + 10, this.qbert.y + 10, 8, 0, Math.PI * 2);
        this.ctx.fill();
        // Q*bert's nose
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(this.qbert.x + 13, this.qbert.y + 8, 3, 0, Math.PI * 2);
        this.ctx.fill();
        // Draw enemies
        for (const enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x + 10, enemy.y + 10, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // UI
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Level: ${this.level}`, 10, 65);
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
            this.ctx.fillRect(this.config.width / 2 - 80, this.config.height - 80, 40, 40);
            this.ctx.fillRect(this.config.width / 2 + 40, this.config.height - 80, 40, 40);
            this.ctx.fillRect(this.config.width / 2 - 80, this.config.height - 120, 40, 40);
            this.ctx.fillRect(this.config.width / 2 + 40, this.config.height - 120, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('↖', this.config.width / 2 - 60, this.config.height - 95);
            this.ctx.fillText('↗', this.config.width / 2 + 60, this.config.height - 95);
            this.ctx.fillText('↙', this.config.width / 2 - 60, this.config.height - 55);
            this.ctx.fillText('↘', this.config.width / 2 + 60, this.config.height - 55);
            this.ctx.textAlign = 'left';
        }
    }
    drawCube(x, y, color, targetColor) {
        const colors = ['#888888', '#ff0000', '#00ff00', '#0000ff'];
        // Main cube face
        this.ctx.fillStyle = colors[color];
        this.ctx.fillRect(x - 15, y - 10, 30, 20);
        // Cube edges for 3D effect
        this.ctx.fillStyle = this.darkenColor(colors[color]);
        // Right face
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y - 10);
        this.ctx.lineTo(x + 25, y - 15);
        this.ctx.lineTo(x + 25, y + 5);
        this.ctx.lineTo(x + 15, y + 10);
        this.ctx.fill();
        // Top face
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y - 10);
        this.ctx.lineTo(x - 5, y - 15);
        this.ctx.lineTo(x + 25, y - 15);
        this.ctx.lineTo(x + 15, y - 10);
        this.ctx.fill();
        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 15, y - 10, 30, 20);
        // Target color indicator
        if (color !== targetColor) {
            this.ctx.fillStyle = colors[targetColor];
            this.ctx.fillRect(x - 5, y - 5, 10, 10);
            this.ctx.strokeStyle = '#000';
            this.ctx.strokeRect(x - 5, y - 5, 10, 10);
        }
    }
    darkenColor(color) {
        // Simple color darkening
        const colorMap = {
            '#888888': '#666666',
            '#ff0000': '#cc0000',
            '#00ff00': '#00cc00',
            '#0000ff': '#0000cc'
        };
        return colorMap[color] || color;
    }
}

class Kaboom extends GameEngine {
    constructor(container, config = {}) {
        const kaboomConfig = {
            ...config,
            width: config.width || 400,
            height: config.height || 500
        };
        super(container, kaboomConfig);
        this.bombs = [];
        this.explosions = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.bombSpawnTimer = 0;
        this.bombSpawnRate = 60;
        this.speedMultiplier = 1;
        this.initGame();
    }
    initGame() {
        this.bucket = {
            x: this.config.width / 2 - 30,
            y: this.config.height - 60,
            width: 60,
            height: 40,
            speed: 8
        };
        this.bombs = [];
        this.explosions = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.bombSpawnTimer = 0;
        this.bombSpawnRate = 60;
        this.speedMultiplier = 1;
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
        // Move bucket to touch position
        this.bucket.x = x - this.bucket.width / 2;
        this.clampBucket();
    }
    handleTouchMove(event) {
        super.handleTouchMove(event);
        this.handleTouchStart(event);
    }
    clampBucket() {
        this.bucket.x = Math.max(0, Math.min(this.config.width - this.bucket.width, this.bucket.x));
    }
    spawnBomb() {
        const types = ['normal', 'fast', 'heavy'];
        const type = types[Math.floor(Math.random() * types.length)];
        let speed;
        let color;
        let size;
        switch (type) {
            case 'fast':
                speed = 4 * this.speedMultiplier;
                color = '#ff4444';
                size = 8;
                break;
            case 'heavy':
                speed = 1.5 * this.speedMultiplier;
                color = '#444444';
                size = 16;
                break;
            default: // normal
                speed = 2.5 * this.speedMultiplier;
                color = '#000000';
                size = 12;
                break;
        }
        this.bombs.push({
            x: Math.random() * (this.config.width - size),
            y: -size,
            speed: speed,
            type: type,
            color: color,
            size: size,
            active: true
        });
    }
    createExplosion(x, y, size) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: size * 2,
            active: true
        });
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        // Handle bucket movement
        if (this.config.useKeyboard) {
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.bucket.x -= this.bucket.speed;
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.bucket.x += this.bucket.speed;
            }
        }
        this.clampBucket();
        // Spawn bombs
        this.bombSpawnTimer++;
        if (this.bombSpawnTimer >= this.bombSpawnRate) {
            this.spawnBomb();
            this.bombSpawnTimer = 0;
        }
        // Update bombs
        for (const bomb of this.bombs) {
            if (!bomb.active)
                continue;
            bomb.y += bomb.speed;
            // Check if bomb reached ground
            if (bomb.y > this.config.height) {
                bomb.active = false;
                this.createExplosion(bomb.x + bomb.size / 2, this.config.height - 20, bomb.size);
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
            }
        }
        // Check bomb-bucket collisions
        for (const bomb of this.bombs) {
            if (!bomb.active)
                continue;
            if (bomb.x < this.bucket.x + this.bucket.width &&
                bomb.x + bomb.size > this.bucket.x &&
                bomb.y < this.bucket.y + this.bucket.height &&
                bomb.y + bomb.size > this.bucket.y) {
                bomb.active = false;
                // Score based on bomb type
                switch (bomb.type) {
                    case 'fast':
                        this.score += 30;
                        break;
                    case 'heavy':
                        this.score += 50;
                        break;
                    default:
                        this.score += 20;
                        break;
                }
                // Level progression
                if (this.score > this.level * 500) {
                    this.level++;
                    this.speedMultiplier += 0.2;
                    this.bombSpawnRate = Math.max(20, this.bombSpawnRate - 5);
                }
            }
        }
        // Update explosions
        for (const explosion of this.explosions) {
            if (!explosion.active)
                continue;
            explosion.radius += 2;
            if (explosion.radius >= explosion.maxRadius) {
                explosion.active = false;
            }
        }
        // Clean up inactive objects
        this.bombs = this.bombs.filter(bomb => bomb.active);
        this.explosions = this.explosions.filter(explosion => explosion.active);
    }
    render() {
        // Sky gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);
        // Draw bucket
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.bucket.x, this.bucket.y, this.bucket.width, this.bucket.height);
        // Bucket rim
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.bucket.x, this.bucket.y, this.bucket.width, this.bucket.height);
        // Bucket handle
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.bucket.x - 5, this.bucket.y + 10, 8, 0, Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(this.bucket.x + this.bucket.width + 5, this.bucket.y + 10, 8, 0, Math.PI);
        this.ctx.stroke();
        // Draw bombs
        for (const bomb of this.bombs) {
            if (!bomb.active)
                continue;
            this.ctx.fillStyle = bomb.color;
            this.ctx.beginPath();
            this.ctx.arc(bomb.x + bomb.size / 2, bomb.y + bomb.size / 2, bomb.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            // Bomb fuse
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(bomb.x + bomb.size / 2, bomb.y);
            this.ctx.lineTo(bomb.x + bomb.size / 2 - 3, bomb.y - 8);
            this.ctx.stroke();
            // Spark on fuse
            this.ctx.fillStyle = '#FF4500';
            this.ctx.beginPath();
            this.ctx.arc(bomb.x + bomb.size / 2 - 3, bomb.y - 8, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Draw explosions
        for (const explosion of this.explosions) {
            if (!explosion.active)
                continue;
            const alpha = 1 - (explosion.radius / explosion.maxRadius);
            this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            // Inner explosion core
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // UI
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 55);
        this.ctx.fillText(`Level: ${this.level}`, 10, 80);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('KABOOM!', this.config.width / 2, this.config.height / 2 - 40);
            this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 30);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 60);
            this.ctx.textAlign = 'left';
        }
        else if (this.config.useMobile) {
            // Mobile control hints
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(10, this.config.height - 120, this.config.width - 20, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Touch to move bucket and catch bombs!', this.config.width / 2, this.config.height - 95);
            this.ctx.textAlign = 'left';
        }
        // Draw instructions at start
        if (this.score === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(50, 120, this.config.width - 100, 100);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Catch the falling bombs!', this.config.width / 2, 150);
            this.ctx.fillText('Use A/D or ←/→ to move', this.config.width / 2, 175);
            this.ctx.fillText('Don\'t let them hit the ground!', this.config.width / 2, 200);
            this.ctx.textAlign = 'left';
        }
    }
}

class Adventure extends GameEngine {
    constructor(container, config = {}) {
        const adventureConfig = {
            ...config,
            width: config.width || 400,
            height: config.height || 300
        };
        super(container, adventureConfig);
        this.rooms = [];
        this.currentRoom = 0;
        this.score = 0;
        this.gameState = 'playing';
        this.gameWon = false;
        this.initGame();
    }
    initGame() {
        this.player = {
            x: 50,
            y: this.config.height / 2,
            width: 12,
            height: 12,
            speed: 3,
            hasKey: false,
            hasSword: false
        };
        this.currentRoom = 0;
        this.score = 0;
        this.gameState = 'playing';
        this.gameWon = false;
        this.createRooms();
    }
    createRooms() {
        this.rooms = [];
        // Room 0: Starting room with key
        this.rooms.push({
            walls: [
                // Outer walls
                { x: 0, y: 0, width: this.config.width, height: 10 },
                { x: 0, y: 0, width: 10, height: this.config.height },
                { x: this.config.width - 10, y: 0, width: 10, height: this.config.height },
                { x: 0, y: this.config.height - 10, width: this.config.width, height: 10 },
                // Exit gap on right
            ],
            items: [
                { x: 100, y: 100, width: 8, height: 8, type: 'key', collected: false, color: '#FFD700' }
            ],
            dragons: [],
            color: '#87CEEB'
        });
        // Room 1: Dragon room with sword
        this.rooms.push({
            walls: [
                { x: 0, y: 0, width: this.config.width, height: 10 },
                { x: 0, y: 0, width: 10, height: this.config.height },
                { x: this.config.width - 10, y: 0, width: 10, height: this.config.height },
                { x: 0, y: this.config.height - 10, width: this.config.width, height: 10 },
                // Maze walls
                { x: 100, y: 50, width: 10, height: 100 },
                { x: 200, y: 100, width: 10, height: 150 },
            ],
            items: [
                { x: 300, y: 50, width: 8, height: 16, type: 'sword', collected: false, color: '#C0C0C0' }
            ],
            dragons: [
                { x: 150, y: 120, width: 20, height: 20, vx: 1, vy: 1, alive: true, chaseTimer: 0 }
            ],
            color: '#DDA0DD'
        });
        // Room 2: Treasure room with chalice
        this.rooms.push({
            walls: [
                { x: 0, y: 0, width: this.config.width, height: 10 },
                { x: 0, y: 0, width: 10, height: this.config.height },
                { x: this.config.width - 10, y: 0, width: 10, height: this.config.height },
                { x: 0, y: this.config.height - 10, width: this.config.width, height: 10 },
                // Locked door (requires key)
                { x: 0, y: this.config.height / 2 - 30, width: 10, height: 60 },
            ],
            items: [
                { x: this.config.width / 2, y: this.config.height / 2, width: 12, height: 16, type: 'chalice', collected: false, color: '#FFD700' }
            ],
            dragons: [],
            color: '#98FB98'
        });
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
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.attackDragon();
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
        const deltaX = x - (this.player.x + this.player.width / 2);
        const deltaY = y - (this.player.y + this.player.height / 2);
        // Attack if touching near player
        if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
            this.attackDragon();
            return;
        }
        // Move toward touch
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.keys['touchLeft'] = deltaX < 0;
            this.keys['touchRight'] = deltaX > 0;
            this.keys['touchUp'] = false;
            this.keys['touchDown'] = false;
        }
        else {
            this.keys['touchUp'] = deltaY < 0;
            this.keys['touchDown'] = deltaY > 0;
            this.keys['touchLeft'] = false;
            this.keys['touchRight'] = false;
        }
    }
    handleTouchEnd(event) {
        super.handleTouchEnd(event);
        this.keys['touchLeft'] = false;
        this.keys['touchRight'] = false;
        this.keys['touchUp'] = false;
        this.keys['touchDown'] = false;
    }
    attackDragon() {
        if (!this.player.hasSword)
            return;
        const room = this.rooms[this.currentRoom];
        for (const dragon of room.dragons) {
            if (!dragon.alive)
                continue;
            const distance = Math.sqrt(Math.pow(this.player.x - dragon.x, 2) +
                Math.pow(this.player.y - dragon.y, 2));
            if (distance < 40) {
                dragon.alive = false;
                this.score += 100;
            }
        }
    }
    checkWallCollision(x, y, width, height) {
        const room = this.rooms[this.currentRoom];
        for (const wall of room.walls) {
            // Special case: locked door in room 2
            if (this.currentRoom === 2 && wall.x === 0 && wall.width === 10 && !this.player.hasKey) {
                if (x < wall.x + wall.width &&
                    x + width > wall.x &&
                    y < wall.y + wall.height &&
                    y + height > wall.y) {
                    return true;
                }
            }
            else if (!(this.currentRoom === 2 && wall.x === 0 && wall.width === 10)) {
                // Normal wall collision
                if (x < wall.x + wall.width &&
                    x + width > wall.x &&
                    y < wall.y + wall.height &&
                    y + height > wall.y) {
                    return true;
                }
            }
        }
        return false;
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        // Player movement
        let newX = this.player.x;
        let newY = this.player.y;
        if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['touchLeft']) {
            newX -= this.player.speed;
        }
        if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['touchRight']) {
            newX += this.player.speed;
        }
        if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['touchUp']) {
            newY -= this.player.speed;
        }
        if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S'] || this.keys['touchDown']) {
            newY += this.player.speed;
        }
        // Check wall collisions
        if (!this.checkWallCollision(newX, this.player.y, this.player.width, this.player.height)) {
            this.player.x = newX;
        }
        if (!this.checkWallCollision(this.player.x, newY, this.player.width, this.player.height)) {
            this.player.y = newY;
        }
        // Check room transitions
        if (this.player.x >= this.config.width - this.player.width) {
            if (this.currentRoom < this.rooms.length - 1) {
                this.currentRoom++;
                this.player.x = 10;
            }
        }
        else if (this.player.x <= 0) {
            if (this.currentRoom > 0) {
                this.currentRoom--;
                this.player.x = this.config.width - this.player.width - 10;
            }
        }
        // Update dragons
        const room = this.rooms[this.currentRoom];
        for (const dragon of room.dragons) {
            if (!dragon.alive)
                continue;
            // Simple AI: move toward player occasionally
            dragon.chaseTimer++;
            if (dragon.chaseTimer > 60) {
                if (this.player.x > dragon.x)
                    dragon.vx = Math.abs(dragon.vx);
                else
                    dragon.vx = -Math.abs(dragon.vx);
                if (this.player.y > dragon.y)
                    dragon.vy = Math.abs(dragon.vy);
                else
                    dragon.vy = -Math.abs(dragon.vy);
                dragon.chaseTimer = 0;
            }
            // Move dragon
            let newDragonX = dragon.x + dragon.vx;
            let newDragonY = dragon.y + dragon.vy;
            // Bounce off walls
            if (this.checkWallCollision(newDragonX, dragon.y, dragon.width, dragon.height)) {
                dragon.vx *= -1;
                newDragonX = dragon.x;
            }
            if (this.checkWallCollision(dragon.x, newDragonY, dragon.width, dragon.height)) {
                dragon.vy *= -1;
                newDragonY = dragon.y;
            }
            dragon.x = newDragonX;
            dragon.y = newDragonY;
            // Check dragon-player collision
            if (this.player.x < dragon.x + dragon.width &&
                this.player.x + this.player.width > dragon.x &&
                this.player.y < dragon.y + dragon.height &&
                this.player.y + this.player.height > dragon.y) {
                this.gameState = 'gameOver';
            }
        }
        // Check item collection
        for (const item of room.items) {
            if (item.collected)
                continue;
            if (this.player.x < item.x + item.width &&
                this.player.x + this.player.width > item.x &&
                this.player.y < item.y + item.height &&
                this.player.y + this.player.height > item.y) {
                item.collected = true;
                switch (item.type) {
                    case 'key':
                        this.player.hasKey = true;
                        this.score += 50;
                        break;
                    case 'sword':
                        this.player.hasSword = true;
                        this.score += 75;
                        break;
                    case 'chalice':
                        this.score += 200;
                        this.gameState = 'won';
                        break;
                }
            }
        }
    }
    render() {
        const room = this.rooms[this.currentRoom];
        // Room background
        this.ctx.fillStyle = room.color;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw walls
        this.ctx.fillStyle = '#8B4513';
        for (const wall of room.walls) {
            // Special rendering for locked door
            if (this.currentRoom === 2 && wall.x === 0 && wall.width === 10 && !this.player.hasKey) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                this.ctx.fillStyle = '#8B4513';
            }
            else if (!(this.currentRoom === 2 && wall.x === 0 && wall.width === 10)) {
                this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            }
        }
        // Draw items
        for (const item of room.items) {
            if (item.collected)
                continue;
            this.ctx.fillStyle = item.color;
            switch (item.type) {
                case 'key':
                    // Draw key shape
                    this.ctx.fillRect(item.x, item.y + 2, 6, 2);
                    this.ctx.fillRect(item.x, item.y, 2, 6);
                    this.ctx.fillRect(item.x + 4, item.y + 4, 2, 2);
                    break;
                case 'sword':
                    // Draw sword shape
                    this.ctx.fillRect(item.x + 3, item.y, 2, 12);
                    this.ctx.fillRect(item.x + 1, item.y + 12, 6, 2);
                    this.ctx.fillRect(item.x + 3, item.y + 14, 2, 2);
                    break;
                case 'chalice':
                    // Draw chalice shape
                    this.ctx.fillRect(item.x + 2, item.y + 8, 8, 2);
                    this.ctx.fillRect(item.x + 4, item.y + 10, 4, 6);
                    this.ctx.fillRect(item.x + 1, item.y, 10, 8);
                    break;
            }
        }
        // Draw dragons
        for (const dragon of room.dragons) {
            if (!dragon.alive)
                continue;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(dragon.x, dragon.y, dragon.width, dragon.height);
            // Dragon eyes
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillRect(dragon.x + 3, dragon.y + 3, 3, 3);
            this.ctx.fillRect(dragon.x + 14, dragon.y + 3, 3, 3);
            // Dragon spikes
            this.ctx.fillStyle = '#8B0000';
            for (let i = 0; i < 4; i++) {
                this.ctx.fillRect(dragon.x + i * 5, dragon.y - 2, 2, 4);
            }
        }
        // Draw player
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Player face
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, 8, 6);
        // Player eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 3, 1, 1);
        this.ctx.fillRect(this.player.x + 8, this.player.y + 3, 1, 1);
        // Draw inventory indicators
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Room: ${this.currentRoom + 1}`, 10, 20);
        this.ctx.fillText(`Score: ${this.score}`, 10, 35);
        if (this.player.hasKey) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('🗝️', this.config.width - 60, 20);
        }
        if (this.player.hasSword) {
            this.ctx.fillStyle = '#C0C0C0';
            this.ctx.fillText('⚔️', this.config.width - 40, 20);
        }
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('The Dragon Got You!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 35);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'won') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Found the Chalice!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
            this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 35);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, 60, this.config.width - 40, 80);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Find the key, get the sword,', this.config.width / 2, 85);
            this.ctx.fillText('slay the dragon, find the chalice!', this.config.width / 2, 100);
            this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, 120);
            this.ctx.fillText('Attack: Space (when you have sword)', this.config.width / 2, 135);
            this.ctx.textAlign = 'left';
        }
    }
}

class MissileCommand extends GameEngine {
    constructor(container, config = {}) {
        const missileConfig = {
            ...config,
            width: config.width || 500,
            height: config.height || 400
        };
        super(container, missileConfig);
        this.cities = [];
        this.missiles = [];
        this.defenseMissiles = [];
        this.explosions = [];
        this.batteries = [];
        this.score = 0;
        this.level = 1;
        this.gameState = 'playing';
        this.missileSpawnTimer = 0;
        this.missileSpawnRate = 120;
        this.crosshair = { x: 200, y: 150 };
        this.initGame();
    }
    initGame() {
        this.score = 0;
        this.level = 1;
        this.gameState = 'playing';
        this.missileSpawnTimer = 0;
        this.missileSpawnRate = 120;
        this.crosshair = { x: this.config.width / 2, y: this.config.height / 2 };
        this.initLevel();
    }
    initLevel() {
        this.missiles = [];
        this.defenseMissiles = [];
        this.explosions = [];
        // Create cities
        this.cities = [];
        const cityCount = 6;
        const citySpacing = (this.config.width - 100) / (cityCount - 1);
        for (let i = 0; i < cityCount; i++) {
            this.cities.push({
                x: 50 + i * citySpacing - 15,
                y: this.config.height - 40,
                width: 30,
                height: 20,
                destroyed: false
            });
        }
        // Create missile batteries
        this.batteries = [];
        this.batteries.push({
            x: 20,
            y: this.config.height - 30,
            width: 40,
            height: 20,
            ammo: 10,
            destroyed: false
        });
        this.batteries.push({
            x: this.config.width / 2 - 20,
            y: this.config.height - 30,
            width: 40,
            height: 20,
            ammo: 10,
            destroyed: false
        });
        this.batteries.push({
            x: this.config.width - 60,
            y: this.config.height - 30,
            width: 40,
            height: 20,
            ammo: 10,
            destroyed: false
        });
        this.missileSpawnRate = Math.max(30, 120 - this.level * 10);
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.gameState === 'levelComplete') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.level++;
                this.initLevel();
                this.gameState = 'playing';
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.fireMissile();
        }
    }
    handleKeyUp(event) {
        super.handleKeyUp(event);
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        if (this.gameState === 'levelComplete') {
            this.level++;
            this.initLevel();
            this.gameState = 'playing';
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.crosshair.x = touch.clientX - rect.left;
        this.crosshair.y = touch.clientY - rect.top;
        this.fireMissile();
    }
    handleTouchMove(event) {
        super.handleTouchMove(event);
        if (this.gameState === 'playing') {
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.crosshair.x = touch.clientX - rect.left;
            this.crosshair.y = touch.clientY - rect.top;
        }
    }
    fireMissile() {
        // Find closest battery with ammo
        let closestBattery = null;
        let closestDistance = Infinity;
        for (const battery of this.batteries) {
            if (battery.destroyed || battery.ammo <= 0)
                continue;
            const distance = Math.abs(battery.x + battery.width / 2 - this.crosshair.x);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestBattery = battery;
            }
        }
        if (!closestBattery)
            return;
        closestBattery.ammo--;
        this.defenseMissiles.push({
            startX: closestBattery.x + closestBattery.width / 2,
            startY: closestBattery.y,
            x: closestBattery.x + closestBattery.width / 2,
            y: closestBattery.y,
            targetX: this.crosshair.x,
            targetY: this.crosshair.y,
            speed: 8,
            active: true,
            exploded: false,
            trail: []
        });
    }
    spawnMissile() {
        // Random target (city or battery)
        const targets = [
            ...this.cities.filter(c => !c.destroyed).map(c => ({ x: c.x + c.width / 2, y: c.y + c.height / 2 })),
            ...this.batteries.filter(b => !b.destroyed).map(b => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 }))
        ];
        if (targets.length === 0)
            return;
        const target = targets[Math.floor(Math.random() * targets.length)];
        const startX = Math.random() * this.config.width;
        this.missiles.push({
            startX: startX,
            startY: 0,
            x: startX,
            y: 0,
            targetX: target.x,
            targetY: target.y,
            speed: 1 + Math.random() * 2,
            active: true,
            trail: []
        });
    }
    updateMissiles() {
        for (const missile of this.missiles) {
            if (!missile.active)
                continue;
            // Calculate direction
            const dx = missile.targetX - missile.x;
            const dy = missile.targetY - missile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < missile.speed) {
                // Missile reached target
                missile.active = false;
                this.createExplosion(missile.targetX, missile.targetY, 40);
            }
            else {
                // Move missile
                missile.x += (dx / distance) * missile.speed;
                missile.y += (dy / distance) * missile.speed;
                // Add to trail
                missile.trail.push({ x: missile.x, y: missile.y });
                if (missile.trail.length > 20) {
                    missile.trail.shift();
                }
            }
        }
    }
    updateDefenseMissiles() {
        for (const missile of this.defenseMissiles) {
            if (!missile.active)
                continue;
            if (!missile.exploded) {
                // Calculate direction
                const dx = missile.targetX - missile.x;
                const dy = missile.targetY - missile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < missile.speed) {
                    // Missile reached target
                    missile.exploded = true;
                    this.createExplosion(missile.targetX, missile.targetY, 60);
                    this.score += 25;
                }
                else {
                    // Move missile
                    missile.x += (dx / distance) * missile.speed;
                    missile.y += (dy / distance) * missile.speed;
                    // Add to trail
                    missile.trail.push({ x: missile.x, y: missile.y });
                    if (missile.trail.length > 15) {
                        missile.trail.shift();
                    }
                }
            }
        }
    }
    createExplosion(x, y, maxRadius) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: maxRadius,
            growing: true,
            active: true
        });
    }
    updateExplosions() {
        for (const explosion of this.explosions) {
            if (!explosion.active)
                continue;
            if (explosion.growing) {
                explosion.radius += 3;
                if (explosion.radius >= explosion.maxRadius) {
                    explosion.growing = false;
                }
                // Check if explosion destroys incoming missiles
                for (const missile of this.missiles) {
                    if (!missile.active)
                        continue;
                    const distance = Math.sqrt(Math.pow(missile.x - explosion.x, 2) +
                        Math.pow(missile.y - explosion.y, 2));
                    if (distance <= explosion.radius) {
                        missile.active = false;
                        this.score += 100;
                    }
                }
            }
            else {
                explosion.radius -= 2;
                if (explosion.radius <= 0) {
                    explosion.active = false;
                }
            }
        }
        // Check explosion damage to cities and batteries
        for (const explosion of this.explosions) {
            if (!explosion.active || !explosion.growing)
                continue;
            // Check cities
            for (const city of this.cities) {
                if (city.destroyed)
                    continue;
                const distance = Math.sqrt(Math.pow(city.x + city.width / 2 - explosion.x, 2) +
                    Math.pow(city.y + city.height / 2 - explosion.y, 2));
                if (distance <= explosion.radius) {
                    city.destroyed = true;
                }
            }
            // Check batteries
            for (const battery of this.batteries) {
                if (battery.destroyed)
                    continue;
                const distance = Math.sqrt(Math.pow(battery.x + battery.width / 2 - explosion.x, 2) +
                    Math.pow(battery.y + battery.height / 2 - explosion.y, 2));
                if (distance <= explosion.radius) {
                    battery.destroyed = true;
                }
            }
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        // Update crosshair with keyboard
        if (this.config.useKeyboard) {
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.crosshair.x = Math.max(0, this.crosshair.x - 5);
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.crosshair.x = Math.min(this.config.width, this.crosshair.x + 5);
            }
            if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
                this.crosshair.y = Math.max(0, this.crosshair.y - 5);
            }
            if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
                this.crosshair.y = Math.min(this.config.height, this.crosshair.y + 5);
            }
        }
        // Spawn missiles
        this.missileSpawnTimer++;
        if (this.missileSpawnTimer >= this.missileSpawnRate) {
            this.spawnMissile();
            this.missileSpawnTimer = 0;
        }
        this.updateMissiles();
        this.updateDefenseMissiles();
        this.updateExplosions();
        // Clean up inactive objects
        this.missiles = this.missiles.filter(m => m.active);
        this.defenseMissiles = this.defenseMissiles.filter(m => m.active);
        this.explosions = this.explosions.filter(e => e.active);
        // Check win/lose conditions
        const activeCities = this.cities.filter(c => !c.destroyed);
        const activeBatteries = this.batteries.filter(b => !b.destroyed);
        if (activeCities.length === 0 && activeBatteries.length === 0) {
            this.gameState = 'gameOver';
        }
        else if (this.missiles.length === 0 && this.missileSpawnTimer === 0) {
            // Level complete (no more missiles and none spawning)
            this.score += activeCities.length * 100; // Bonus for surviving cities
            this.score += activeBatteries.reduce((sum, b) => sum + b.ammo * 5, 0); // Bonus for remaining ammo
            this.gameState = 'levelComplete';
        }
    }
    render() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Ground
        this.ctx.fillStyle = '#2F4F2F';
        this.ctx.fillRect(0, this.config.height - 50, this.config.width, 50);
        // Draw cities
        for (const city of this.cities) {
            if (city.destroyed) {
                // Destroyed city (rubble)
                this.ctx.fillStyle = '#444444';
                this.ctx.fillRect(city.x, city.y + 10, city.width, city.height - 10);
            }
            else {
                // Intact city
                this.ctx.fillStyle = '#4169E1';
                this.ctx.fillRect(city.x, city.y, city.width, city.height);
                // City windows
                this.ctx.fillStyle = '#FFFF00';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 2; j++) {
                        this.ctx.fillRect(city.x + 4 + i * 8, city.y + 4 + j * 8, 3, 3);
                    }
                }
            }
        }
        // Draw batteries
        for (const battery of this.batteries) {
            if (battery.destroyed) {
                this.ctx.fillStyle = '#666666';
                this.ctx.fillRect(battery.x, battery.y + 5, battery.width, battery.height - 5);
            }
            else {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(battery.x, battery.y, battery.width, battery.height);
                // Ammo display
                this.ctx.fillStyle = '#000';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(battery.ammo.toString(), battery.x + battery.width / 2, battery.y + 12);
            }
        }
        // Draw missile trails and missiles
        for (const missile of this.missiles) {
            if (!missile.active)
                continue;
            // Trail
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(missile.startX, missile.startY);
            for (const point of missile.trail) {
                this.ctx.lineTo(point.x, point.y);
            }
            this.ctx.stroke();
            // Missile head
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(missile.x, missile.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Draw defense missile trails and missiles
        for (const missile of this.defenseMissiles) {
            if (!missile.active)
                continue;
            // Trail
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(missile.startX, missile.startY);
            for (const point of missile.trail) {
                this.ctx.lineTo(point.x, point.y);
            }
            this.ctx.stroke();
            // Missile head
            if (!missile.exploded) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(missile.x, missile.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        // Draw explosions
        for (const explosion of this.explosions) {
            if (!explosion.active)
                continue;
            const alpha = explosion.growing ? 0.8 : 0.4;
            this.ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            // Inner core
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Draw crosshair
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.crosshair.x - 10, this.crosshair.y);
        this.ctx.lineTo(this.crosshair.x + 10, this.crosshair.y);
        this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 10);
        this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 10);
        this.ctx.stroke();
        // UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Level: ${this.level}`, 10, 45);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CITIES DESTROYED!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'levelComplete') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, 70, this.config.width - 40, 100);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Defend your cities!', this.config.width / 2, 95);
            this.ctx.fillText('Move crosshair: WASD or mouse/touch', this.config.width / 2, 115);
            this.ctx.fillText('Fire missile: SPACE or tap', this.config.width / 2, 135);
            this.ctx.fillText('Intercept enemy missiles before', this.config.width / 2, 155);
            this.ctx.fillText('they destroy your cities!', this.config.width / 2, 175);
            this.ctx.textAlign = 'left';
        }
    }
}

class Joust extends GameEngine {
    constructor(container, config = {}) {
        const joustConfig = {
            ...config,
            width: config.width || 600,
            height: config.height || 400
        };
        super(container, joustConfig);
        this.enemies = [];
        this.platforms = [];
        this.eggs = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.gravity = 0.4;
        this.flapPower = -8;
        this.enemySpawnTimer = 0;
        this.waveComplete = false;
        this.initGame();
    }
    initGame() {
        this.player = {
            x: this.config.width / 2,
            y: this.config.height - 150,
            vx: 0,
            vy: 0,
            width: 20,
            height: 16,
            flapping: false,
            onGround: false,
            facing: 'right'
        };
        this.enemies = [];
        this.eggs = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.enemySpawnTimer = 0;
        this.waveComplete = false;
        this.createPlatforms();
        this.spawnEnemyWave();
    }
    createPlatforms() {
        this.platforms = [];
        // Ground platforms
        this.platforms.push({ x: 0, y: this.config.height - 20, width: 150, height: 20 }, { x: this.config.width - 150, y: this.config.height - 20, width: 150, height: 20 });
        // Mid-level platforms
        this.platforms.push({ x: 50, y: this.config.height - 120, width: 100, height: 15 }, { x: this.config.width - 150, y: this.config.height - 120, width: 100, height: 15 }, { x: this.config.width / 2 - 80, y: this.config.height - 180, width: 160, height: 15 });
        // Upper platforms
        this.platforms.push({ x: 20, y: this.config.height - 250, width: 120, height: 15 }, { x: this.config.width - 140, y: this.config.height - 250, width: 120, height: 15 });
        // Top platform
        this.platforms.push({ x: this.config.width / 2 - 60, y: this.config.height - 320, width: 120, height: 15 });
    }
    spawnEnemyWave() {
        const enemyCount = Math.min(2 + this.level, 5);
        for (let i = 0; i < enemyCount; i++) {
            const types = ['hunter', 'shadow', 'buzzard'];
            const type = types[Math.floor(Math.random() * types.length)];
            let color;
            let speed;
            switch (type) {
                case 'hunter':
                    color = '#FF4444';
                    speed = 1.5;
                    break;
                case 'shadow':
                    color = '#444444';
                    speed = 2.0;
                    break;
                case 'buzzard':
                    color = '#8B4513';
                    speed = 1.0;
                    break;
            }
            this.enemies.push({
                x: Math.random() * (this.config.width - 40) + 20,
                y: this.config.height - 100,
                vx: (Math.random() - 0.5) * 2,
                vy: 0,
                width: 18,
                height: 14,
                type: type,
                onGround: false,
                alive: true,
                color: color,
                speed: speed
            });
        }
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.gameState === 'levelComplete') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.level++;
                this.spawnEnemyWave();
                this.gameState = 'playing';
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.flapWings();
        }
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        if (this.gameState === 'levelComplete') {
            this.level++;
            this.spawnEnemyWave();
            this.gameState = 'playing';
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        // Flap if touching upper half, move if touching sides
        if (y < this.config.height / 2) {
            this.flapWings();
        }
        else {
            const centerX = this.config.width / 2;
            if (x < centerX - 50) {
                this.player.facing = 'left';
                this.player.vx = Math.max(this.player.vx - 1, -3);
            }
            else if (x > centerX + 50) {
                this.player.facing = 'right';
                this.player.vx = Math.min(this.player.vx + 1, 3);
            }
            else {
                this.flapWings();
            }
        }
    }
    flapWings() {
        this.player.flapping = true;
        this.player.vy = this.flapPower;
    }
    checkPlatformCollision(entity) {
        for (const platform of this.platforms) {
            if (entity.x < platform.x + platform.width &&
                entity.x + entity.width > platform.x &&
                entity.y + entity.height > platform.y &&
                entity.y + entity.height < platform.y + platform.height + 5) {
                if (entity.vy > 0) {
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.onGround = true;
                    return true;
                }
            }
        }
        return false;
    }
    updatePlayer() {
        // Horizontal movement
        if (this.config.useKeyboard) {
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.player.facing = 'left';
                this.player.vx = Math.max(this.player.vx - 0.5, -3);
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.player.facing = 'right';
                this.player.vx = Math.min(this.player.vx + 0.5, 3);
            }
        }
        // Apply friction
        this.player.vx *= 0.95;
        // Apply gravity
        this.player.vy += this.gravity;
        this.player.onGround = false;
        // Update position
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        // Check platform collisions
        this.checkPlatformCollision(this.player);
        // Ground collision
        if (this.player.y + this.player.height >= this.config.height - 20) {
            this.player.y = this.config.height - 20 - this.player.height;
            this.player.vy = 0;
            this.player.onGround = true;
        }
        // Screen wrapping
        if (this.player.x < -this.player.width) {
            this.player.x = this.config.width;
        }
        else if (this.player.x > this.config.width) {
            this.player.x = -this.player.width;
        }
        // Top boundary
        if (this.player.y < 0) {
            this.player.y = 0;
            this.player.vy = 0;
        }
        this.player.flapping = false;
    }
    updateEnemies() {
        for (const enemy of this.enemies) {
            if (!enemy.alive)
                continue;
            // Simple AI: move toward player occasionally
            if (Math.random() < 0.02) {
                if (this.player.x > enemy.x) {
                    enemy.vx = Math.min(enemy.vx + 0.3, enemy.speed);
                }
                else {
                    enemy.vx = Math.max(enemy.vx - 0.3, -enemy.speed);
                }
                // Flap occasionally
                if (Math.random() < 0.1) {
                    enemy.vy = this.flapPower * 0.8;
                }
            }
            // Apply friction and gravity
            enemy.vx *= 0.98;
            enemy.vy += this.gravity;
            enemy.onGround = false;
            // Update position
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            // Check platform collisions
            this.checkPlatformCollision(enemy);
            // Ground collision
            if (enemy.y + enemy.height >= this.config.height - 20) {
                enemy.y = this.config.height - 20 - enemy.height;
                enemy.vy = 0;
                enemy.onGround = true;
            }
            // Screen wrapping
            if (enemy.x < -enemy.width) {
                enemy.x = this.config.width;
            }
            else if (enemy.x > this.config.width) {
                enemy.x = -enemy.width;
            }
            // Top boundary
            if (enemy.y < 0) {
                enemy.y = 0;
                enemy.vy = 0;
            }
        }
    }
    checkCombat() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy.alive)
                continue;
            // Check collision with player
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                // Determine winner based on relative height
                if (this.player.y + this.player.height / 2 < enemy.y + enemy.height / 2) {
                    // Player wins - enemy becomes egg
                    enemy.alive = false;
                    this.eggs.push({
                        x: enemy.x,
                        y: enemy.y,
                        width: 12,
                        height: 10,
                        timer: 300, // 5 seconds at 60fps
                        active: true
                    });
                    this.score += enemy.type === 'buzzard' ? 500 : enemy.type === 'shadow' ? 1000 : 750;
                }
                else {
                    // Player loses a life
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                    }
                    else {
                        // Respawn player
                        this.player.x = this.config.width / 2;
                        this.player.y = this.config.height - 150;
                        this.player.vx = 0;
                        this.player.vy = 0;
                    }
                }
            }
        }
    }
    updateEggs() {
        for (let i = this.eggs.length - 1; i >= 0; i--) {
            const egg = this.eggs[i];
            egg.timer--;
            // Check if player collects egg
            if (this.player.x < egg.x + egg.width &&
                this.player.x + this.player.width > egg.x &&
                this.player.y < egg.y + egg.height &&
                this.player.y + this.player.height > egg.y) {
                this.score += 250;
                this.eggs.splice(i, 1);
                continue;
            }
            // Egg times out and respawns enemy
            if (egg.timer <= 0) {
                const types = ['hunter', 'shadow', 'buzzard'];
                const type = types[Math.floor(Math.random() * types.length)];
                this.enemies.push({
                    x: egg.x,
                    y: egg.y,
                    vx: 0,
                    vy: 0,
                    width: 18,
                    height: 14,
                    type: type,
                    onGround: false,
                    alive: true,
                    color: type === 'hunter' ? '#FF4444' : type === 'shadow' ? '#444444' : '#8B4513',
                    speed: type === 'hunter' ? 1.5 : type === 'shadow' ? 2.0 : 1.0
                });
                this.eggs.splice(i, 1);
            }
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        this.updatePlayer();
        this.updateEnemies();
        this.checkCombat();
        this.updateEggs();
        // Check for wave completion
        const aliveEnemies = this.enemies.filter(e => e.alive).length;
        if (aliveEnemies === 0 && this.eggs.length === 0) {
            this.gameState = 'levelComplete';
        }
    }
    render() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#DDA0DD');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw platforms
        this.ctx.fillStyle = '#8B4513';
        for (const platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Platform highlight
            this.ctx.fillStyle = '#D2691E';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
            this.ctx.fillStyle = '#8B4513';
        }
        // Draw ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);
        // Draw player
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Player wings
        if (this.player.flapping || !this.player.onGround) {
            this.ctx.fillStyle = '#ADD8E6';
            const wingOffset = this.player.facing === 'right' ? 2 : -6;
            this.ctx.fillRect(this.player.x + wingOffset, this.player.y - 2, 8, 4);
            this.ctx.fillRect(this.player.x + wingOffset, this.player.y + this.player.height - 2, 8, 4);
        }
        // Player rider
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.fillRect(this.player.x + 6, this.player.y - 4, 8, 8);
        // Draw enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive)
                continue;
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Enemy wings
            this.ctx.fillStyle = '#696969';
            this.ctx.fillRect(enemy.x - 2, enemy.y - 1, 6, 3);
            this.ctx.fillRect(enemy.x + enemy.width - 4, enemy.y - 1, 6, 3);
            // Enemy rider
            this.ctx.fillStyle = '#800080';
            this.ctx.fillRect(enemy.x + 5, enemy.y - 3, 6, 6);
        }
        // Draw eggs
        this.ctx.fillStyle = '#FFFACD';
        for (const egg of this.eggs) {
            this.ctx.beginPath();
            this.ctx.ellipse(egg.x + egg.width / 2, egg.y + egg.height / 2, egg.width / 2, egg.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Egg spots
            this.ctx.fillStyle = '#DDD';
            this.ctx.beginPath();
            this.ctx.arc(egg.x + 3, egg.y + 3, 1, 0, Math.PI * 2);
            this.ctx.arc(egg.x + 8, egg.y + 6, 1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#FFFACD';
        }
        // UI
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Level: ${this.level}`, 10, 65);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'levelComplete') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Wave Complete!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap for next wave', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, 100, this.config.width - 40, 120);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Fly on your ostrich and battle enemies!', this.config.width / 2, 125);
            this.ctx.fillText('Hit enemies from above to defeat them', this.config.width / 2, 145);
            this.ctx.fillText('Move: A/D or ←/→', this.config.width / 2, 165);
            this.ctx.fillText('Flap: Space or tap', this.config.width / 2, 185);
            this.ctx.fillText('Collect eggs for bonus points!', this.config.width / 2, 205);
            this.ctx.textAlign = 'left';
        }
    }
}

class LunarLander extends GameEngine {
    constructor(container, config = {}) {
        const landerConfig = {
            ...config,
            width: config.width || 600,
            height: config.height || 400
        };
        super(container, landerConfig);
        this.particles = [];
        this.score = 0;
        this.gameState = 'flying';
        this.gravity = 0.1;
        this.thrusting = false;
        this.rotatingLeft = false;
        this.rotatingRight = false;
        this.altitude = 0;
        this.speed = 0;
        this.landingScore = 0;
        this.initGame();
    }
    initGame() {
        this.lander = {
            x: this.config.width / 2,
            y: 50,
            vx: 0,
            vy: 0,
            angle: 0,
            fuel: 1000,
            width: 12,
            height: 8,
            thrustPower: 0.15,
            rotationSpeed: 0.1
        };
        this.generateTerrain();
        this.particles = [];
        this.score = 0;
        this.gameState = 'flying';
        this.thrusting = false;
        this.rotatingLeft = false;
        this.rotatingRight = false;
    }
    generateTerrain() {
        const points = [];
        const landingPads = [];
        let x = 0;
        let y = this.config.height - 80;
        while (x <= this.config.width) {
            // Add some randomness to terrain
            if (Math.random() < 0.3 && x > 50 && x < this.config.width - 100) {
                // Create landing pad
                const padWidth = 60 + Math.random() * 40;
                const padY = y + (Math.random() - 0.5) * 30;
                points.push({ x: x, y: y });
                points.push({ x: x, y: padY });
                points.push({ x: x + padWidth, y: padY });
                points.push({ x: x + padWidth, y: y });
                landingPads.push({
                    startX: x,
                    endX: x + padWidth,
                    y: padY,
                    bonus: padWidth < 80 ? 500 : 250 // Smaller pads give more points
                });
                x += padWidth;
            }
            else {
                // Regular terrain
                const nextX = x + 20 + Math.random() * 40;
                const nextY = y + (Math.random() - 0.5) * 60;
                // Keep terrain within bounds
                const clampedY = Math.max(this.config.height - 150, Math.min(this.config.height - 30, nextY));
                points.push({ x: x, y: y });
                points.push({ x: nextX, y: clampedY });
                x = nextX;
                y = clampedY;
            }
        }
        // Ensure terrain goes to edge
        points.push({ x: this.config.width, y: y });
        points.push({ x: this.config.width, y: this.config.height });
        points.push({ x: 0, y: this.config.height });
        points.push({ x: 0, y: points[0].y });
        this.terrain = { points, landingPads };
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'landed' || this.gameState === 'crashed' || this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.isKeyPressed('UP', event) || this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.thrusting = true;
        }
        if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
            this.rotatingLeft = true;
        }
        if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
            this.rotatingRight = true;
        }
    }
    handleKeyUp(event) {
        super.handleKeyUp(event);
        if (this.isKeyPressed('UP', event) || this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.thrusting = false;
        }
        if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
            this.rotatingLeft = false;
        }
        if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
            this.rotatingRight = false;
        }
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'landed' || this.gameState === 'crashed' || this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const centerX = this.config.width / 2;
        const centerY = this.config.height / 2;
        if (y < centerY) {
            // Upper half - thrust
            this.thrusting = true;
        }
        else {
            // Lower half - rotate
            if (x < centerX - 50) {
                this.rotatingLeft = true;
            }
            else if (x > centerX + 50) {
                this.rotatingRight = true;
            }
            else {
                this.thrusting = true;
            }
        }
    }
    handleTouchEnd(event) {
        super.handleTouchEnd(event);
        this.thrusting = false;
        this.rotatingLeft = false;
        this.rotatingRight = false;
    }
    updateLander() {
        if (this.gameState !== 'flying')
            return;
        // Rotation
        if (this.rotatingLeft) {
            this.lander.angle -= this.lander.rotationSpeed;
        }
        if (this.rotatingRight) {
            this.lander.angle += this.lander.rotationSpeed;
        }
        // Thrust
        if (this.thrusting && this.lander.fuel > 0) {
            const thrustX = Math.sin(this.lander.angle) * this.lander.thrustPower;
            const thrustY = -Math.cos(this.lander.angle) * this.lander.thrustPower;
            this.lander.vx += thrustX;
            this.lander.vy += thrustY;
            this.lander.fuel -= 2;
            // Create thrust particles
            this.createThrustParticles();
        }
        // Apply gravity
        this.lander.vy += this.gravity;
        // Update position
        this.lander.x += this.lander.vx;
        this.lander.y += this.lander.vy;
        // Calculate altitude and speed
        this.altitude = this.getAltitude();
        this.speed = Math.sqrt(this.lander.vx * this.lander.vx + this.lander.vy * this.lander.vy);
        // Check boundaries
        if (this.lander.x < 0)
            this.lander.x = 0;
        if (this.lander.x > this.config.width)
            this.lander.x = this.config.width;
        if (this.lander.y < 0) {
            this.lander.y = 0;
            this.lander.vy = 0;
        }
        // Check terrain collision
        this.checkTerrainCollision();
    }
    getAltitude() {
        const groundY = this.getGroundHeight(this.lander.x);
        return groundY - (this.lander.y + this.lander.height);
    }
    getGroundHeight(x) {
        // Find the ground height at given x coordinate
        for (let i = 0; i < this.terrain.points.length - 1; i++) {
            const p1 = this.terrain.points[i];
            const p2 = this.terrain.points[i + 1];
            if (x >= p1.x && x <= p2.x) {
                // Linear interpolation between points
                const t = (x - p1.x) / (p2.x - p1.x);
                return p1.y + (p2.y - p1.y) * t;
            }
        }
        return this.config.height - 50;
    }
    checkTerrainCollision() {
        const groundY = this.getGroundHeight(this.lander.x);
        if (this.lander.y + this.lander.height >= groundY) {
            this.lander.y = groundY - this.lander.height;
            this.lander.vy = 0;
            // Check if landed on landing pad
            const landingPad = this.terrain.landingPads.find(pad => this.lander.x >= pad.startX &&
                this.lander.x + this.lander.width <= pad.endX &&
                Math.abs(groundY - pad.y) < 5);
            if (landingPad && this.speed < 2 && Math.abs(this.lander.angle) < 0.3) {
                // Successful landing
                this.gameState = 'landed';
                this.landingScore = Math.floor(landingPad.bonus + this.lander.fuel + (1000 / Math.max(this.speed, 0.1)));
                this.score += this.landingScore;
            }
            else {
                // Crashed
                this.gameState = 'crashed';
                this.createCrashParticles();
            }
        }
    }
    createThrustParticles() {
        for (let i = 0; i < 3; i++) {
            const angle = this.lander.angle + Math.PI + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: this.lander.x + this.lander.width / 2,
                y: this.lander.y + this.lander.height,
                vx: Math.sin(angle) * speed,
                vy: -Math.cos(angle) * speed,
                life: 0,
                maxLife: 20 + Math.random() * 10,
                color: `hsl(${30 + Math.random() * 60}, 100%, 50%)`
            });
        }
    }
    createCrashParticles() {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x: this.lander.x + this.lander.width / 2,
                y: this.lander.y + this.lander.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 40 + Math.random() * 20,
                color: Math.random() < 0.5 ? '#FF4444' : '#FFA500'
            });
        }
    }
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity on particles
            particle.life++;
            if (particle.life >= particle.maxLife) {
                this.particles.splice(i, 1);
            }
        }
    }
    update() {
        this.updateLander();
        this.updateParticles();
        // Check fuel
        if (this.lander.fuel <= 0 && this.gameState === 'flying') ;
    }
    render() {
        // Space background
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Stars
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.config.width;
            const y = (i * 23) % (this.config.height / 2);
            this.ctx.fillRect(x, y, 1, 1);
        }
        // Draw terrain
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.moveTo(this.terrain.points[0].x, this.terrain.points[0].y);
        for (const point of this.terrain.points) {
            this.ctx.lineTo(point.x, point.y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        // Draw landing pads
        this.ctx.fillStyle = '#00FF00';
        for (const pad of this.terrain.landingPads) {
            this.ctx.fillRect(pad.startX, pad.y - 3, pad.endX - pad.startX, 3);
            // Landing pad lights
            for (let x = pad.startX + 10; x < pad.endX - 10; x += 15) {
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(x, pad.y - 1, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.fillStyle = '#00FF00';
        }
        // Draw particles
        for (const particle of this.particles) {
            const alpha = 1 - (particle.life / particle.maxLife);
            this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Draw lander
        this.ctx.save();
        this.ctx.translate(this.lander.x + this.lander.width / 2, this.lander.y + this.lander.height / 2);
        this.ctx.rotate(this.lander.angle);
        if (this.gameState === 'crashed') {
            this.ctx.fillStyle = '#FF4444';
        }
        else {
            this.ctx.fillStyle = '#FFFFFF';
        }
        // Lander body
        this.ctx.fillRect(-this.lander.width / 2, -this.lander.height / 2, this.lander.width, this.lander.height);
        // Lander legs
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-this.lander.width / 2, this.lander.height / 2);
        this.ctx.lineTo(-this.lander.width / 2 - 4, this.lander.height / 2 + 6);
        this.ctx.moveTo(this.lander.width / 2, this.lander.height / 2);
        this.ctx.lineTo(this.lander.width / 2 + 4, this.lander.height / 2 + 6);
        this.ctx.stroke();
        this.ctx.restore();
        // HUD
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Fuel: ${Math.max(0, this.lander.fuel)}`, 10, 25);
        this.ctx.fillText(`Altitude: ${Math.max(0, Math.floor(this.altitude))}`, 10, 45);
        this.ctx.fillText(`Speed: ${this.speed.toFixed(1)}`, 10, 65);
        this.ctx.fillText(`Score: ${this.score}`, 10, 85);
        // Fuel bar
        const fuelBarWidth = 100;
        const fuelLevel = Math.max(0, this.lander.fuel / 1000);
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(this.config.width - 120, 10, fuelBarWidth, 10);
        this.ctx.fillStyle = fuelLevel > 0.3 ? '#00FF00' : fuelLevel > 0.1 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(this.config.width - 120, 10, fuelBarWidth * fuelLevel, 10);
        // Game state messages
        if (this.gameState === 'landed') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SUCCESSFUL LANDING!', this.config.width / 2, this.config.height / 2 - 40);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Landing Bonus: ${this.landingScore}`, this.config.width / 2, this.config.height / 2);
            this.ctx.fillText(`Total Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 25);
            this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 60);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'crashed') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CRASHED!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            let reason = '';
            if (this.speed >= 2)
                reason = 'Too fast!';
            else if (Math.abs(this.lander.angle) >= 0.3)
                reason = 'Wrong angle!';
            else
                reason = 'Missed landing pad!';
            this.ctx.fillText(reason, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, 120, this.config.width - 40, 120);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Land safely on the green landing pads!', this.config.width / 2, 145);
            this.ctx.fillText('Thrust: W/↑ or Space', this.config.width / 2, 165);
            this.ctx.fillText('Rotate: A/D or ←/→', this.config.width / 2, 185);
            this.ctx.fillText('Land slowly and upright for bonus points', this.config.width / 2, 205);
            this.ctx.fillText('Watch your fuel!', this.config.width / 2, 225);
            this.ctx.textAlign = 'left';
        }
    }
}

class Battlezone extends GameEngine {
    constructor(container, config = {}) {
        const battlezoneConfig = {
            ...config,
            width: config.width || 600,
            height: config.height || 400
        };
        super(container, battlezoneConfig);
        this.enemies = [];
        this.projectiles = [];
        this.obstacles = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';
        this.radar = { enemies: [], obstacles: [] };
        this.crosshair = { x: 0, y: 0 };
        this.camera = { x: 0, y: 0, angle: 0, height: 10 };
        this.horizon = 150;
        this.initGame();
    }
    initGame() {
        this.player = {
            x: 0,
            y: 0,
            angle: 0,
            turretAngle: 0,
            speed: 2,
            health: 100
        };
        this.enemies = [];
        this.projectiles = [];
        this.obstacles = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';
        this.crosshair = { x: this.config.width / 2, y: this.config.height / 2 - 50 };
        this.camera = { x: 0, y: 0, angle: 0, height: 10 };
        this.generateWorld();
        this.spawnEnemyWave();
    }
    generateWorld() {
        // Generate random obstacles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 300;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            this.obstacles.push({
                x: x,
                y: y,
                width: 20 + Math.random() * 20,
                height: 10 + Math.random() * 20,
                type: Math.random() < 0.7 ? 'block' : 'pyramid'
            });
        }
    }
    spawnEnemyWave() {
        const enemyCount = 2 + Math.floor(this.score / 1000);
        for (let i = 0; i < enemyCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 200;
            const x = this.player.x + Math.cos(angle) * distance;
            const y = this.player.y + Math.sin(angle) * distance;
            this.enemies.push({
                x: x,
                y: y,
                angle: Math.random() * Math.PI * 2,
                type: Math.random() < 0.8 ? 'tank' : 'ufo',
                health: 1,
                lastShot: 0,
                color: Math.random() < 0.5 ? '#FF0000' : '#00FF00'
            });
        }
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.shoot();
        }
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
        // Upper area - shoot
        if (y < this.config.height * 0.6) {
            this.shoot();
        }
        else {
            // Lower area - movement
            const centerX = this.config.width / 2;
            if (x < centerX - 100) {
                // Turn left
                this.player.angle -= 0.2;
                this.player.turretAngle -= 0.2;
            }
            else if (x > centerX + 100) {
                // Turn right
                this.player.angle += 0.2;
                this.player.turretAngle += 0.2;
            }
            else {
                // Move forward
                this.player.x += Math.cos(this.player.angle) * this.player.speed;
                this.player.y += Math.sin(this.player.angle) * this.player.speed;
            }
        }
    }
    shoot() {
        this.projectiles.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(this.player.turretAngle) * 8,
            vy: Math.sin(this.player.turretAngle) * 8,
            fromPlayer: true,
            active: true
        });
    }
    updatePlayer() {
        // Tank controls
        if (this.config.useKeyboard) {
            if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
                this.player.x += Math.cos(this.player.angle) * this.player.speed;
                this.player.y += Math.sin(this.player.angle) * this.player.speed;
            }
            if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
                this.player.x -= Math.cos(this.player.angle) * this.player.speed * 0.5;
                this.player.y -= Math.sin(this.player.angle) * this.player.speed * 0.5;
            }
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.player.angle -= 0.1;
                this.player.turretAngle -= 0.1;
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.player.angle += 0.1;
                this.player.turretAngle += 0.1;
            }
        }
        // Update camera to follow player
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
        this.camera.angle = this.player.angle;
    }
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            // Simple AI: move toward player and shoot occasionally
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const targetAngle = Math.atan2(dy, dx);
            if (distance > 50) {
                // Move toward player
                enemy.x += Math.cos(targetAngle) * 1;
                enemy.y += Math.sin(targetAngle) * 1;
                enemy.angle = targetAngle;
            }
            // Shoot at player occasionally
            enemy.lastShot++;
            if (enemy.lastShot > 120 && distance < 200) {
                this.projectiles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(targetAngle) * 4,
                    vy: Math.sin(targetAngle) * 4,
                    fromPlayer: false,
                    active: true
                });
                enemy.lastShot = 0;
            }
            // Remove dead enemies
            if (enemy.health <= 0) {
                this.score += enemy.type === 'ufo' ? 1000 : 500;
                this.enemies.splice(i, 1);
            }
        }
        // Spawn new wave if all enemies defeated
        if (this.enemies.length === 0) {
            this.spawnEnemyWave();
        }
    }
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx;
            proj.y += proj.vy;
            // Check collision with enemies (player projectiles only)
            if (proj.fromPlayer) {
                for (const enemy of this.enemies) {
                    const dx = proj.x - enemy.x;
                    const dy = proj.y - enemy.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 15) {
                        enemy.health--;
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
            else {
                // Check collision with player (enemy projectiles)
                const dx = proj.x - this.player.x;
                const dy = proj.y - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 15) {
                    this.player.health -= 20;
                    this.projectiles.splice(i, 1);
                    if (this.player.health <= 0) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameState = 'gameOver';
                        }
                        else {
                            this.player.health = 100;
                        }
                    }
                }
            }
            // Remove projectiles that are too far
            if (Math.abs(proj.x - this.camera.x) > 500 || Math.abs(proj.y - this.camera.y) > 500) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    updateRadar() {
        this.radar.enemies = this.enemies.map(enemy => ({
            x: enemy.x - this.camera.x,
            y: enemy.y - this.camera.y
        }));
        this.radar.obstacles = this.obstacles.map(obstacle => ({
            x: obstacle.x - this.camera.x,
            y: obstacle.y - this.camera.y
        }));
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        this.updatePlayer();
        this.updateEnemies();
        this.updateProjectiles();
        this.updateRadar();
    }
    project3D(x, y, z) {
        // Transform world coordinates to camera coordinates
        const dx = x - this.camera.x;
        const dy = y - this.camera.y;
        // Rotate by camera angle
        const cos = Math.cos(-this.camera.angle);
        const sin = Math.sin(-this.camera.angle);
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        // Project to screen
        if (ry <= 0)
            return { x: -1e3, y: -1e3 }; // Behind camera
        const scale = 200 / ry;
        const screenX = this.config.width / 2 + rx * scale;
        const screenY = this.horizon - (z - this.camera.height) * scale;
        return { x: screenX, y: screenY };
    }
    render() {
        // Sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.horizon);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#003366');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.horizon);
        // Ground
        this.ctx.fillStyle = '#2F4F2F';
        this.ctx.fillRect(0, this.horizon, this.config.width, this.config.height - this.horizon);
        // Grid lines on ground
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = -10; i <= 10; i++) {
            // Vertical lines
            const start = this.project3D(i * 50, 0, 0);
            const end = this.project3D(i * 50, 500, 0);
            if (start.x >= 0 && start.x <= this.config.width) {
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
            }
            // Horizontal lines
            const hStart = this.project3D(-500, i * 50, 0);
            const hEnd = this.project3D(500, i * 50, 0);
            if (i * 50 > 0) {
                this.ctx.moveTo(hStart.x, hStart.y);
                this.ctx.lineTo(hEnd.x, hEnd.y);
            }
        }
        this.ctx.stroke();
        // Draw obstacles
        this.ctx.fillStyle = '#666666';
        for (const obstacle of this.obstacles) {
            const base1 = this.project3D(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.width / 2, 0);
            const base2 = this.project3D(obstacle.x + obstacle.width / 2, obstacle.y - obstacle.width / 2, 0);
            this.project3D(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.width / 2, 0);
            this.project3D(obstacle.x - obstacle.width / 2, obstacle.y + obstacle.width / 2, 0);
            const top1 = this.project3D(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.width / 2, obstacle.height);
            const top2 = this.project3D(obstacle.x + obstacle.width / 2, obstacle.y - obstacle.width / 2, obstacle.height);
            this.project3D(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.width / 2, obstacle.height);
            this.project3D(obstacle.x - obstacle.width / 2, obstacle.y + obstacle.width / 2, obstacle.height);
            // Only draw if visible
            if (base1.x > -100 && base1.x < this.config.width + 100) {
                this.ctx.beginPath();
                this.ctx.moveTo(base1.x, base1.y);
                this.ctx.lineTo(base2.x, base2.y);
                this.ctx.lineTo(top2.x, top2.y);
                this.ctx.lineTo(top1.x, top1.y);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.stroke();
            }
        }
        // Draw enemies
        for (const enemy of this.enemies) {
            const pos = this.project3D(enemy.x, enemy.y, 5);
            if (pos.x > 0 && pos.x < this.config.width && pos.y > 0 && pos.y < this.config.height) {
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(pos.x - 8, pos.y - 8, 16, 16);
                // Tank turret
                if (enemy.type === 'tank') {
                    const turretEnd = this.project3D(enemy.x + Math.cos(enemy.angle) * 15, enemy.y + Math.sin(enemy.angle) * 15, 5);
                    this.ctx.strokeStyle = enemy.color;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(pos.x, pos.y);
                    this.ctx.lineTo(turretEnd.x, turretEnd.y);
                    this.ctx.stroke();
                }
            }
        }
        // Draw projectiles
        this.ctx.fillStyle = '#FFFF00';
        for (const proj of this.projectiles) {
            const pos = this.project3D(proj.x, proj.y, 2);
            if (pos.x > 0 && pos.x < this.config.width && pos.y > 0 && pos.y < this.config.height) {
                this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            }
        }
        // Crosshair
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.crosshair.x - 10, this.crosshair.y);
        this.ctx.lineTo(this.crosshair.x + 10, this.crosshair.y);
        this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 10);
        this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 10);
        this.ctx.stroke();
        // Radar display
        const radarSize = 80;
        const radarX = this.config.width - radarSize - 10;
        const radarY = 10;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(radarX, radarY, radarSize, radarSize);
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.strokeRect(radarX, radarY, radarSize, radarSize);
        // Radar center (player)
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(radarX + radarSize / 2 - 2, radarY + radarSize / 2 - 2, 4, 4);
        // Radar enemies
        this.ctx.fillStyle = '#FF0000';
        for (const enemy of this.radar.enemies) {
            const rx = radarX + radarSize / 2 + (enemy.x / 10);
            const ry = radarY + radarSize / 2 + (enemy.y / 10);
            if (rx >= radarX && rx <= radarX + radarSize && ry >= radarY && ry <= radarY + radarSize) {
                this.ctx.fillRect(rx - 1, ry - 1, 2, 2);
            }
        }
        // HUD
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 25);
        this.ctx.fillText(`LIVES: ${this.lives}`, 10, 45);
        // Health bar
        const healthWidth = 100;
        const healthHeight = 10;
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(10, 55, healthWidth, healthHeight);
        this.ctx.fillStyle = this.player.health > 50 ? '#00FF00' : this.player.health > 25 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(10, 55, (healthWidth * this.player.health) / 100, healthHeight);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('3D tank combat! Destroy enemy tanks and UFOs', this.config.width / 2, this.config.height - 115);
            this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, this.config.height - 95);
            this.ctx.fillText('Shoot: Space or tap', this.config.width / 2, this.config.height - 75);
            this.ctx.fillText('Use radar to track enemies', this.config.width / 2, this.config.height - 55);
            this.ctx.fillText('Watch your health!', this.config.width / 2, this.config.height - 35);
            this.ctx.textAlign = 'left';
        }
    }
}

class Berzerk extends GameEngine {
    constructor(container, config = {}) {
        const berzerkConfig = {
            ...config,
            width: config.width || 520,
            height: config.height || 360
        };
        super(container, berzerkConfig);
        this.robots = [];
        this.bullets = [];
        this.walls = [];
        this.exits = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.roomWidth = 480;
        this.roomHeight = 320;
        this.cellSize = 20;
        this.evilOtto = { active: false, x: 0, y: 0, timer: 0 };
        this.initGame();
    }
    initGame() {
        this.player = {
            x: this.config.width / 2,
            y: this.config.height - 40,
            vx: 0,
            vy: 0,
            width: 12,
            height: 12,
            shootCooldown: 0,
            facing: 'up'
        };
        this.robots = [];
        this.bullets = [];
        this.walls = [];
        this.exits = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.evilOtto = { active: false, x: 0, y: 0, timer: 0 };
        this.generateRoom();
    }
    generateRoom() {
        this.walls = [];
        this.robots = [];
        this.exits = [];
        const margin = 20;
        // Create outer walls
        this.walls.push(
        // Top wall
        { x: 0, y: 0, width: this.config.width, height: margin, destructible: false }, 
        // Bottom wall  
        { x: 0, y: this.config.height - margin, width: this.config.width, height: margin, destructible: false }, 
        // Left wall
        { x: 0, y: 0, width: margin, height: this.config.height, destructible: false }, 
        // Right wall
        { x: this.config.width - margin, y: 0, width: margin, height: this.config.height, destructible: false });
        // Create exits
        this.exits.push({ x: this.config.width / 2 - 30, y: -5, width: 60, height: 10, direction: 'up' }, { x: this.config.width / 2 - 30, y: this.config.height - 5, width: 60, height: 10, direction: 'down' }, { x: -5, y: this.config.height / 2 - 30, width: 10, height: 60, direction: 'left' }, { x: this.config.width - 5, y: this.config.height / 2 - 30, width: 10, height: 60, direction: 'right' });
        // Generate maze walls
        for (let i = 0; i < 8 + this.level; i++) {
            const x = margin + Math.random() * (this.config.width - margin * 2 - 60);
            const y = margin + Math.random() * (this.config.height - margin * 2 - 60);
            const width = 20 + Math.random() * 40;
            const height = 20 + Math.random() * 40;
            this.walls.push({
                x: x,
                y: y,
                width: width,
                height: height,
                destructible: Math.random() < 0.7
            });
        }
        // Spawn robots
        const robotCount = 3 + Math.floor(this.level / 2);
        for (let i = 0; i < robotCount; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            do {
                x = margin + Math.random() * (this.config.width - margin * 2);
                y = margin + Math.random() * (this.config.height - margin * 2);
                // Check if position is clear
                validPosition = !this.checkWallCollision(x, y, 15, 15) &&
                    Math.sqrt(Math.pow(x - this.player.x, 2) + Math.pow(y - this.player.y, 2)) > 100;
                attempts++;
            } while (!validPosition && attempts < 50);
            if (validPosition) {
                const types = ['grunt', 'hulk', 'brain'];
                const type = types[Math.floor(Math.random() * types.length)];
                let color;
                let speed;
                let health;
                switch (type) {
                    case 'grunt':
                        color = '#00FF00';
                        speed = 1;
                        health = 1;
                        break;
                    case 'hulk':
                        color = '#FF0000';
                        speed = 0.5;
                        health = 3;
                        break;
                    case 'brain':
                        color = '#FFFF00';
                        speed = 1.5;
                        health = 1;
                        break;
                }
                this.robots.push({
                    x: x,
                    y: y,
                    vx: 0,
                    vy: 0,
                    width: 15,
                    height: 15,
                    health: health,
                    shootCooldown: 0,
                    lastPlayerSeen: null,
                    color: color,
                    type: type,
                    speed: speed
                });
            }
        }
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.gameState === 'levelComplete') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.level++;
                this.generateRoom();
                this.gameState = 'playing';
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.shoot();
        }
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        if (this.gameState === 'levelComplete') {
            this.level++;
            this.generateRoom();
            this.gameState = 'playing';
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const deltaX = x - playerCenterX;
        const deltaY = y - playerCenterY;
        // Determine direction and action
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                this.player.facing = 'right';
                this.player.vx = 2;
                this.player.vy = 0;
            }
            else {
                this.player.facing = 'left';
                this.player.vx = -2;
                this.player.vy = 0;
            }
        }
        else {
            if (deltaY > 0) {
                this.player.facing = 'down';
                this.player.vx = 0;
                this.player.vy = 2;
            }
            else {
                this.player.facing = 'up';
                this.player.vx = 0;
                this.player.vy = -2;
            }
        }
        // Shoot if close to player
        if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < 50) {
            this.shoot();
        }
    }
    handleTouchEnd(event) {
        super.handleTouchEnd(event);
        this.player.vx = 0;
        this.player.vy = 0;
    }
    shoot() {
        if (this.player.shootCooldown > 0)
            return;
        let vx = 0, vy = 0;
        switch (this.player.facing) {
            case 'up':
                vy = -6;
                break;
            case 'down':
                vy = 6;
                break;
            case 'left':
                vx = -6;
                break;
            case 'right':
                vx = 6;
                break;
        }
        this.bullets.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            vx: vx,
            vy: vy,
            fromPlayer: true,
            active: true,
            trail: []
        });
        this.player.shootCooldown = 15;
    }
    checkWallCollision(x, y, width, height) {
        for (const wall of this.walls) {
            if (x < wall.x + wall.width &&
                x + width > wall.x &&
                y < wall.y + wall.height &&
                y + height > wall.y) {
                return wall;
            }
        }
        return null;
    }
    hasLineOfSight(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 5);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkX = from.x + dx * t;
            const checkY = from.y + dy * t;
            if (this.checkWallCollision(checkX, checkY, 1, 1)) {
                return false;
            }
        }
        return true;
    }
    updatePlayer() {
        // Movement
        if (this.config.useKeyboard) {
            this.player.vx = 0;
            this.player.vy = 0;
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.player.vx = -2;
                this.player.facing = 'left';
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.player.vx = 2;
                this.player.facing = 'right';
            }
            if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
                this.player.vy = -2;
                this.player.facing = 'up';
            }
            if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
                this.player.vy = 2;
                this.player.facing = 'down';
            }
        }
        // Apply movement with collision detection
        const newX = this.player.x + this.player.vx;
        const newY = this.player.y + this.player.vy;
        if (!this.checkWallCollision(newX, this.player.y, this.player.width, this.player.height)) {
            this.player.x = newX;
        }
        if (!this.checkWallCollision(this.player.x, newY, this.player.width, this.player.height)) {
            this.player.y = newY;
        }
        // Check exit collisions
        for (const exit of this.exits) {
            if (this.player.x < exit.x + exit.width &&
                this.player.x + this.player.width > exit.x &&
                this.player.y < exit.y + exit.height &&
                this.player.y + this.player.height > exit.y) {
                if (this.robots.length === 0) {
                    this.gameState = 'levelComplete';
                }
                else {
                    // Move to new room (just regenerate for now)
                    this.generateRoom();
                    this.player.x = this.config.width / 2;
                    this.player.y = this.config.height / 2;
                }
                break;
            }
        }
        this.player.shootCooldown = Math.max(0, this.player.shootCooldown - 1);
    }
    updateRobots() {
        for (let i = this.robots.length - 1; i >= 0; i--) {
            const robot = this.robots[i];
            if (robot.health <= 0) {
                this.score += robot.type === 'brain' ? 500 : robot.type === 'hulk' ? 200 : 100;
                this.robots.splice(i, 1);
                continue;
            }
            const playerCenter = {
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2
            };
            const robotCenter = {
                x: robot.x + robot.width / 2,
                y: robot.y + robot.height / 2
            };
            // Check line of sight to player
            if (this.hasLineOfSight(robotCenter, playerCenter)) {
                robot.lastPlayerSeen = { ...playerCenter };
                // Shoot at player occasionally
                robot.shootCooldown--;
                if (robot.shootCooldown <= 0) {
                    const dx = playerCenter.x - robotCenter.x;
                    const dy = playerCenter.y - robotCenter.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    this.bullets.push({
                        x: robotCenter.x,
                        y: robotCenter.y,
                        vx: (dx / distance) * 4,
                        vy: (dy / distance) * 4,
                        fromPlayer: false,
                        active: true,
                        trail: []
                    });
                    robot.shootCooldown = 60 + Math.random() * 60;
                }
            }
            // AI Movement
            let targetX = robotCenter.x;
            let targetY = robotCenter.y;
            if (robot.lastPlayerSeen) {
                targetX = robot.lastPlayerSeen.x;
                targetY = robot.lastPlayerSeen.y;
            }
            const dx = targetX - robotCenter.x;
            const dy = targetY - robotCenter.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                robot.vx = dx > 0 ? robot.speed : -robot.speed;
                robot.vy = 0;
            }
            else {
                robot.vx = 0;
                robot.vy = dy > 0 ? robot.speed : -robot.speed;
            }
            // Apply movement with collision detection
            const newX = robot.x + robot.vx;
            const newY = robot.y + robot.vy;
            if (!this.checkWallCollision(newX, robot.y, robot.width, robot.height)) {
                robot.x = newX;
            }
            else {
                robot.vx = 0;
            }
            if (!this.checkWallCollision(robot.x, newY, robot.width, robot.height)) {
                robot.y = newY;
            }
            else {
                robot.vy = 0;
            }
            // Check collision with player
            if (this.player.x < robot.x + robot.width &&
                this.player.x + this.player.width > robot.x &&
                this.player.y < robot.y + robot.height &&
                this.player.y + this.player.height > robot.y) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
                else {
                    // Respawn player
                    this.player.x = this.config.width / 2;
                    this.player.y = this.config.height - 40;
                }
            }
        }
        // Spawn Evil Otto if robots take too long
        if (this.robots.length > 0) {
            this.evilOtto.timer++;
            if (this.evilOtto.timer > 1800 && !this.evilOtto.active) { // 30 seconds
                this.evilOtto.active = true;
                this.evilOtto.x = 0;
                this.evilOtto.y = this.config.height / 2;
            }
        }
        else {
            this.evilOtto.active = false;
            this.evilOtto.timer = 0;
        }
        // Update Evil Otto
        if (this.evilOtto.active) {
            const dx = this.player.x - this.evilOtto.x;
            const dy = this.player.y - this.evilOtto.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.evilOtto.x += (dx / distance) * 3;
            this.evilOtto.y += (dy / distance) * 3;
            // Check collision with player
            if (Math.sqrt(Math.pow(this.player.x - this.evilOtto.x, 2) + Math.pow(this.player.y - this.evilOtto.y, 2)) < 20) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
            }
        }
    }
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            // Add to trail
            bullet.trail.push({ x: bullet.x, y: bullet.y });
            if (bullet.trail.length > 5) {
                bullet.trail.shift();
            }
            // Check wall collisions
            const hitWall = this.checkWallCollision(bullet.x, bullet.y, 2, 2);
            if (hitWall) {
                if (hitWall.destructible) {
                    // Remove wall
                    const wallIndex = this.walls.indexOf(hitWall);
                    if (wallIndex > -1) {
                        this.walls.splice(wallIndex, 1);
                        if (bullet.fromPlayer) {
                            this.score += 10;
                        }
                    }
                }
                this.bullets.splice(i, 1);
                continue;
            }
            // Check robot collisions (player bullets only)
            if (bullet.fromPlayer) {
                for (const robot of this.robots) {
                    if (bullet.x >= robot.x && bullet.x <= robot.x + robot.width &&
                        bullet.y >= robot.y && bullet.y <= robot.y + robot.height) {
                        robot.health--;
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
            else {
                // Check player collision (robot bullets)
                if (bullet.x >= this.player.x && bullet.x <= this.player.x + this.player.width &&
                    bullet.y >= this.player.y && bullet.y <= this.player.y + this.player.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                    }
                    this.bullets.splice(i, 1);
                }
            }
            // Remove bullets that go off screen
            if (bullet.x < 0 || bullet.x > this.config.width ||
                bullet.y < 0 || bullet.y > this.config.height) {
                this.bullets.splice(i, 1);
            }
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        this.updatePlayer();
        this.updateRobots();
        this.updateBullets();
        // Check win condition
        if (this.robots.length === 0 && !this.evilOtto.active) {
            this.gameState = 'levelComplete';
        }
    }
    render() {
        // Black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw walls
        for (const wall of this.walls) {
            this.ctx.fillStyle = wall.destructible ? '#FFFF00' : '#FFFFFF';
            this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
        // Draw exits
        this.ctx.fillStyle = '#00FFFF';
        for (const exit of this.exits) {
            this.ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
        }
        // Draw player
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Player direction indicator
        this.ctx.fillStyle = '#FFFFFF';
        let dirX = this.player.x + this.player.width / 2;
        let dirY = this.player.y + this.player.height / 2;
        switch (this.player.facing) {
            case 'up':
                dirY -= 8;
                break;
            case 'down':
                dirY += 8;
                break;
            case 'left':
                dirX -= 8;
                break;
            case 'right':
                dirX += 8;
                break;
        }
        this.ctx.fillRect(dirX - 1, dirY - 1, 2, 2);
        // Draw robots
        for (const robot of this.robots) {
            this.ctx.fillStyle = robot.color;
            this.ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
            // Robot eyes
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(robot.x + 3, robot.y + 3, 2, 2);
            this.ctx.fillRect(robot.x + robot.width - 5, robot.y + 3, 2, 2);
        }
        // Draw Evil Otto
        if (this.evilOtto.active) {
            this.ctx.fillStyle = '#FF00FF';
            this.ctx.beginPath();
            this.ctx.arc(this.evilOtto.x, this.evilOtto.y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            // Otto's smile
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.evilOtto.x - 5, this.evilOtto.y - 5, 2, 2);
            this.ctx.fillRect(this.evilOtto.x + 3, this.evilOtto.y - 5, 2, 2);
            this.ctx.fillRect(this.evilOtto.x - 8, this.evilOtto.y + 3, 16, 2);
        }
        // Draw bullets with trails
        for (const bullet of this.bullets) {
            // Trail
            this.ctx.strokeStyle = bullet.fromPlayer ? '#00FF00' : '#FF0000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for (let i = 0; i < bullet.trail.length - 1; i++) {
                const point = bullet.trail[i];
                const nextPoint = bullet.trail[i + 1];
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(nextPoint.x, nextPoint.y);
            }
            this.ctx.stroke();
            // Bullet
            this.ctx.fillStyle = bullet.fromPlayer ? '#FFFFFF' : '#FF0000';
            this.ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 3);
        }
        // HUD
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 25);
        this.ctx.fillText(`LIVES: ${this.lives}`, 10, 45);
        this.ctx.fillText(`LEVEL: ${this.level}`, 10, 65);
        this.ctx.fillText(`ROBOTS: ${this.robots.length}`, 10, 85);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'levelComplete') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ROOM CLEAR!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Destroy all robots in the maze!', this.config.width / 2, this.config.height - 115);
            this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, this.config.height - 95);
            this.ctx.fillText('Shoot: Space or tap', this.config.width / 2, this.config.height - 75);
            this.ctx.fillText('Exit through doors when room is clear', this.config.width / 2, this.config.height - 55);
            this.ctx.fillText('Beware of Evil Otto!', this.config.width / 2, this.config.height - 35);
            this.ctx.textAlign = 'left';
        }
    }
}

class CircusAtari extends GameEngine {
    constructor(container, config = {}) {
        const circusConfig = {
            ...config,
            width: config.width || 500,
            height: config.height || 400
        };
        super(container, circusConfig);
        this.clowns = [];
        this.balloons = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.gravity = 0.4;
        this.seesawBounce = 15;
        this.currentClown = 0;
        this.balloonTimer = 0;
        this.balloonSpawnRate = 180; // 3 seconds at 60fps
        this.initGame();
    }
    initGame() {
        // Initialize seesaw in center bottom
        this.seesaw = {
            x: this.config.width / 2 - 80,
            y: this.config.height - 60,
            width: 160,
            height: 20,
            angle: 0,
            leftSide: { x: 0, y: 0 },
            rightSide: { x: 0, y: 0 },
            fulcrum: { x: this.config.width / 2, y: this.config.height - 50 }
        };
        this.updateSeesawPositions();
        // Initialize two clowns
        this.clowns = [
            {
                x: this.seesaw.leftSide.x - 10,
                y: this.seesaw.leftSide.y - 20,
                vx: 0,
                vy: 0,
                width: 20,
                height: 20,
                onSeesaw: true,
                color: '#FF0000'
            },
            {
                x: this.seesaw.rightSide.x - 10,
                y: this.seesaw.rightSide.y - 20,
                vx: 0,
                vy: 0,
                width: 20,
                height: 20,
                onSeesaw: true,
                color: '#0000FF'
            }
        ];
        this.balloons = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.currentClown = 0;
        this.balloonTimer = 0;
        this.balloonSpawnRate = 180;
        this.spawnInitialBalloons();
    }
    updateSeesawPositions() {
        const halfWidth = this.seesaw.width / 2;
        const cos = Math.cos(this.seesaw.angle);
        const sin = Math.sin(this.seesaw.angle);
        this.seesaw.leftSide = {
            x: this.seesaw.fulcrum.x - halfWidth * cos,
            y: this.seesaw.fulcrum.y - halfWidth * sin
        };
        this.seesaw.rightSide = {
            x: this.seesaw.fulcrum.x + halfWidth * cos,
            y: this.seesaw.fulcrum.y + halfWidth * sin
        };
    }
    spawnInitialBalloons() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const rows = 3 + this.level;
        const cols = 8;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = 40 + col * 55;
                const y = 40 + row * 30;
                this.balloons.push({
                    x: x,
                    y: y,
                    width: 20,
                    height: 25,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    value: (rows - row) * 10, // Higher balloons worth more
                    popped: false,
                    popAnimation: 0
                });
            }
        }
    }
    spawnNewBalloon() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        const x = Math.random() * (this.config.width - 40) + 20;
        const y = Math.random() * 100 + 20;
        this.balloons.push({
            x: x,
            y: y,
            width: 20,
            height: 25,
            color: colors[Math.floor(Math.random() * colors.length)],
            value: 50 + Math.floor(Math.random() * 50),
            popped: false,
            popAnimation: 0
        });
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.gameState === 'levelComplete') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.level++;
                this.spawnInitialBalloons();
                this.gameState = 'playing';
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.launchClown();
        }
        if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
            this.currentClown = 0;
        }
        if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
            this.currentClown = 1;
        }
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        if (this.gameState === 'levelComplete') {
            this.level++;
            this.spawnInitialBalloons();
            this.gameState = 'playing';
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        // Select clown based on touch side
        if (x < this.config.width / 2) {
            this.currentClown = 0;
        }
        else {
            this.currentClown = 1;
        }
        // Launch if touching upper area
        if (y < this.config.height * 0.7) {
            this.launchClown();
        }
    }
    launchClown() {
        const clown = this.clowns[this.currentClown];
        if (clown.onSeesaw) {
            clown.onSeesaw = false;
            clown.vy = -this.seesawBounce;
            clown.vx = (Math.random() - 0.5) * 4; // Small random horizontal velocity
            // Tilt seesaw based on which clown launched
            if (this.currentClown === 0) {
                this.seesaw.angle = Math.min(this.seesaw.angle + 0.3, 0.5);
            }
            else {
                this.seesaw.angle = Math.max(this.seesaw.angle - 0.3, -0.5);
            }
            this.updateSeesawPositions();
        }
    }
    updateClowns() {
        for (let i = 0; i < this.clowns.length; i++) {
            const clown = this.clowns[i];
            if (!clown.onSeesaw) {
                // Apply gravity
                clown.vy += this.gravity;
                // Update position
                clown.x += clown.vx;
                clown.y += clown.vy;
                // Simple air control
                if (this.config.useKeyboard && i === this.currentClown) {
                    if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                        clown.vx = Math.max(clown.vx - 0.2, -4);
                    }
                    if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                        clown.vx = Math.min(clown.vx + 0.2, 4);
                    }
                }
                // Check balloon collisions
                this.checkBalloonCollisions(clown);
                // Check seesaw landing
                this.checkSeesawLanding(clown, i);
                // Check ground collision (lose life)
                if (clown.y + clown.height >= this.config.height - 20) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                    }
                    else {
                        this.resetClown(clown, i);
                    }
                }
                // Check side boundaries
                if (clown.x < 0 || clown.x + clown.width > this.config.width) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                    }
                    else {
                        this.resetClown(clown, i);
                    }
                }
            }
        }
    }
    checkBalloonCollisions(clown) {
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            if (!balloon.popped &&
                clown.x < balloon.x + balloon.width &&
                clown.x + clown.width > balloon.x &&
                clown.y < balloon.y + balloon.height &&
                clown.y + clown.height > balloon.y) {
                // Pop balloon
                balloon.popped = true;
                balloon.popAnimation = 20;
                this.score += balloon.value;
                // Create pop particles
                this.createPopParticles(balloon.x + balloon.width / 2, balloon.y + balloon.height / 2, balloon.color);
                // Small bounce for clown
                clown.vy *= -0.3;
            }
        }
    }
    checkSeesawLanding(clown, clownIndex) {
        const seesawTop = this.seesaw.fulcrum.y - 10;
        const leftX = this.seesaw.leftSide.x;
        const rightX = this.seesaw.rightSide.x;
        if (clown.y + clown.height >= seesawTop &&
            clown.y + clown.height <= seesawTop + 20 &&
            clown.x + clown.width / 2 >= leftX &&
            clown.x + clown.width / 2 <= rightX) {
            // Land on seesaw
            clown.onSeesaw = true;
            clown.vy = 0;
            clown.vx = 0;
            // Position clown on correct side
            if (clownIndex === 0) {
                clown.x = this.seesaw.leftSide.x - clown.width / 2;
                clown.y = this.seesaw.leftSide.y - clown.height;
            }
            else {
                clown.x = this.seesaw.rightSide.x - clown.width / 2;
                clown.y = this.seesaw.rightSide.y - clown.height;
            }
            // Launch other clown if they're on seesaw
            const otherClown = this.clowns[1 - clownIndex];
            if (otherClown.onSeesaw) {
                otherClown.onSeesaw = false;
                otherClown.vy = -this.seesawBounce * 1.2; // Extra bounce
                otherClown.vx = (Math.random() - 0.5) * 3;
            }
            // Reset seesaw angle gradually
            this.seesaw.angle *= 0.7;
            this.updateSeesawPositions();
        }
    }
    resetClown(clown, clownIndex) {
        clown.onSeesaw = true;
        clown.vy = 0;
        clown.vx = 0;
        if (clownIndex === 0) {
            clown.x = this.seesaw.leftSide.x - clown.width / 2;
            clown.y = this.seesaw.leftSide.y - clown.height;
        }
        else {
            clown.x = this.seesaw.rightSide.x - clown.width / 2;
            clown.y = this.seesaw.rightSide.y - clown.height;
        }
    }
    createPopParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 30 + Math.random() * 20,
                color: color,
                size: 3 + Math.random() * 3
            });
        }
    }
    updateBalloons() {
        // Update pop animations
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            if (balloon.popped) {
                balloon.popAnimation--;
                if (balloon.popAnimation <= 0) {
                    this.balloons.splice(i, 1);
                }
            }
        }
        // Spawn new balloons occasionally
        this.balloonTimer++;
        if (this.balloonTimer >= this.balloonSpawnRate) {
            this.spawnNewBalloon();
            this.balloonTimer = 0;
            this.balloonSpawnRate = Math.max(60, this.balloonSpawnRate - 2); // Spawn faster over time
        }
    }
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
            particle.life++;
            if (particle.life >= particle.maxLife) {
                this.particles.splice(i, 1);
            }
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        this.updateClowns();
        this.updateBalloons();
        this.updateParticles();
        // Check win condition (all initial balloons popped)
        const initialBalloons = this.balloons.filter(b => !b.popped && b.value <= 50);
        if (initialBalloons.length === 0) {
            this.gameState = 'levelComplete';
        }
    }
    render() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);
        // Draw seesaw
        this.ctx.save();
        this.ctx.translate(this.seesaw.fulcrum.x, this.seesaw.fulcrum.y);
        this.ctx.rotate(this.seesaw.angle);
        // Seesaw plank
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-this.seesaw.width / 2, -5, this.seesaw.width, 10);
        this.ctx.restore();
        // Seesaw fulcrum
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.moveTo(this.seesaw.fulcrum.x - 20, this.seesaw.fulcrum.y + 10);
        this.ctx.lineTo(this.seesaw.fulcrum.x, this.seesaw.fulcrum.y - 10);
        this.ctx.lineTo(this.seesaw.fulcrum.x + 20, this.seesaw.fulcrum.y + 10);
        this.ctx.closePath();
        this.ctx.fill();
        // Draw balloons
        for (const balloon of this.balloons) {
            if (!balloon.popped) {
                // Balloon body
                this.ctx.fillStyle = balloon.color;
                this.ctx.beginPath();
                this.ctx.ellipse(balloon.x + balloon.width / 2, balloon.y + balloon.height * 0.7, balloon.width / 2, balloon.height * 0.7, 0, 0, Math.PI * 2);
                this.ctx.fill();
                // Balloon string
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(balloon.x + balloon.width / 2, balloon.y + balloon.height);
                this.ctx.lineTo(balloon.x + balloon.width / 2, balloon.y + balloon.height + 10);
                this.ctx.stroke();
                // Value text
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(balloon.value.toString(), balloon.x + balloon.width / 2, balloon.y + balloon.height / 2 + 3);
            }
            else if (balloon.popAnimation > 0) {
                // Pop animation
                const alpha = balloon.popAnimation / 20;
                this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(balloon.x + balloon.width / 2, balloon.y + balloon.height / 2, (20 - balloon.popAnimation) * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        // Draw particles
        for (const particle of this.particles) {
            const alpha = 1 - (particle.life / particle.maxLife);
            this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Draw clowns
        for (let i = 0; i < this.clowns.length; i++) {
            const clown = this.clowns[i];
            // Clown body
            this.ctx.fillStyle = clown.color;
            this.ctx.fillRect(clown.x, clown.y, clown.width, clown.height);
            // Clown face
            this.ctx.fillStyle = '#FFDBAC';
            this.ctx.fillRect(clown.x + 2, clown.y + 2, clown.width - 4, clown.height / 2 - 2);
            // Clown eyes
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(clown.x + 4, clown.y + 4, 2, 2);
            this.ctx.fillRect(clown.x + clown.width - 6, clown.y + 4, 2, 2);
            // Clown nose
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(clown.x + clown.width / 2, clown.y + 8, 2, 0, Math.PI * 2);
            this.ctx.fill();
            // Current clown indicator
            if (i === this.currentClown) {
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(clown.x - 2, clown.y - 2, clown.width + 4, clown.height + 4);
            }
        }
        // HUD
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Level: ${this.level}`, 10, 65);
        // Current clown indicator
        this.ctx.fillText(`Clown: ${this.currentClown + 1}`, this.config.width - 100, 25);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'levelComplete') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Level Complete!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Launch clowns from the seesaw to pop balloons!', this.config.width / 2, this.config.height - 115);
            this.ctx.fillText('Launch: Space or tap', this.config.width / 2, this.config.height - 95);
            this.ctx.fillText('Switch clown: A/D or ←/→', this.config.width / 2, this.config.height - 75);
            this.ctx.fillText('Steer in air: A/D or ←/→', this.config.width / 2, this.config.height - 55);
            this.ctx.fillText('Land on seesaw to bounce the other clown!', this.config.width / 2, this.config.height - 35);
            this.ctx.textAlign = 'left';
        }
    }
}

class ElevatorAction extends GameEngine {
    constructor(container, config = {}) {
        const elevatorConfig = {
            ...config,
            width: config.width || 600,
            height: config.height || 400
        };
        super(container, elevatorConfig);
        this.enemies = [];
        this.elevators = [];
        this.floors = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.secretDoors = 0;
        this.secretsCollected = 0;
        this.buildingHeight = 400;
        this.floorHeight = 50;
        this.numFloors = 8;
        this.initGame();
    }
    initGame() {
        this.buildingHeight = this.config.height;
        this.floorHeight = this.buildingHeight / this.numFloors;
        this.player = {
            x: 50,
            y: this.buildingHeight - this.floorHeight - 20,
            vx: 0,
            vy: 0,
            width: 12,
            height: 18,
            floor: 0,
            inElevator: false,
            facing: 'right',
            shootCooldown: 0,
            health: 100
        };
        this.enemies = [];
        this.elevators = [];
        this.floors = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.secretsCollected = 0;
        this.generateBuilding();
        this.spawnEnemies();
    }
    generateBuilding() {
        this.floors = [];
        this.secretDoors = 0;
        // Create floors
        for (let i = 0; i < this.numFloors; i++) {
            const floorY = this.buildingHeight - (i + 1) * this.floorHeight;
            const doors = [];
            // Add secret doors randomly (2-4 per level)
            if (i > 0 && i < this.numFloors - 1 && Math.random() < 0.6) {
                const doorX = 100 + Math.random() * (this.config.width - 200);
                doors.push({
                    x: doorX,
                    y: floorY,
                    width: 20,
                    height: this.floorHeight - 10,
                    open: false,
                    secret: true,
                    collected: false
                });
                this.secretDoors++;
            }
            this.floors.push({
                y: floorY,
                width: this.config.width,
                doors: doors
            });
        }
        // Create elevators
        this.elevators = [];
        const elevatorPositions = [150, this.config.width / 2, this.config.width - 150];
        for (const x of elevatorPositions) {
            this.elevators.push({
                x: x,
                y: this.buildingHeight - this.floorHeight,
                width: 30,
                height: this.floorHeight - 10,
                targetFloor: 0,
                currentFloor: 0,
                moving: false,
                speed: 2
            });
        }
    }
    spawnEnemies() {
        const enemyCount = 3 + this.level;
        for (let i = 0; i < enemyCount; i++) {
            const floor = 1 + Math.floor(Math.random() * (this.numFloors - 2));
            const x = 50 + Math.random() * (this.config.width - 100);
            const type = Math.random() < 0.7 ? 'agent' : 'assassin';
            this.enemies.push({
                x: x,
                y: this.buildingHeight - (floor + 1) * this.floorHeight - 20,
                vx: (Math.random() - 0.5) * 2,
                vy: 0,
                width: 12,
                height: 18,
                floor: floor,
                health: type === 'assassin' ? 2 : 1,
                shootCooldown: 0,
                color: type === 'assassin' ? '#8B0000' : '#FF4500',
                type: type,
                lastPlayerSeen: 0
            });
        }
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.gameState === 'levelComplete') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.level++;
                this.initGame();
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.shoot();
        }
        if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
            this.useElevator('up');
        }
        if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
            this.useElevator('down');
        }
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        if (this.gameState === 'levelComplete') {
            this.level++;
            this.initGame();
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const deltaX = x - playerCenterX;
        const deltaY = y - playerCenterY;
        // Determine action based on touch position
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            if (deltaY < -30) {
                this.useElevator('up');
            }
            else if (deltaY > 30) {
                this.useElevator('down');
            }
            else {
                this.shoot();
            }
        }
        else {
            if (deltaX > 0) {
                this.player.facing = 'right';
                this.player.vx = 2;
            }
            else {
                this.player.facing = 'left';
                this.player.vx = -2;
            }
        }
    }
    handleTouchEnd(event) {
        super.handleTouchEnd(event);
        this.player.vx = 0;
    }
    shoot() {
        if (this.player.shootCooldown > 0)
            return;
        const vx = this.player.facing === 'right' ? 6 : -6;
        this.bullets.push({
            x: this.player.x + (this.player.facing === 'right' ? this.player.width : 0),
            y: this.player.y + this.player.height / 2,
            vx: vx,
            vy: 0,
            fromPlayer: true,
            active: true
        });
        this.player.shootCooldown = 15;
    }
    useElevator(direction) {
        // Find closest elevator
        let closestElevator = null;
        let closestDistance = Infinity;
        for (const elevator of this.elevators) {
            if (Math.abs(elevator.currentFloor - this.player.floor) === 0) {
                const distance = Math.abs(elevator.x + elevator.width / 2 - this.player.x - this.player.width / 2);
                if (distance < closestDistance && distance < 40) {
                    closestDistance = distance;
                    closestElevator = elevator;
                }
            }
        }
        if (closestElevator && !closestElevator.moving) {
            if (direction === 'up' && closestElevator.currentFloor < this.numFloors - 1) {
                closestElevator.targetFloor = closestElevator.currentFloor + 1;
                closestElevator.moving = true;
                this.player.inElevator = true;
            }
            else if (direction === 'down' && closestElevator.currentFloor > 0) {
                closestElevator.targetFloor = closestElevator.currentFloor - 1;
                closestElevator.moving = true;
                this.player.inElevator = true;
            }
        }
    }
    updatePlayer() {
        // Horizontal movement
        if (this.config.useKeyboard && !this.player.inElevator) {
            this.player.vx = 0;
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.player.vx = -2;
                this.player.facing = 'left';
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.player.vx = 2;
                this.player.facing = 'right';
            }
        }
        // Apply movement
        if (!this.player.inElevator) {
            this.player.x += this.player.vx;
            // Keep player on current floor
            this.player.y = this.buildingHeight - (this.player.floor + 1) * this.floorHeight - this.player.height;
            // Clamp to screen bounds
            this.player.x = Math.max(10, Math.min(this.config.width - this.player.width - 10, this.player.x));
        }
        // Check door interactions
        this.checkDoorInteractions();
        this.player.shootCooldown = Math.max(0, this.player.shootCooldown - 1);
    }
    checkDoorInteractions() {
        const currentFloor = this.floors[this.player.floor];
        for (const door of currentFloor.doors) {
            if (this.player.x < door.x + door.width &&
                this.player.x + this.player.width > door.x &&
                Math.abs(this.player.y - door.y) < 30) {
                if (door.secret && !door.collected) {
                    door.collected = true;
                    door.open = true;
                    this.secretsCollected++;
                    this.score += 500;
                }
            }
        }
    }
    updateElevators() {
        for (const elevator of this.elevators) {
            if (elevator.moving) {
                const targetY = this.buildingHeight - (elevator.targetFloor + 1) * this.floorHeight;
                const dy = targetY - elevator.y;
                if (Math.abs(dy) <= elevator.speed) {
                    elevator.y = targetY;
                    elevator.currentFloor = elevator.targetFloor;
                    elevator.moving = false;
                    // Update player if in elevator
                    if (this.player.inElevator) {
                        this.player.floor = elevator.currentFloor;
                        this.player.y = elevator.y - this.player.height;
                        this.player.inElevator = false;
                    }
                }
                else {
                    elevator.y += Math.sign(dy) * elevator.speed;
                    // Move player with elevator
                    if (this.player.inElevator) {
                        this.player.y += Math.sign(dy) * elevator.speed;
                    }
                }
            }
        }
    }
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.health <= 0) {
                this.score += enemy.type === 'assassin' ? 200 : 100;
                this.enemies.splice(i, 1);
                continue;
            }
            // Simple AI - patrol and shoot at player
            enemy.x += enemy.vx;
            // Bounce off floor edges
            if (enemy.x <= 10 || enemy.x >= this.config.width - enemy.width - 10) {
                enemy.vx *= -1;
            }
            // Keep enemy on their floor
            enemy.y = this.buildingHeight - (enemy.floor + 1) * this.floorHeight - enemy.height;
            // Check if can see player (same floor)
            if (enemy.floor === this.player.floor) {
                const canSee = Math.abs(enemy.y - this.player.y) < 30;
                if (canSee) {
                    enemy.lastPlayerSeen = 60; // Remember for 1 second
                    // Turn toward player
                    if (this.player.x > enemy.x) {
                        enemy.vx = Math.abs(enemy.vx);
                    }
                    else {
                        enemy.vx = -Math.abs(enemy.vx);
                    }
                    // Shoot at player
                    enemy.shootCooldown--;
                    if (enemy.shootCooldown <= 0) {
                        const vx = this.player.x > enemy.x ? 4 : -4;
                        this.bullets.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            vx: vx,
                            vy: 0,
                            fromPlayer: false,
                            active: true
                        });
                        enemy.shootCooldown = 90 + Math.random() * 60;
                    }
                }
            }
            enemy.lastPlayerSeen = Math.max(0, enemy.lastPlayerSeen - 1);
        }
    }
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            // Check enemy collisions (player bullets only)
            if (bullet.fromPlayer) {
                for (const enemy of this.enemies) {
                    if (bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.width &&
                        bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.height) {
                        enemy.health--;
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
            else {
                // Check player collision (enemy bullets)
                if (bullet.x >= this.player.x && bullet.x <= this.player.x + this.player.width &&
                    bullet.y >= this.player.y && bullet.y <= this.player.y + this.player.height) {
                    this.player.health -= 25;
                    this.bullets.splice(i, 1);
                    if (this.player.health <= 0) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameState = 'gameOver';
                        }
                        else {
                            this.player.health = 100;
                            this.player.x = 50;
                            this.player.floor = 0;
                            this.player.y = this.buildingHeight - this.floorHeight - this.player.height;
                        }
                    }
                }
            }
            // Remove bullets that go off screen
            if (bullet.x < 0 || bullet.x > this.config.width) {
                this.bullets.splice(i, 1);
            }
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        this.updatePlayer();
        this.updateElevators();
        this.updateEnemies();
        this.updateBullets();
        // Check win condition
        if (this.secretsCollected >= this.secretDoors && this.player.floor === this.numFloors - 1) {
            this.gameState = 'levelComplete';
        }
    }
    render() {
        // Building background
        this.ctx.fillStyle = '#2F2F2F';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw floors
        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < this.numFloors; i++) {
            const y = this.buildingHeight - (i + 1) * this.floorHeight;
            this.ctx.fillRect(0, y + this.floorHeight - 5, this.config.width, 5);
            // Floor number
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${i + 1}`, 5, y + 15);
            this.ctx.fillStyle = '#8B4513';
        }
        // Draw elevators
        this.ctx.fillStyle = '#696969';
        for (const elevator of this.elevators) {
            this.ctx.fillRect(elevator.x, elevator.y, elevator.width, elevator.height);
            // Elevator shaft
            this.ctx.strokeStyle = '#444444';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(elevator.x, 0, elevator.width, this.buildingHeight);
            // Elevator doors
            this.ctx.fillStyle = '#C0C0C0';
            this.ctx.fillRect(elevator.x + 2, elevator.y + 2, elevator.width - 4, elevator.height - 4);
        }
        // Draw secret doors
        for (let i = 0; i < this.floors.length; i++) {
            const floor = this.floors[i];
            for (const door of floor.doors) {
                if (door.secret) {
                    this.ctx.fillStyle = door.collected ? '#00FF00' : door.open ? '#FFFF00' : '#FF0000';
                    this.ctx.fillRect(door.x, door.y, door.width, door.height);
                    // Door handle
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(door.x + door.width - 5, door.y + door.height / 2 - 2, 3, 4);
                }
            }
        }
        // Draw enemies
        for (const enemy of this.enemies) {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Enemy face
            this.ctx.fillStyle = '#FFDBAC';
            this.ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height / 2);
            // Enemy eyes
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(enemy.x + 3, enemy.y + 4, 2, 2);
            this.ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 4, 2, 2);
        }
        // Draw player
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Player face
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, this.player.height / 2);
        // Player eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 4, 2, 2);
        this.ctx.fillRect(this.player.x + this.player.width - 5, this.player.y + 4, 2, 2);
        // Draw bullets
        this.ctx.fillStyle = '#FFFF00';
        for (const bullet of this.bullets) {
            this.ctx.fillStyle = bullet.fromPlayer ? '#00FF00' : '#FF0000';
            this.ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 2);
        }
        // HUD
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, this.config.height - 80);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, this.config.height - 60);
        this.ctx.fillText(`Secrets: ${this.secretsCollected}/${this.secretDoors}`, 10, this.config.height - 40);
        this.ctx.fillText(`Floor: ${this.player.floor + 1}`, 10, this.config.height - 20);
        // Health bar
        const healthWidth = 100;
        const healthHeight = 10;
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(this.config.width - 120, this.config.height - 40, healthWidth, healthHeight);
        this.ctx.fillStyle = this.player.health > 50 ? '#00FF00' : this.player.health > 25 ? '#FFFF00' : '#FF0000';
        this.ctx.fillRect(this.config.width - 120, this.config.height - 40, (healthWidth * this.player.health) / 100, healthHeight);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Mission Failed!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'levelComplete') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Mission Complete!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap for next mission', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, 20, this.config.width - 40, 120);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Infiltrate the building and collect all secret documents!', this.config.width / 2, 45);
            this.ctx.fillText('Move: A/D or ←/→', this.config.width / 2, 65);
            this.ctx.fillText('Use elevator: W/S or ↑/↓', this.config.width / 2, 85);
            this.ctx.fillText('Shoot: Space or tap', this.config.width / 2, 105);
            this.ctx.fillText('Collect all secrets then reach the top floor!', this.config.width / 2, 125);
            this.ctx.textAlign = 'left';
        }
    }
}

class DigDug extends GameEngine {
    constructor(container, config = {}) {
        const digdugConfig = {
            ...config,
            width: config.width || 512,
            height: config.height || 384
        };
        super(container, digdugConfig);
        this.enemies = [];
        this.pump = null;
        this.rocks = [];
        this.tunnels = [];
        this.grid = []; // true = dirt, false = tunnel
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.cellSize = 16;
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.initGame();
    }
    initGame() {
        this.gridWidth = Math.floor(this.config.width / this.cellSize);
        this.gridHeight = Math.floor(this.config.height / this.cellSize);
        this.player = {
            x: 0,
            y: this.cellSize,
            vx: 0,
            vy: 0,
            width: this.cellSize - 2,
            height: this.cellSize - 2,
            facing: 'right',
            pumping: false,
            pumpCooldown: 0
        };
        this.enemies = [];
        this.pump = null;
        this.rocks = [];
        this.tunnels = [];
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing';
        this.generateLevel();
    }
    generateLevel() {
        // Initialize grid with dirt
        this.grid = [];
        for (let x = 0; x < this.gridWidth; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[x][y] = y > 0; // Top row is always air
            }
        }
        // Create starting tunnel
        this.digTunnel(0, 1, 4, 1);
        // Generate enemies
        const enemyCount = 2 + this.level;
        for (let i = 0; i < enemyCount; i++) {
            const type = Math.random() < 0.6 ? 'pooka' : 'fygar';
            const x = (2 + Math.random() * (this.gridWidth - 4)) * this.cellSize;
            const y = (3 + Math.random() * (this.gridHeight - 5)) * this.cellSize;
            this.enemies.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                width: this.cellSize - 2,
                height: this.cellSize - 2,
                type: type,
                color: type === 'pooka' ? '#FF6B6B' : '#4ECDC4',
                health: 1,
                maxHealth: 1,
                inflated: 0,
                maxInflated: 4,
                stunned: 0,
                lastMove: 0,
                ghost: false,
                ghostTimer: 0
            });
        }
        // Generate rocks
        const rockCount = 3 + Math.floor(this.level / 2);
        for (let i = 0; i < rockCount; i++) {
            const x = (1 + Math.random() * (this.gridWidth - 2)) * this.cellSize;
            const y = (2 + Math.random() * (this.gridHeight / 2)) * this.cellSize;
            this.rocks.push({
                x: x,
                y: y,
                width: this.cellSize,
                height: this.cellSize,
                falling: false,
                vy: 0
            });
        }
    }
    digTunnel(gridX, gridY, width, height) {
        for (let x = gridX; x < Math.min(gridX + width, this.gridWidth); x++) {
            for (let y = gridY; y < Math.min(gridY + height, this.gridHeight); y++) {
                if (x >= 0 && y >= 0) {
                    this.grid[x][y] = false;
                }
            }
        }
    }
    isInTunnel(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }
        return !this.grid[gridX][gridY];
    }
    handleKeyDown(event) {
        super.handleKeyDown(event);
        if (this.gameState === 'gameOver') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.initGame();
            }
            return;
        }
        if (this.gameState === 'levelComplete') {
            if (this.isKeyPressed('START', event) || event.key === ' ') {
                this.level++;
                this.generateLevel();
                this.gameState = 'playing';
            }
            return;
        }
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.startPump();
        }
    }
    handleKeyUp(event) {
        super.handleKeyUp(event);
        if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
            this.stopPump();
        }
    }
    handleTouchStart(event) {
        super.handleTouchStart(event);
        if (this.gameState === 'gameOver') {
            this.initGame();
            return;
        }
        if (this.gameState === 'levelComplete') {
            this.level++;
            this.generateLevel();
            this.gameState = 'playing';
            return;
        }
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        const deltaX = x - playerCenterX;
        const deltaY = y - playerCenterY;
        // Determine direction or pump
        if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
            this.startPump();
        }
        else {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.player.facing = deltaX > 0 ? 'right' : 'left';
                this.player.vx = deltaX > 0 ? 1 : -1;
                this.player.vy = 0;
            }
            else {
                this.player.facing = deltaY > 0 ? 'down' : 'up';
                this.player.vx = 0;
                this.player.vy = deltaY > 0 ? 1 : -1;
            }
        }
    }
    handleTouchEnd(event) {
        super.handleTouchEnd(event);
        this.player.vx = 0;
        this.player.vy = 0;
        this.stopPump();
    }
    startPump() {
        if (this.pump || this.player.pumpCooldown > 0)
            return;
        this.player.pumping = true;
        let targetX = this.player.x;
        let targetY = this.player.y;
        switch (this.player.facing) {
            case 'up':
                targetY -= this.cellSize * 3;
                break;
            case 'down':
                targetY += this.cellSize * 3;
                break;
            case 'left':
                targetX -= this.cellSize * 3;
                break;
            case 'right':
                targetX += this.cellSize * 3;
                break;
        }
        this.pump = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            targetX: targetX + this.player.width / 2,
            targetY: targetY + this.player.height / 2,
            active: true,
            connectedEnemy: null
        };
    }
    stopPump() {
        this.player.pumping = false;
        if (this.pump) {
            if (this.pump.connectedEnemy) {
                this.pump.connectedEnemy.inflated = 0;
            }
            this.pump = null;
            this.player.pumpCooldown = 30;
        }
    }
    updatePlayer() {
        if (this.player.pumping)
            return;
        // Movement
        if (this.config.useKeyboard) {
            this.player.vx = 0;
            this.player.vy = 0;
            if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
                this.player.vx = -1;
                this.player.facing = 'left';
            }
            if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
                this.player.vx = 1;
                this.player.facing = 'right';
            }
            if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
                this.player.vy = -1;
                this.player.facing = 'up';
            }
            if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
                this.player.vy = 1;
                this.player.facing = 'down';
            }
        }
        // Apply movement
        const newX = this.player.x + this.player.vx * 2;
        const newY = this.player.y + this.player.vy * 2;
        // Check bounds
        if (newX >= 0 && newX + this.player.width <= this.config.width) {
            this.player.x = newX;
        }
        if (newY >= 0 && newY + this.player.height <= this.config.height) {
            this.player.y = newY;
        }
        // Dig tunnels
        if (this.player.vx !== 0 || this.player.vy !== 0) {
            const gridX = Math.floor(this.player.x / this.cellSize);
            const gridY = Math.floor(this.player.y / this.cellSize);
            this.digTunnel(gridX, gridY, 1, 1);
        }
        this.player.pumpCooldown = Math.max(0, this.player.pumpCooldown - 1);
    }
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            // Check if enemy should explode
            if (enemy.inflated >= enemy.maxInflated) {
                this.score += enemy.type === 'fygar' ? 200 : 100;
                this.enemies.splice(i, 1);
                continue;
            }
            // Update stunned state
            if (enemy.stunned > 0) {
                enemy.stunned--;
                continue;
            }
            // Ghost mode (can move through dirt)
            if (enemy.ghost) {
                enemy.ghostTimer--;
                if (enemy.ghostTimer <= 0) {
                    enemy.ghost = false;
                }
            }
            // AI Movement
            enemy.lastMove++;
            if (enemy.lastMove > 30) {
                const playerDistance = Math.sqrt(Math.pow(this.player.x - enemy.x, 2) +
                    Math.pow(this.player.y - enemy.y, 2));
                // Move toward player if close and in tunnel, otherwise random
                if (playerDistance < 100 && (this.isInTunnel(enemy.x, enemy.y) || enemy.ghost)) {
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        enemy.vx = dx > 0 ? 1 : -1;
                        enemy.vy = 0;
                    }
                    else {
                        enemy.vx = 0;
                        enemy.vy = dy > 0 ? 1 : -1;
                    }
                }
                else if (enemy.ghost || Math.random() < 0.3) {
                    // Random movement or become ghost
                    if (!enemy.ghost && !this.isInTunnel(enemy.x, enemy.y) && Math.random() < 0.1) {
                        enemy.ghost = true;
                        enemy.ghostTimer = 300; // 5 seconds
                    }
                    const directions = [
                        { vx: 0, vy: -1 },
                        { vx: 0, vy: 1 },
                        { vx: -1, vy: 0 },
                        { vx: 1, vy: 0 }
                    ];
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    enemy.vx = dir.vx;
                    enemy.vy = dir.vy;
                }
                enemy.lastMove = 0;
            }
            // Apply movement
            const speed = enemy.ghost ? 1.5 : 1;
            const newX = enemy.x + enemy.vx * speed;
            const newY = enemy.y + enemy.vy * speed;
            // Check if can move (tunnel or ghost mode)
            const canMove = enemy.ghost || this.isInTunnel(newX + enemy.width / 2, newY + enemy.height / 2);
            if (canMove) {
                if (newX >= 0 && newX + enemy.width <= this.config.width) {
                    enemy.x = newX;
                }
                if (newY >= 0 && newY + enemy.height <= this.config.height) {
                    enemy.y = newY;
                }
            }
            // Check collision with player
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                this.lives--;
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                }
                else {
                    // Reset player position
                    this.player.x = 0;
                    this.player.y = this.cellSize;
                }
            }
            // Reduce inflation over time
            if (enemy.inflated > 0) {
                enemy.inflated = Math.max(0, enemy.inflated - 0.02);
            }
        }
    }
    updatePump() {
        if (!this.pump)
            return;
        const dx = this.pump.targetX - this.pump.x;
        const dy = this.pump.targetY - this.pump.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
            const speed = 8;
            this.pump.x += (dx / distance) * speed;
            this.pump.y += (dy / distance) * speed;
        }
        // Check for enemy collision
        if (!this.pump.connectedEnemy) {
            for (const enemy of this.enemies) {
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y + enemy.height / 2;
                if (Math.sqrt(Math.pow(this.pump.x - enemyCenterX, 2) +
                    Math.pow(this.pump.y - enemyCenterY, 2)) < 20) {
                    this.pump.connectedEnemy = enemy;
                    break;
                }
            }
        }
        // Inflate connected enemy
        if (this.pump.connectedEnemy) {
            this.pump.connectedEnemy.inflated += 0.1;
            this.pump.connectedEnemy.stunned = 60;
        }
    }
    updateRocks() {
        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const rock = this.rocks[i];
            // Check if rock should fall
            if (!rock.falling) {
                const belowClear = !this.grid[Math.floor(rock.x / this.cellSize)][Math.floor((rock.y + rock.height) / this.cellSize)];
                if (belowClear) {
                    rock.falling = true;
                    rock.vy = 0;
                }
            }
            if (rock.falling) {
                rock.vy += 0.5; // Gravity
                rock.y += rock.vy;
                // Check collision with ground or dirt
                const gridY = Math.floor((rock.y + rock.height) / this.cellSize);
                if (gridY >= this.gridHeight || this.grid[Math.floor(rock.x / this.cellSize)][gridY]) {
                    rock.falling = false;
                    rock.vy = 0;
                    rock.y = gridY * this.cellSize - rock.height;
                    // Check if rock hits player
                    if (this.player.x < rock.x + rock.width &&
                        this.player.x + this.player.width > rock.x &&
                        this.player.y < rock.y + rock.height &&
                        this.player.y + this.player.height > rock.y) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameState = 'gameOver';
                        }
                        else {
                            this.player.x = 0;
                            this.player.y = this.cellSize;
                        }
                    }
                    // Check if rock hits enemies
                    for (let j = this.enemies.length - 1; j >= 0; j--) {
                        const enemy = this.enemies[j];
                        if (enemy.x < rock.x + rock.width &&
                            enemy.x + enemy.width > rock.x &&
                            enemy.y < rock.y + rock.height &&
                            enemy.y + enemy.height > rock.y) {
                            this.score += 1000;
                            this.enemies.splice(j, 1);
                        }
                    }
                }
            }
        }
    }
    update() {
        if (this.gameState !== 'playing')
            return;
        this.updatePlayer();
        this.updateEnemies();
        this.updatePump();
        this.updateRocks();
        // Check win condition
        if (this.enemies.length === 0) {
            this.gameState = 'levelComplete';
        }
    }
    render() {
        // Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
        // Draw dirt
        this.ctx.fillStyle = '#8B4513';
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (this.grid[x][y]) {
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
        // Draw tunnels (slightly different color)
        this.ctx.fillStyle = '#654321';
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                if (!this.grid[x][y] && y > 0) {
                    this.ctx.strokeStyle = '#8B4513';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
        // Draw rocks
        this.ctx.fillStyle = '#696969';
        for (const rock of this.rocks) {
            this.ctx.fillRect(rock.x, rock.y, rock.width, rock.height);
            // Rock highlight
            this.ctx.fillStyle = '#A9A9A9';
            this.ctx.fillRect(rock.x + 2, rock.y + 2, rock.width - 4, rock.height - 4);
            this.ctx.fillStyle = '#696969';
        }
        // Draw enemies
        for (const enemy of this.enemies) {
            const size = enemy.width + enemy.inflated * 4;
            const offsetX = (size - enemy.width) / 2;
            const offsetY = (size - enemy.height) / 2;
            // Enemy body
            this.ctx.fillStyle = enemy.ghost ? `${enemy.color}80` : enemy.color;
            this.ctx.fillRect(enemy.x - offsetX, enemy.y - offsetY, size, size);
            // Enemy eyes
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(enemy.x + 2, enemy.y + 2, 3, 3);
            this.ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 2, 3, 3);
            // Enemy pupils
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(enemy.x + 3, enemy.y + 3, 1, 1);
            this.ctx.fillRect(enemy.x + enemy.width - 4, enemy.y + 3, 1, 1);
            // Fygar fire breath
            if (enemy.type === 'fygar' && Math.random() < 0.1) {
                this.ctx.fillStyle = '#FF4500';
                this.ctx.fillRect(enemy.x + enemy.width, enemy.y + 4, 8, 6);
            }
        }
        // Draw pump
        if (this.pump) {
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
            this.ctx.lineTo(this.pump.x, this.pump.y);
            this.ctx.stroke();
            // Pump head
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(this.pump.x, this.pump.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Draw player
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Player face
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, this.player.height / 2);
        // Player eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 4, 2, 2);
        this.ctx.fillRect(this.player.x + this.player.width - 5, this.player.y + 4, 2, 2);
        // Player direction indicator
        this.ctx.fillStyle = '#FFFFFF';
        let dirX = this.player.x + this.player.width / 2;
        let dirY = this.player.y + this.player.height / 2;
        switch (this.player.facing) {
            case 'up':
                dirY -= 6;
                break;
            case 'down':
                dirY += 6;
                break;
            case 'left':
                dirX -= 6;
                break;
            case 'right':
                dirX += 6;
                break;
        }
        this.ctx.fillRect(dirX - 1, dirY - 1, 2, 2);
        // HUD
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Level: ${this.level}`, 10, 65);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 85);
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.gameState === 'levelComplete') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.width, this.config.height);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Level Complete!', this.config.width / 2, this.config.height / 2 - 20);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        else if (this.score === 0) {
            // Instructions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Dig tunnels and defeat enemies with your pump!', this.config.width / 2, this.config.height - 115);
            this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, this.config.height - 95);
            this.ctx.fillText('Pump: Space (hold to inflate enemies)', this.config.width / 2, this.config.height - 75);
            this.ctx.fillText('Watch out for falling rocks!', this.config.width / 2, this.config.height - 55);
            this.ctx.fillText('Eliminate all enemies to advance', this.config.width / 2, this.config.height - 35);
            this.ctx.textAlign = 'left';
        }
    }
}

const WaitingGame = ({ game, config = {}, autoStart = true, className, style }) => {
    const containerRef = useRef(null);
    const gameInstanceRef = useRef(null);
    useEffect(() => {
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
            case 'donkeykong':
                gameInstance = new DonkeyKong(containerRef.current, config);
                break;
            case 'qbert':
                gameInstance = new Qbert(containerRef.current, config);
                break;
            case 'kaboom':
                gameInstance = new Kaboom(containerRef.current, config);
                break;
            case 'adventure':
                gameInstance = new Adventure(containerRef.current, config);
                break;
            case 'missilecommand':
                gameInstance = new MissileCommand(containerRef.current, config);
                break;
            case 'joust':
                gameInstance = new Joust(containerRef.current, config);
                break;
            case 'lunarlander':
                gameInstance = new LunarLander(containerRef.current, config);
                break;
            case 'battlezone':
                gameInstance = new Battlezone(containerRef.current, config);
                break;
            case 'berzerk':
                gameInstance = new Berzerk(containerRef.current, config);
                break;
            case 'circusatari':
                gameInstance = new CircusAtari(containerRef.current, config);
                break;
            case 'elevatoraction':
                gameInstance = new ElevatorAction(containerRef.current, config);
                break;
            case 'digdug':
                gameInstance = new DigDug(containerRef.current, config);
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
        case 'donkeykong':
            return new DonkeyKong(container, config);
        case 'qbert':
            return new Qbert(container, config);
        case 'kaboom':
            return new Kaboom(container, config);
        case 'adventure':
            return new Adventure(container, config);
        case 'missilecommand':
            return new MissileCommand(container, config);
        case 'joust':
            return new Joust(container, config);
        case 'lunarlander':
            return new LunarLander(container, config);
        case 'battlezone':
            return new Battlezone(container, config);
        case 'berzerk':
            return new Berzerk(container, config);
        case 'circusatari':
            return new CircusAtari(container, config);
        case 'elevatoraction':
            return new ElevatorAction(container, config);
        case 'digdug':
            return new DigDug(container, config);
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
    Frogger,
    DonkeyKong,
    Qbert,
    Kaboom,
    Adventure,
    MissileCommand,
    Joust,
    LunarLander,
    Battlezone,
    Berzerk,
    CircusAtari,
    ElevatorAction,
    DigDug
};

export { Adventure, Asteroids, Battlezone, Berzerk, Breakout, CircusAtari, DigDug, DonkeyKong, ElevatorAction, Frogger, Joust, Kaboom, LunarLander, MissileCommand, PacMan, Pong, Qbert, Snake, SpaceInvaders, Tetris, WaitingGame, createGame, index as default };
