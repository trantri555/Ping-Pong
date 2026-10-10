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
        this.levelDescEl = document.getElementById("levelDesc");
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
            btn.textContent = i+1;
            btn.addEventListener("click", () => {
                this.loadLevel(i);
                btn.blur();
            })
            this.levelButtonsBox.appendChild(btn);
            this.levelBtns.push(btn);
        }
    }

    bindEvs() {
        
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

        this.updateHud();
    }

    createBricks(layout) {
        const bricks = [];
        const setting = BRICK_SETTING;

        for(let row = 0; row < layout.length; row++) {
            for(let col = 0; col < layout[row].length; col++) {
                const char = layout[row][col];
                if (char === ".") continue;

                const x = setting.offsetLeft + col * (setting.width + setting.gap);
                const y = setting.offsetTop + row * (setting.height +setting.gap);

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

        // Hiển thị số mạng bằng icon trái tim
        if (this.livesEl) {
            let heartsHtml = "";
            for (let i = 0; i < this.lives; i++) {
                heartsHtml += '<i class="fa-solid fa-heart"></i> ';
            }
            this.livesEl.innerHTML = heartsHtml;
        }
    }

    draw() {
        const ctx = this.context;

        // Xóa/tô màu nền cho canvas
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, CAN_W, CAN_H);

        // Vẽ từng viên gạch trong mảng
        for (const brick of this.bricks) {
            brick.draw(ctx);
        }

        // Vẽ thanh đỡ (paddle)
        this.paddle.draw(ctx);

        // Vẽ bóng
        for (const ball of this.balls) {
            ball.draw(ctx);
        }
    }

    // ----- Vòng lặp game -----
    gameLoop(time) {
        // step = 1 nghĩa là đúng 1 frame ở 60fps, giúp game chạy đều trên màn hình 60Hz / 144Hz
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        const step = Math.min(deltaTime / 16.67, 2);

        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}