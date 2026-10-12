class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');

        this.paddle = new Paddle(DEF_PAD_W);
        this.balls = [];
        this.newBalls = [];
        this.bricks = [];

        this.levelIndex = 0;
        this.level = LEVELS[0];
        this.score = 0;
        this.lives = MAX_LIVES;
        this.currSpd = 0;

        this.state = "ready";
        this.isPaused = false;

        this.getElements();
        this.createLevelBtns();
        this.bindEvs();
        this.loadLevel(0);

        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    getElements() {
        this.btnPause = document.getElementById("btnPause");
        this.pauseIcon = document.getElementById("pauseIcon");
        this.levelButtonsBox = document.getElementById("levelBtns");
        this.levelNameEl = document.getElementById("levelName");
        this.livesEl = document.getElementById("lives");
        this.scoreEl = document.getElementById("score");
        this.speedEl = document.getElementById("speed");
        this.overlay = document.getElementById("overlay");
        this.overlayTitle = document.getElementById("overlayTitle");
        this.overlayText = document.getElementById("overlayText");
        this.btnReplay = document.getElementById("btnReplay");
        this.btnNext = document.getElementById("btnNext");
    }

    createLevelBtns() {
        this.levelBtns = [];
        for (let i = 0; i < LEVELS.length; i++) {
            const btn = document.createElement("button");
            btn.className = "btn level-btn";
            btn.textContent = i + 1;
            btn.title = "Level " + (i + 1) + ": " + LEVELS[i].name;
            btn.addEventListener("click", () => {
                this.loadLevel(i);
                btn.blur();
            })
            this.levelButtonsBox.appendChild(btn);
            this.levelBtns.push(btn);
        }
    }

    bindEvs() {
        // keyboard
        document.addEventListener("keydown", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.paddle.movingLeft = true;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.paddle.movingRight = true;
            if (e.code === "Space") {
                e.preventDefault();
                this.launchBall();
            }
            if (e.code === "KeyP") this.togglePause();
        });
        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.paddle.movingLeft = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.paddle.movingRight = false;
        });

        // Chuột 
        this.canvas.addEventListener("mousemove", (e) => this.movePaddleByPointer(e.clientX));
        this.canvas.addEventListener("click", () => this.launchBall());

        // Btns
        this.btnPause.addEventListener("click", () => {
            this.togglePause();
            this.btnPause.blur();
        });
        this.btnReplay.addEventListener("click", () => {
            this.loadLevel(this.levelIndex);
            this.btnReplay.blur();
        });
        this.btnNext.addEventListener("click", () => {
            this.loadLevel(this.levelIndex + 1);
            this.btnNext.blur();
        });
    }

    movePaddleByPointer(clientX) {
        if (this.isPaused) return;
        const rect = this.canvas.getBoundingClientRect();
        const scale = CAN_W/ rect.width;
        this.paddle.moveToX((clientX - rect.left) * scale);
    }

    loadLevel(index) {
        this.levelIndex = index;
        this.level = LEVELS[index];
        this.score = 0;
        this.lives = MAX_LIVES;
        this.isPaused = false;

        this.paddle.setWidth(this.level.padW);
        this.bricks = this.createBricks(this.level.layout);
        this.resetBall();

        this.hideOverlay();
        this.updatePauseIcon();
        this.updateLevelButtons();
        this.updateHud();
    }

    createBricks(layout) {
        const bricks = [];
        const setting = BRICK_SETTING;

        for (let row = 0; row < layout.length; row++) {
            for (let col = 0; col < layout[row].length; col++) {
                const char = layout[row][col];
                if (char === ".") continue;

                const x = setting.offsetLeft + col * (setting.width + setting.gap);
                const y = setting.offsetTop + row * (setting.height + setting.gap);

                if (char === "X") {
                    bricks.push(new Brick(x, y, setting.width, setting.height, "steel", Infinity));
                } else if (char === "M") {
                    bricks.push(new Brick(x, y, setting.width, setting.height, "multi", 1));
                } else {
                    bricks.push(new Brick(x, y, setting.width, setting.height, "normal", Number(char)));
                }
            }
        }
        return bricks;
    }

    resetBall() {
        this.currSpd = this.level.ballsSpd;
        this.balls = [new Ball(this.paddle.getCenterX(), this.paddle.y - BALL_RAD, BALL_RAD)];
        this.newBalls = [];
        this.state = "ready";
    }

    updateHud() {
        if (this.levelNameEl) this.levelNameEl.textContent = "Level " + (this.levelIndex + 1) + ": " + this.level.name;
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.speedEl) this.speedEl.textContent = this.currSpd.toFixed(1);

        // Hiển thị số mạng
        if (this.livesEl) {
            let heartsHtml = "";
            for (let i = 0; i < this.lives; i++) {
                heartsHtml += '<i class="fa-solid fa-heart"></i> ';
            }
            this.livesEl.innerHTML = heartsHtml;
        }
    }

    draw() {
        const context = this.context;
        context.fillStyle = COLORS.bg;
        context.fillRect(0, 0, CAN_W, CAN_H);
        for (const brick of this.bricks) {
            brick.draw(context);
        }
        this.paddle.draw(context);
        for (const ball of this.balls) {
            ball.draw(context);
        }

        if (this.state === "ready" && !this.isPaused) {
            this.drawText("Space hoặc click để bắn bóng", 460, false);
        }
        if (this.isPaused) {
            this.drawText("TẠM NGƯNG", CAN_H / 2, true);
        }
    }

    launchBall() {
        if (this.state !== "ready" || this.isPaused) return;
        const ball = this.balls[0];
        const angle = (Math.random() * 40 - 22) * Math.PI / 180;
        ball.dx = this.currSpd * Math.sin(angle);
        ball.dy = this.currSpd * Math.cos(angle);
        this.state = "playing";
    }


    //  Vòng lặp game
    gameLoop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        const step = Math.min(deltaTime / 16.67, 2);


        if (!this.isPaused) {
            this.update(step);
        }
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(step) {
        this.paddle.update(step);

        if (this.state === "ready") {
            this.balls[0].x = this.paddle.getCenterX();
            this.balls[0].y = this.paddle.y - BALL_RAD;
            return;
        }
        if (this.state !== "playing") return;
        for (const ball of this.balls) {
            ball.update(step);
            this.checkPaddleCollision(ball);
            this.checkBrickCollision(ball);
        }
        this.balls = this.balls.concat(this.newBalls);
        this.newBalls = [];
        this.bricks = this.bricks.filter((brick) => !brick.isBreaked());
        this.balls = this.balls.filter((ball) => ball.y - ball.radius < CAN_H);

        if (this.balls.length === 0) {
            this.loseLife();
        } else if (this.isLevelCleared()) {
            this.winLevel();
        }
        this.updateHud();
    }

    checkPaddleCollision(ball) {
        if (ball.dy <= 0) return;   // lên = pass

        const p = this.paddle;
        const touchY = ball.y + ball.radius >= p.y && ball.y - ball.radius <= p.y + p.height;
        const touchX = ball.x >= p.x - ball.radius && ball.x <= p.x + p.width + ball.radius;
        if (!touchY || !touchX) return;

        // hitPos từ -1 (mép trái) đến 1 (mép phải): càng xa tâm, bóng càng nảy xiên
        let hitPos = (ball.x - p.getCenterX())/(p.width / 2);
        if (hitPos < -1) hitPos = -1;
        if (hitPos > 1) hitPos = 1;

        const angle = hitPos * MAX_BOUNCE_ANGLE;
        const speed = ball.getSpeed();
        ball.dx = speed * Math.sin(angle);
        ball.dy = -speed * Math.cos(angle);
        ball.y = p.y - ball.radius;
    }

    checkBrickCollision(ball) {
        for (const brick of this.bricks) {
            if (brick.isBreaked()) continue;
            if (!this.isBallTouchingBrick(ball, brick)) continue;

            this.bounceBallOffBrick(ball, brick);
            this.onBrickHit(ball, brick);
            return;
        }
    }

    // Mất mạng/Thắng
    loseLife() {
        this.lives--;
        if (this.lives > 0) {
            this.resetBall();
        } else {
            this.state = "lost";
            //show kq
            this.showOverlay("Game Over", "Điểm của bạn: " + this.score, false);
        }
    }

    isLevelCleared() {
        return this.bricks.every((brick) => brick.isUnbreakable());
    }

    winLevel() {
        this.state = "won";
        this.showOverlay("Hoàn thành Level " + (this.levelIndex + 1), "Điểm: " + this.score, true);
    }

    isBallTouchingBrick(ball, brick) {
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        return distX * distX + distY * distY < ball.radius * ball.radius;
    }

    bounceBallOffBrick(ball, brick) {
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;

        if (Math.abs(distX) > Math.abs(distY)) {
            // Chạm cạnh trái or phải
            if (distX > 0) {
                ball.dx = Math.abs(ball.dx);
                ball.x = brick.x + brick.width + ball.radius;
            } else {
                ball.dx = -Math.abs(ball.dx);
                ball.x = brick.x - ball.radius;
            }
        } else if (distY !== 0) {
            // Chạm cạnh trên or dưới
            if (distY > 0) {
                ball.dy = Math.abs(ball.dy);
                ball.y = brick.y + brick.height + ball.radius;
            } else {
                ball.dy = -Math.abs(ball.dy);
                ball.y = brick.y - ball.radius;
            }
        } else {
            // Trường hợp tâm bóng nằm trong gạch
            ball.dy = -ball.dy;
        }
    }

    onBrickHit(ball, brick) {
        if (brick.isUnbreakable()) return;

        brick.hit();
        this.score += 10;

        // thêm các loại khác sau này
    }
    // Thông báo kq
    showOverlay(title, text, showNextButton) {
        this.overlayTitle.textContent = title;
        this.overlayText.textContent = text;
        this.btnNext.classList.toggle("hidden", !showNextButton);
        this.overlay.classList.remove("hidden");
    }

    hideOverlay() {
        this.overlay.classList.add("hidden");
    }

    togglePause() {
        if (this.state === "won" || this.state === "lost") return;
        this.isPaused = !this.isPaused;
        this.updatePauseIcon();
    }

    updatePauseIcon() {
        if (this.isPaused) {
            this.pauseIcon.className = "fa-solid fa-play";
        } else {
            this.pauseIcon.className = "fa-solid fa-pause";
        }
    }

    updateLevelButtons() {
        for (let i = 0; i < this.levelBtns.length; i++) {
            this.levelBtns[i].classList.toggle("active", i === this.levelIndex);
        }
    }
    drawText(text, y, withBox) {
        const context = this.context;
        context.font = "bold 20px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";

        if (withBox) {
            const boxW = context.measureText(text).width + 40;
            context.fillStyle = COLORS.textBoxBg;
            context.fillRect((CAN_W - boxW) / 2, y - 24, boxW, 48);
        }
        context.fillStyle = COLORS.text;
        context.fillText(text, CAN_W / 2, y);
    }
}
window.addEventListener("load", () => {
    const canvas = document.getElementById("gameCanvas");
    if (canvas) {
        window.game = new Game(canvas);
    }
});