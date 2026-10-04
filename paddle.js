class Paddle {
    constructor(width) {
        this.width = width;
        this.height = 12;
        this.x = (CAN_W - this.width) / 2;
        this.y = CAN_H - 40;
        this.padSpd = 10;
        this.moveLeft = false;
        this.moveRight = false;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    // Đổi kích thước pad nhưng vẫn giữ nguyên tâm
    setWidth(newWidth) {
        const center = this.getCenterX();
        this.width = newWidth;
        this.x = center - newWidth / 2;
        this.keepInside();
    }

    // Di chuyển pad theo vị trí chuột
    moveToX(centerX) {
        this.x = centerX - this.width / 2;
        this.keepInside();
    }

    // Không cho pad ra khỏi màn chơi
    keepInside() {
        if (this.x < 0) this.x = 0; //left
        if (this.x + this.width > CAN_W) this.x = CAN_H- this.width; //right
    }

    update(step) {
        if (this.moveLeft) this.x -= this.padSpd * step;
        if (this.moveRight) this.x += this.padSpd * step;
        this.keepInside();
    }

    draw(context) {
        context.fillStyle = COLORS.pad;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}