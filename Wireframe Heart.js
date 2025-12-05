const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");

let animationId;
let rotation = 0;
let pulseScale = 1;
let pulseDirection = 1;

const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
resize();
window.addEventListener("resize", resize);

const generateHeartPoints = (gridSize = 30) => {
    const points = [];
    for (let u = 0; u <= gridSize; u++) {
        for (let v = 0; v <= gridSize; v++) {
            const uParam = (u / gridSize) * Math.PI * 2;
            const vParam = (v / gridSize) * Math.PI;

            const x = Math.pow(Math.sin(uParam), 3) * Math.sin(vParam);
            const y =
                (13 * Math.cos(uParam) -
                    5 * Math.cos(2 * uParam) -
                    2 * Math.cos(3 * uParam) -
                    Math.cos(4 * uParam)) /
                16 *
                Math.sin(vParam);
            const z = Math.cos(vParam) * 0.3;

            points.push({ x, y, z, u, v });
        }
    }
    return points;
};

const points = generateHeartPoints(35);
const gridSize = 36;

const shootingStars = [];
const createShootingStar = () => {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        speed: Math.random() * 8 + 4,
        length: Math.random() * 60 + 40,
        angle: Math.random() * Math.PI / 4 + Math.PI / 4,
        life: 1,
    };
};

for (let i = 0; i < 5; i++) {
    shootingStars.push(createShootingStar());
}

let auraScale = 1;
let auraDirection = 1;

const ripples = [];
let rippleTimer = 0;

const rotateY = (point, angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: point.x * cos - point.z * sin,
        y: point.y,
        z: point.x * sin + point.z * cos,
    };
};

const project = (point, scale, offsetX, offsetY) => {
    const perspective = 4;
    const z = point.z + perspective;

    return {
        x: (point.x * scale * 400) / z + offsetX,
        y: (-point.y * scale * 400) / z + offsetY,
        z: point.z,
    };
};

const animate = () => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) / 400;

    rotation += 0.0785;

    pulseScale += 0.003 * pulseDirection;
    if (pulseScale > 1.08 || pulseScale < 0.95) pulseDirection *= -1;

    auraScale += 0.005 * auraDirection;
    if (auraScale > 1.3 || auraScale < 1.0) auraDirection *= -1;

    const auraSize = 300 * auraScale;
    const auraGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraSize);
    auraGradient.addColorStop(0, "rgba(0, 212, 255, 0.2)");
    auraGradient.addColorStop(0.5, "rgba(0, 153, 255, 0.1)");
    auraGradient.addColorStop(1, "rgba(0, 102, 255, 0)");
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
    ctx.fill();

    rippleTimer++;
    if (rippleTimer > 40) {
        ripples.push({ radius: 0, alpha: 1 });
        rippleTimer = 0;
    }

    ctx.shadowBlur = 0;
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += 4;
        ripple.alpha -= 0.02;
        if (ripple.alpha <= 0) {
            ripples.splice(i, 1);
            continue;
        }

        for (let j = 0; j < 3; j++) {
            ctx.strokeStyle = `rgba(0, 212, 255, ${ripple.alpha * (0.5 - j * 0.15)})`;
            ctx.lineWidth = 2.5 - j * 0.5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ripple.radius + j * 8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    shootingStars.forEach((star, index) => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= 0.008;

        if (star.life <= 0 || star.x > canvas.width || star.y > canvas.height) {
            shootingStars[index] = createShootingStar();
        }

        const gradient = ctx.createLinearGradient(
            star.x,
            star.y,
            star.x - Math.cos(star.angle) * star.length,
            star.y - Math.sin(star.angle) * star.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.life})`);
        gradient.addColorStop(0.3, `rgba(0, 212, 255, ${star.life * 0.7})`);
        gradient.addColorStop(1, "rgba(0, 212, 255, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
            star.x - Math.cos(star.angle) * star.length,
            star.y - Math.sin(star.angle) * star.length
        );
        ctx.stroke();
    });

    const projectedPoints = points.map((p) => {
        const rotated = rotateY(p, rotation);
        const pulsed = {
            x: rotated.x * pulseScale,
            y: rotated.y * pulseScale,
            z: rotated.z * pulseScale,
        };
        return project(pulsed, scale, centerX, centerY);
    });

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 400);
    gradient.addColorStop(0, "#00d4ff");
    gradient.addColorStop(0.5, "#0099ff");
    gradient.addColorStop(1, "#0066ff");

    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00d4ff";
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;

    for (let v = 0; v < gridSize; v++) {
        ctx.beginPath();
        for (let u = 0; u < gridSize; u++) {
            const idx = v * gridSize + u;
            const point = projectedPoints[idx];
            if (u === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }

    for (let u = 0; u < gridSize; u++) {
        ctx.beginPath();
        for (let v = 0; v < gridSize; v++) {
            const idx = v * gridSize + u;
            const point = projectedPoints[idx];
            if (v === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    for (let i = 0; i < 80; i++) {
        const angle = (rotation * 2 + i * 0.4) % (Math.PI * 2);
        const radius = 250 + Math.sin(rotation * 3 + i) * 50;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const size = 2 + Math.sin(rotation * 4 + i) * 1.5;

        ctx.fillStyle = `rgba(0, 212, 255, ${
            0.4 + Math.sin(rotation * 2 + i) * 0.4
        })`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        if (Math.sin(rotation * 3 + i) > 0.7) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.beginPath();
            ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    animationId = requestAnimationFrame(animate);
};

animate();

