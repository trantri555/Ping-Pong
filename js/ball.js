class Ball{
    constructor(x,y,radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = 0;
        this.dy = 0;
    }

    // pytagon
    getSpeed() {
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    }

    setSpeed(newSpeed) {
        const currSpeed = this.getSpeed();
        if (currSpeed === 0) return;
        this.dx = this.dx / currSpeed * newSpeed;
        this.dy = this.dy / currSpeed * newSpeed;
    }

    update(step) {
        this.x += this.dx * step;
        this.y += this.dy * step;

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = Math.abs(this.dx);
        }
        if (this.x + this.radius > CAN_W) {
            this.x = CAN_W - this.radius;
            this.dx = -Math.abs(this.dx);
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = Math.abs(this.dy);
        }

    }

    draw(ctx) {
        ctx.fillStyle = COLORS.ball;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}