/**
 * Lobster Mario Assets
 * SVG-based sprites for the game.
 */

const Sprites = {
    drawLobster(ctx, x, y, width, height, facing, frame) {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        if (facing === -1) ctx.scale(-1, 1);

        const color = '#e63946';
        const darkColor = '#a82a33';

        // Legs (wobble based on frame)
        const legWobble = Math.sin(frame * 0.2) * 5;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-10, 5 + i * 8);
            ctx.lineTo(-25, 10 + i * 8 + legWobble);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, 5 + i * 8);
            ctx.lineTo(25, 10 + i * 8 + legWobble);
            ctx.stroke();
        }

        // Tail
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(-15, 30);
        ctx.lineTo(15, 30);
        ctx.closePath();
        ctx.fill();

        // Body (Segments)
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(0, 15 - i * 12, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = darkColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Head
        ctx.beginPath();
        ctx.arc(0, -15, 15, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-6, -20, 4, 0, Math.PI * 2);
        ctx.arc(6, -20, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-6, -21, 2, 0, Math.PI * 2);
        ctx.arc(6, -21, 2, 0, Math.PI * 2);
        ctx.fill();

        // Claws
        const clawAngle = Math.sin(frame * 0.1) * 0.5;

        // Left Claw
        ctx.save();
        ctx.translate(-15, -10);
        ctx.rotate(-0.5 + clawAngle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, -10, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right Claw
        ctx.save();
        ctx.translate(15, -10);
        ctx.rotate(0.5 - clawAngle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, -10, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Antennae
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -28);
        ctx.quadraticCurveTo(-15, -50, -30, -45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, -28);
        ctx.quadraticCurveTo(15, -50, 30, -45);
        ctx.stroke();

        ctx.restore();
    },

    drawCrab(ctx, x, y, width, height, frame) {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);

        const color = '#ffb703';
        const darkColor = '#fb8500';

        // Legs
        const legWobble = Math.sin(frame * 0.3) * 5;
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 4;
        for (let i = -1; i <= 1; i += 2) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.moveTo(i * 10, j * 5);
                ctx.lineTo(i * 30, j * 5 + legWobble * i);
                ctx.stroke();
            }
        }

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkColor;
        ctx.stroke();

        // Eyes on stalks
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -10); ctx.lineTo(-10, -25);
        ctx.moveTo(10, -10); ctx.lineTo(10, -25);
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-10, -25, 5, 0, Math.PI * 2);
        ctx.arc(10, -25, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-10, -25, 2, 0, Math.PI * 2);
        ctx.arc(10, -25, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    drawPearl(ctx, x, y, width, height, frame) {
        ctx.save();
        const floatY = Math.sin(frame * 0.1) * 5;
        ctx.translate(x + width / 2, y + height / 2 + floatY);

        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Pearl
        ctx.fillStyle = '#f1faee';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.beginPath();
        ctx.arc(-3, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    drawTreasureChest(ctx, x, y, width, height, frame) {
        ctx.save();
        const floatY = Math.sin(frame * 0.05) * 3;
        ctx.translate(x + width / 2, y + height / 2 + floatY);

        const woodColor = '#8d6e63';
        const darkWood = '#5d4037';
        const goldColor = '#ffd700';

        // Base
        ctx.fillStyle = woodColor;
        ctx.fillRect(-width / 2, -height / 4, width, height / 2);
        ctx.strokeStyle = darkWood;
        ctx.strokeRect(-width / 2, -height / 4, width, height / 2);

        // Lid
        ctx.beginPath();
        ctx.arc(0, -height / 4, width / 2, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Gold trim
        ctx.fillStyle = goldColor;
        ctx.fillRect(-width / 2, -height / 4, 5, height / 2);
        ctx.fillRect(width / 2 - 5, -height / 4, 5, height / 2);
        ctx.fillRect(-2, -5, 4, 10); // Lock

        ctx.restore();
    },

    drawShrimp(ctx, x, y, width, height, frame) {
        ctx.save();
        const floatY = Math.sin(frame * 0.1) * 3;
        ctx.translate(x + width / 2, y + height / 2 + floatY);

        ctx.fillStyle = '#ff8a65'; // Shrimp pink
        // Curved body
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI, true);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#e64a19';
        ctx.stroke();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-10, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};
