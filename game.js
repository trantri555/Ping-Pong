const CAN_W = 900;
const CAN_H = 940;

const MAX_LIVES = 3;
const BALL_RAD = 15;
const MAX_BALL = 5;
const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; //góc bật 60
const DEF_PAD_W = 100;
const SHIELD_TIME = 10 * 60;   // khiên 10s

const COLORS = {
    bg: "#f1f2f6",
    pad: "#5f27cd",
    ball: "#1e272e",
    brick1: "#2e86de",
    brick2: "#ff9f43",
    brick3: "#ee5253",
    brickSteel: "#747d8c",
    brickShield: "#a4b0be",
    brickMulti: "#10ac84",
    portalIn: "#6c5ce7",
    portalOut: "#00cec9",
    text: "#2f3542",
    textBoxBg: "#ced6e0"
};

const BRICK_ICONS = {
    multi: "\uf055",
    shield: "\uf132",
    portalIn: "\uf0ec",
    portalOut: "\uf0ec"
};

const BRICK_SETTING = {
    cols: 11,
    width: 75,
    height: 40,
    gap: 4,
    offsetTop: 50
};

const brickTotalW = BRICK_SETTING.cols * BRICK_SETTING.width + BRICK_SETTING.gap * (BRICK_SETTING.cols - 1);
BRICK_SETTING.offsetLeft = (CAN_W - brickTotalW) / 2; //căn gap canvas - bricks

