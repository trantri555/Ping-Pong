const CAN_W = 680;
const CAN_H = 640;

const MAX_LIVES = 3;
const BALL_RAD = 9;
const MAX_BALL = 9;
const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; //góc bật 60 độ giữ bóng ko đi ngang khi chạm méo paddle làm chờ lâu
const MIN_Y_RATIO = 0.3;
const DEF_PAD_W = 100;

const COLORS = {
    bg: "#222f3e",
    pad: "#f368e0",       // hồng
    ball: "#ffffff",         // trắng
    brick1: "#48dbfb",     // xanh lơ  - gạch 1
    brick2: "#ff9f43",     // cam      - gạch 2
    brick3: "#ee5253",     // đỏ       - gạch 3
    brickSteel: "#8395a7",   // xám      - gạch bất tử
    brickMulti: "#1dd1a1",   // xanh lá  - gạch sinh thêm bóng
    text: "#ffffff",
    textBoxBg: "#1b2430"
};

const BRICK_SETTING = {
    cols: 12,
    width: 50,
    height: 20,
    gap: 4,
    offsetTop: 50
};

const brickTotalW = BRICK_SETTING.cols * BRICK_SETTING.width + BRICK_SETTING.gap * (BRICK_SETTING.cols - 1);
BRICK_SETTING.offsetLeft = (CAN_W - brickTotalW) / 2; //căn gap canvas - bricks

const LEVELS = [{
    name: "Cơ bản",
    ballsSpd: 4.5,
    spdUpPerHit: 0,
    maxSpd: 4.5,
    padW: DEF_PAD_W,
    layout: [
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111",
        "111111111111"
    ]
}];

