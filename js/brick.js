class Brick {
    constructor(x, y, width, height, type, hp) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.hp = hp;
    }

    isUnbreakable() {
        return this.type === "steel";
    }

    isBreaked() {
        return this.hp <= 0;
    }

    hit() {
        if (this.isUnbreakable()) return;
        this.hp--;
    }

    getColor() {
        if (this.type === "steel") return COLORS.brickSteel;
        if (this.type === "multi") return COLORS.brickMulti;
        if (this.type === "3") return COLORS.brick3;
        if (this.type === "2") return COLORS.brick2;
        return COLORS.brick1;
    }

    draw(context) {
        context.fillStyle = this.getColor();
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}