const LEVELS = [{
    name: "Cơ bản",
    ballsSpd: 5.5,
    spdUpPerHit: 0,
    maxSpd: 5.5,
    padW: DEF_PAD_W,
    layout: [
        ".....1.....",
        "....111....",
        "...11111...",
        "..1111111..",
        ".111111111.",
        "11111111111",
        ".111111111.",
        "..1111111..",
        "...11111...",
        "....111....",
        ".....1....."
    ]
},
{
    name: "Gạch cứng hơn",
    ballsSpd: 6.0,
    spdUpPerHit: 0,
    maxSpd: 5.5,
    padW: DEF_PAD_W,
    layout: [
        ".121X1X121.",
        ".121X1X121.",
        ".121X1X121.",
        ".121X1X121.",
        ".121X1X121.",
        ".121X1X121.",
        ".121X1X121."
    ]
}, {
    name: "X3 bóng + Tốc độ bóng tăng dần",
    ballsSpd: 6.0,
    spdUpPerHit: 0.1,
    maxSpd: 9,
    padW: DEF_PAD_W,
    layout: [
        "...22222...",
        "22223332222",
        ".111111111.",
        ".1XX111XX1.",
        ".1XX111XX1.",
        ".112M1M211.",
        ".112111211.",
        ".112111211."
    ]
}, {
    name: "Gạch di chuyển + Khiên",
    ballsSpd: 6.0,
    spdUpPerHit: 0,
    maxSpd: 6.0,
    moveSpd: 2.5,     // tốc độ gạch steel di chuyển
    moveRange: 120,   // gạch chạy qua lại quanh vị trí gốc
    padW: DEF_PAD_W,
    layout: [
        "11111111111",
        "12222222221",
        "111S111S111",
        "1.M.....M.1",
        "1..>>.....1",
        "1.........1",
        "1.....<<..1",
        "11111111111",
        "11111111111"
    ]
},
{
    name: "Gạch ẩn hiện + Thanh đỡ co giãn",
    ballsSpd: 6.0,
    spdUpPerHit: 0,
    maxSpd: 6.0,
    toggleTime: 3 * 60,   // 3s toggle
    padMinW: 50,          // tầm co giãn
    padMaxW: 120,
    padChangeSpd: 0.5,    // pixel đổi mỗi frame
    padW: DEF_PAD_W,
    layout: [
        "....111....",
        "...12221...",
        "...12321...",
        "...12221...",
        ".X..111..X.",
        "..X.....X..",
        ".111...111.",
        "12221X12221",
        "12M21X12S21",
        "12221X12221",
        ".111...111.",
        "..X.....X..",
        ".X...X...X."

    ]
},
{
    name: "Cổng dịch chuyển",
    ballsSpd: 6.0,
    spdUpPerHit: 0,
    maxSpd: 6.0,
    padW: DEF_PAD_W,
    portals: [
        { inChar: "A", outChar: "a" },
        { inChar: "B", outChar: "b" }
    ],
    layout: [
        "33333X33333",
        "11111X11111",
        "33M33X33M33",
        "X1111X1111X",
        "X3333X3333X",
        "...........",
        "X.b.....a.X",
        "X.........X",
        "X1111X1111X",
        "X3333X3333X",
        "...........",
        "A.........B",
        "..........."
    ]
}

];

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');

        this.paddle = this.createPaddle(DEF_PAD_W);
        this.balls = [];
        this.newBalls = [];
        this.bricks = [];
        this.portals = [];

        this.levelIndex = 0;
        this.level = LEVELS[0];
        this.score = 0;
        this.lives = MAX_LIVES;
        this.currSpd = 0;
        this.shieldTime = 0;
        this.steelHidden = false;
        this.toggleTimer = 0;       // đếm ngược tới lần ẩn/hiện tiếp theo
        this.padDir = 1;

        this.state = "ready";
        this.isPaused = false;

        this.getElements();
        this.createLevelBtns();
        this.bindEvs();
        this.loadLevel(0);

        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Ball
    createBall(x, y, radius) {
        return {
            x: x,
            y: y,
            radius: radius,
            dx: 0,
            dy: 0,
            lastPortal: null
        };
    }

    // pytagon
    getBallSpeed(ball) {
        return Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    }

    // đổi tốc độ nhưng giữ nguyên hướng bay
    setBallSpeed(ball, newSpeed) {
        const currSpeed = this.getBallSpeed(ball);
        if (currSpeed === 0) return;
        ball.dx = ball.dx / currSpeed * newSpeed;
        ball.dy = ball.dy / currSpeed * newSpeed;
    }

    updateBall(ball, step) {
        ball.x += ball.dx * step;
        ball.y += ball.dy * step;

        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
        }
        if (ball.x + ball.radius > CAN_W) {
            ball.x = CAN_W - ball.radius;
            ball.dx = -Math.abs(ball.dx);
        }
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
        }
    }

    drawBall(ball) {
        const context = this.context;
        context.fillStyle = COLORS.ball;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();
    }

    // Brick
    createBrick(x, y, width, height, type, hp) {
        return {
            x: x,
            y: y,
            width: width,
            height: height,
            type: type,
            hp: hp,
            startX: x,          // vị trí gốc (gạch di chuyển)
            moveDir: 0,         // 0 = đứng yên, 1 = sang phải, -1 = sang trái
            isShield: false,
            isHidden: false,
            portalGroup: null
        };
    }

    isBrickUnbreakable(brick) {
        return brick.type === "steel" || brick.type === "portalIn" || brick.type === "portalOut";
    }

    isBrickBreaked(brick) {
        return brick.hp <= 0;
    }

    hitBrick(brick) {
        if (this.isBrickUnbreakable(brick)) return;
        brick.hp--;
    }

    getBrickColor(brick) {
        if (brick.type === "shield") return COLORS.brickShield;
        if (brick.type === "steel") return COLORS.brickSteel;
        if (brick.type === "multi") return COLORS.brickMulti;
        if (brick.type === "portalIn") return COLORS.portalIn;
        if (brick.type === "portalOut") return COLORS.portalOut;
        if (brick.hp === 3 || brick.type === "3") return COLORS.brick3;
        if (brick.hp === 2 || brick.type === "2") return COLORS.brick2;
        return COLORS.brick1;
    }

    drawBrick(brick) {
        if (brick.isHidden) return;
        const context = this.context;
        const cx = brick.x + brick.width / 2;
        const cy = brick.y + brick.height / 2;

        if (brick.type === "portalIn" || brick.type === "portalOut") {
            const baseColor = brick.type === "portalIn" ? COLORS.portalIn : COLORS.portalOut;
            context.save();
            context.shadowColor = baseColor;
            context.shadowBlur = 12;
            context.fillStyle = baseColor;
            context.fillRect(brick.x, brick.y, brick.width, brick.height);
            context.restore();
            context.strokeStyle = "#fff";
            context.lineWidth = 2;
            context.strokeRect(brick.x + 1, brick.y + 1, brick.width - 2, brick.height - 2);
            const icon = BRICK_ICONS[brick.type];
            context.fillStyle = "#fff";
            context.font = "900 " + brick.height * 0.5 + 'px "Font Awesome 6 Free"';
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(icon, cx, cy);
            return;
        }

        this.context.fillStyle = this.getBrickColor(brick);
        this.context.fillRect(brick.x, brick.y, brick.width, brick.height);

        const icon = BRICK_ICONS[brick.type];
        if (icon) {
            context.fillStyle = brick.type === "shield" ? COLORS.text : COLORS.bg;
            context.font = "900 " + brick.height * 0.5 + 'px "Font Awesome 6 Free"';
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(icon, cx, cy);
        }
    }

    // Gạch steel di chuyển qua lại quanh vị trí gốc
    updateBricks(step) {
        for (const brick of this.bricks) {
            if (brick.moveDir === 0) continue;
            brick.x += brick.moveDir * this.level.moveSpd * step;

            if (brick.x > brick.startX + this.level.moveRange) {
                brick.x = brick.startX + this.level.moveRange;
                brick.moveDir = -1;
            }
            if (brick.x < brick.startX - this.level.moveRange) {
                brick.x = brick.startX - this.level.moveRange;
                brick.moveDir = 1;
            }
        }
    }

    updateSteelBricks(step) {
        if (!this.level.toggleTime) return;
        this.toggleTimer -= step;
        if (this.toggleTimer > 0) return;

        if (this.steelHidden && this.isBallNearSteel()) return;

        this.steelHidden = !this.steelHidden;
        for (const brick of this.bricks) {
            if (brick.type === "steel") brick.isHidden = this.steelHidden;
        }
        this.toggleTimer = this.level.toggleTime;
    }

    isBallNearSteel() {
        for (const ball of this.balls) {
            for (const brick of this.bricks) {
                if (brick.type !== "steel") continue;
                if (ball.x > brick.x - ball.radius && ball.x < brick.x + brick.width + ball.radius &&
                    ball.y > brick.y - ball.radius && ball.y < brick.y + brick.height + ball.radius) {
                    return true;
                }
            }
        }
        return false;
    }

    // PAddle
    createPaddle(width) {
        return {
            width: width,
            height: 15,
            x: (CAN_W - width) / 2,
            y: CAN_H - 40,
            padSpd: 10,
            moveLeft: false,
            moveRight: false
        };
    }

    getPaddleCenterX() {
        return this.paddle.x + this.paddle.width / 2;
    }

    // Đổi kích thước pad nhưng vẫn giữ nguyên tâm
    setPaddleWidth(newWidth) {
        const center = this.getPaddleCenterX();
        this.paddle.width = newWidth;
        this.paddle.x = center - newWidth / 2;
        this.keepPaddleInside();
    }

    // Di chuyển pad theo vị trí chuột
    movePaddleToX(centerX) {
        this.paddle.x = centerX - this.paddle.width / 2;
        this.keepPaddleInside();
    }

    // Không cho pad ra khỏi màn chơi
    keepPaddleInside() {
        if (this.paddle.x < 0) this.paddle.x = 0; //left
        if (this.paddle.x + this.paddle.width > CAN_W) this.paddle.x = CAN_W - this.paddle.width; //right
    }

    updatePaddle(step) {
        if (this.paddle.moveLeft) this.paddle.x -= this.paddle.padSpd * step;
        if (this.paddle.moveRight) this.paddle.x += this.paddle.padSpd * step;
        this.keepPaddleInside();
    }

    updatePaddleSize(step) {
        if (!this.level.padChangeSpd) return;

        let newWidth = this.paddle.width + this.padDir * this.level.padChangeSpd * step;
        if (newWidth > this.level.padMaxW) {
            newWidth = this.level.padMaxW;
            this.padDir = -1;
        }
        if (newWidth < this.level.padMinW) {
            newWidth = this.level.padMinW;
            this.padDir = 1;
        }
        this.setPaddleWidth(newWidth);
    }

    drawPaddle() {
        this.context.fillStyle = COLORS.pad;
        this.context.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
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
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.paddle.moveLeft = true;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.paddle.moveRight = true;
            if (e.code === "Space") {
                e.preventDefault();
                this.launchBall();
            }
            if (e.code === "KeyP") this.togglePause();
        });
        document.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") this.paddle.moveLeft = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") this.paddle.moveRight = false;
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
        const scale = CAN_W / rect.width;
        this.movePaddleToX((clientX - rect.left) * scale);
    }

    loadLevel(index) {
        this.levelIndex = index;
        this.level = LEVELS[index];
        this.score = 0;
        this.lives = MAX_LIVES;
        this.isPaused = false;

        this.shieldTime = 0;
        this.steelHidden = false;
        this.toggleTimer = this.level.toggleTime;
        this.padDir = 1;
        this.setPaddleWidth(this.level.padW);
        this.bricks = this.createBricks(this.level.layout);
        this.portals = this.buildPortalPairs();
        this.resetBall();

        this.hideOverlay();
        this.updatePauseIcon();
        this.updateLevelButtons();
        this.updateHud();
    }

    createBricks(layout) {
        const bricks = [];
        const setting = BRICK_SETTING;
        const portalDefs = this.level.portals || [];

        const portalInChars = {};
        const portalOutChars = {};
        for (const def of portalDefs) {
            portalInChars[def.inChar] = def.inChar;
            portalOutChars[def.outChar] = def.inChar;
        }

        for (let row = 0; row < layout.length; row++) {
            for (let col = 0; col < layout[row].length; col++) {
                const char = layout[row][col];
                if (char === ".") continue;

                const x = setting.offsetLeft + col * (setting.width + setting.gap);
                const y = setting.offsetTop + row * (setting.height + setting.gap);

                if (char === "X") {
                    bricks.push(this.createBrick(x, y, setting.width, setting.height, "steel", Infinity));
                } else if (char === "M") {
                    bricks.push(this.createBrick(x, y, setting.width, setting.height, "multi", 1));
                } else if (char === "S") {
                    bricks.push(this.createBrick(x, y, setting.width, setting.height, "shield", 1));
                } else if (char === "<" || char === ">") {
                    const brick = this.createBrick(x, y, setting.width, setting.height, "steel", Infinity);
                    brick.moveDir = char === ">" ? 1 : -1;
                    bricks.push(brick);
                } else if (portalInChars[char] !== undefined) {
                    // Cổng vào
                    const brick = this.createBrick(x, y, setting.width, setting.height, "portalIn", Infinity);
                    brick.portalGroup = portalInChars[char];
                    bricks.push(brick);
                } else if (portalOutChars[char] !== undefined) {
                    // Cổng ra
                    const brick = this.createBrick(x, y, setting.width, setting.height, "portalOut", Infinity);
                    brick.portalGroup = portalOutChars[char];
                    bricks.push(brick);
                } else {
                    bricks.push(this.createBrick(x, y, setting.width, setting.height, "normal", Number(char)));
                }
            }
        }
        return bricks;
    }

    // Ghép cặp cổng vào – ra 
    buildPortalPairs() {
        const pairs = [];
        const inMap = {};
        const outMap = {};
        for (const brick of this.bricks) {
            if (brick.type === "portalIn") {
                if (!inMap[brick.portalGroup]) inMap[brick.portalGroup] = [];
                inMap[brick.portalGroup].push(brick);
            }
            if (brick.type === "portalOut") {
                if (!outMap[brick.portalGroup]) outMap[brick.portalGroup] = [];
                outMap[brick.portalGroup].push(brick);
            }
        }
        for (const group in inMap) {
            const ins = inMap[group] || [];
            const outs = outMap[group] || [];
            for (let i = 0; i < ins.length; i++) {
                const outBrick = outs[i] || outs[0];
                if (outBrick && ins[i]) {
                    const inBrick = ins[i];
                    inBrick.portalPartner = outBrick;
                    outBrick.portalPartner = inBrick;
                    pairs.push({ inBrick: inBrick, outBrick: outBrick });
                }
            }
        }
        return pairs;
    }

    resetBall() {
        this.currSpd = this.level.ballsSpd;
        this.balls = [this.createBall(this.getPaddleCenterX(), this.paddle.y - BALL_RAD, BALL_RAD)];
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
            this.drawBrick(brick);
        }
        this.drawPaddle();
        for (const ball of this.balls) {
            this.drawBall(ball);
        }

        if (this.state === "ready" && !this.isPaused) {
            this.drawText("Space hoặc click để bắn bóng", 660, false);
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
        this.updatePaddle(step);
        this.updateBricks(step);

        if (this.state === "ready") {
            this.balls[0].x = this.getPaddleCenterX();
            this.balls[0].y = this.paddle.y - BALL_RAD;
            return;
        }
        if (this.state !== "playing") return;


        this.updateSteelBricks(step);
        this.updatePaddleSize(step);

        for (const ball of this.balls) {
            this.updateBall(ball, step);
            this.checkPaddleCollision(ball);
            this.checkPortalCollision(ball);
            this.checkBrickCollision(ball);
        }
        this.balls = this.balls.concat(this.newBalls);
        this.newBalls = [];
        this.bricks = this.bricks.filter((brick) => !this.isBrickBreaked(brick));
        this.balls = this.balls.filter((ball) => ball.y - ball.radius < CAN_H);

        if (this.shieldTime > 0) {
            this.shieldTime -= step;
            if (this.shieldTime <= 0) {
                // hết 10 giây: bỏ thanh khiên
                this.bricks = this.bricks.filter((brick) => !brick.isShield);
            }
        }

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
        let hitPos = (ball.x - this.getPaddleCenterX()) / (p.width / 2);
        if (hitPos < -1) hitPos = -1;
        if (hitPos > 1) hitPos = 1;

        const angle = hitPos * MAX_BOUNCE_ANGLE;
        const speed = this.getBallSpeed(ball);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -speed * Math.cos(angle);
        ball.y = p.y - ball.radius;
    }

    checkBrickCollision(ball) {
        for (const brick of this.bricks) {
            if (this.isBrickBreaked(brick) || brick.isHidden) continue;
            if (brick.type === "portalIn" || brick.type === "portalOut") continue;
            if (!this.isBallTouchingBrick(ball, brick)) continue;

            this.bounceBallOffBrick(ball, brick);
            this.onBrickHit(ball, brick);
            return;
        }
    }

    checkPortalCollision(ball) {
        for (const brick of this.bricks) {
            if (brick.type !== "portalIn" && brick.type !== "portalOut") continue;
            if (!brick.portalPartner) continue;
            if (brick.isHidden) continue;

            if (ball.lastPortal === brick) continue;

            if (!this.isBallTouchingBrick(ball, brick)) continue;

            const target = brick.portalPartner;
            const spd = this.getBallSpeed(ball);

            if (spd > 0) {
                const nx = ball.dx / spd;
                const ny = ball.dy / spd;
                ball.x = (target.x + target.width / 2) + nx * (target.width / 2 + ball.radius + 3);
                ball.y = (target.y + target.height / 2) + ny * (target.height / 2 + ball.radius + 3);
            } else {
                ball.x = target.x + target.width / 2;
                ball.y = target.y + target.height / 2;
            }

            ball.lastPortal = target;
            return;
        }

        if (ball.lastPortal && !this.isBallTouchingBrick(ball, ball.lastPortal)) {
            ball.lastPortal = null;
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
        return this.bricks.every((brick) => this.isBrickUnbreakable(brick));
    }

    winLevel() {
        this.state = "won";
        this.showOverlay("Hoàn thành Level " + (this.levelIndex + 1), "Điểm: " + this.score, this.levelIndex < LEVELS.length - 1);
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
            // Trường hợp tâm bóng nằm trong gạch: đưa bóng lên trên mặt gạch rồi cho bay lên
            ball.y = brick.y - ball.radius;
            ball.dy = -Math.abs(ball.dy);
        }
    }

    onBrickHit(ball, brick) {
        if (this.isBrickUnbreakable(brick)) return;

        this.hitBrick(brick);
        this.score += 10;

        if (brick.type === "multi" && this.isBrickBreaked(brick)) {
            this.spawnExtraBalls(ball);
        }

        if (brick.type === "shield" && this.isBrickBreaked(brick)) {
            this.activateShield();
        }

        if (this.level.spdUpPerHit > 0) {
            this.increaseSpd();
        }

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

    // Sinh thêm 2 bóng bay lệch 2 bên so với hướng của bóng vừa đập gạch
    spawnExtraBalls(fromBall) {
        const offsets = [-10, 10];   // độ lệch
        const baseAngle = Math.atan2(fromBall.dy, fromBall.dx);

        for (const offset of offsets) {
            if (this.balls.length + this.newBalls.length >= MAX_BALL) break;

            const angle = baseAngle + offset * Math.PI / 180;
            const newBall = this.createBall(fromBall.x, fromBall.y, BALL_RAD);
            newBall.dx = Math.cos(angle) * this.currSpd;
            newBall.dy = Math.sin(angle) * this.currSpd;
            this.newBalls.push(newBall);
        }

    }

    activateShield() {
        if (this.shieldTime <= 0) {
            const y = this.paddle.y + this.paddle.height + 5;
            const brick = this.createBrick(0, y, CAN_W, CAN_H - y, "steel", Infinity);
            brick.isShield = true;
            this.bricks.push(brick);
        }
        this.shieldTime = SHIELD_TIME;
    }

    // Tăng tốc độ cho tất cả bóng
    increaseSpd() {
        this.currSpd = Math.min(this.currSpd + this.level.spdUpPerHit, this.level.maxSpd);
        for (const ball of this.balls) {
            this.setBallSpeed(ball, this.currSpd);
        }
        for (const ball of this.newBalls) {
            this.setBallSpeed(ball, this.currSpd);
        }
    }
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("gameCanvas");
    if (canvas) {
        window.game = new Game(canvas);
    }
});