import * as THREE from "https://esm.sh/three@0.148.0";

const CONFIG = {
    bootMinDelay: 300,
    bootMaxDelay: 800,
    particleDesktop: 50,
    particleMobile: 15
};

let isLiteMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let audioCtx = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function getAudioContext() {
    if (audioCtx) return audioCtx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    return audioCtx;
}

function playUIBeep(freq = 800, type = "sine", duration = 0.08, vol = 0.01) {
    if (isLiteMode || document.hidden) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(Math.max(vol, 0.0001), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function bindAudioEvents() {
    $$(".sound-hover").forEach((el) => {
        el.addEventListener("mouseenter", () => playUIBeep(800, "sine", 0.06, 0.008));
    });

    $$(".sound-click").forEach((el) => {
        el.addEventListener("click", () => playUIBeep(1200, "square", 0.1, 0.018));
    });
}

function applyPerformanceMode() {
    document.body.classList.toggle("lite-mode", isLiteMode);
    const perfToggle = $("#perf-toggle");
    if (!perfToggle) return;

    perfToggle.setAttribute("aria-pressed", String(isLiteMode));
    perfToggle.innerHTML = isLiteMode
        ? "MODE: <span class='glow-green'>LITE</span>"
        : "MODE: <span class='glow-text'>MAX</span>";
}

function setupPerformanceToggle() {
    const perfToggle = $("#perf-toggle");
    if (!perfToggle) return;

    applyPerformanceMode();

    perfToggle.addEventListener("click", () => {
        isLiteMode = !isLiteMode;
        applyPerformanceMode();
        playUIBeep(isLiteMode ? 400 : 1000, "square", 0.15, 0.02);
    });
}

const bootSequenceData = [
    "INITIALIZING SECURE PROXY...",
    "VERIFYING STUDY PROFILE...",
    "LOADING PHYSICS ENGINE...",
    "CALIBRATING NEXUS INTERFACE...",
    "WELCOME TO NEXUS, SHREEYANS."
];

let bootIndex = 0;
let progress = 0;
let bootTimer = null;

function finishBoot() {
    const bootScreen = $("#boot-sequence");
    if (!bootScreen || bootScreen.classList.contains("hidden")) return;

    clearTimeout(bootTimer);
    const progressBar = $(".boot-progress");
    if (progressBar) progressBar.style.width = "100%";

    playUIBeep(1500, "sine", 0.25, 0.03);
    bootScreen.classList.add("hidden");
    initTerminalSidebar();
}

function runBootSequence() {
    const bootText = $("#boot-text");
    const bootProgress = $(".boot-progress");
    if (!bootText || !bootProgress) {
        finishBoot();
        return;
    }

    if (bootIndex < bootSequenceData.length) {
        bootText.textContent = bootSequenceData[bootIndex];
        bootIndex++;
        progress = Math.min(100, (bootIndex / bootSequenceData.length) * 100);
        bootProgress.style.width = `${progress}%`;

        playUIBeep(600 + bootIndex * 100, "sawtooth", 0.06, 0.02);

        const delay = Math.floor(
            Math.random() * (CONFIG.bootMaxDelay - CONFIG.bootMinDelay + 1)
        ) + CONFIG.bootMinDelay;

        bootTimer = window.setTimeout(runBootSequence, delay);
    } else {
        bootTimer = window.setTimeout(finishBoot, 450);
    }
}

function setupBootSequence() {
    $("#boot-skip")?.addEventListener("click", finishBoot);
    window.addEventListener("load", () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(runBootSequence, { timeout: 1000 });
        } else {
            window.setTimeout(runBootSequence, 120);
        }
    }, { once: true });
}

const cursor = $("#custom-cursor");

function setupCustomCursor() {
    if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

    let rafId = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    window.addEventListener("pointermove", (e) => {
        if (isLiteMode) return;
        x = e.clientX;
        y = e.clientY;

        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            rafId = 0;
        });
    }, { passive: true });

    window.addEventListener("pointerdown", () => {
        if (!isLiteMode) document.body.classList.add("clicking");
    });

    window.addEventListener("pointerup", () => document.body.classList.remove("clicking"));
}

function initTerminalSidebar() {
    const termLogs = $("#term-logs");
    if (!termLogs || window.innerWidth <= 1024) return;

    const agent = navigator.userAgent.includes("Android")
        ? "ANDROID"
        : navigator.userAgent.includes("iPhone")
            ? "IOS"
            : "DESKTOP";

    const logsData = [
        "> CONNECTION ESTABLISHED",
        `> AGENT: ${agent}`,
        "> RENDER_TARGET: 60 FPS",
        "> MEMORY_ALLOC: OPTIMAL",
        "> PHYSICS_ENGINE: STANDBY",
        "> LISTENING FOR INPUT..."
    ];

    let logIndex = 0;

    const appendLog = () => {
        if (logIndex >= logsData.length) return;

        const li = document.createElement("li");
        li.textContent = logsData[logIndex];
        termLogs.appendChild(li);
        logIndex++;

        window.setTimeout(appendLog, Math.random() * 700 + 350);
    };

    window.setTimeout(appendLog, 650);
}

function setupSectionUnlocks() {
    const modules = $$(".unlock-module");
    if (!modules.length) return;

    if (!("IntersectionObserver" in window)) {
        modules.forEach((el) => el.classList.add("unlocked"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting || entry.target.classList.contains("unlocked")) return;

            entry.target.classList.add("unlocked");
            const statusText = $(".module-status", entry.target);

            if (statusText) {
                statusText.textContent = "[ MODULE_UNLOCKED ]";
            }

            playUIBeep(900, "square", 0.08, 0.015);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.18 });

    modules.forEach((el) => observer.observe(el));
}

function setupReactor() {
    const container = $("#three-reactor");
    if (!container || window.innerWidth <= 768 || isLiteMode) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(300, 300, false);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.5, 1),
        new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.55
        })
    );
    scene.add(core);

    const particleGeo = new THREE.BufferGeometry();
    const count = 140;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < positions.length; i++) {
        positions[i] = (Math.random() - 0.5) * 5;
    }

    particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    const particles = new THREE.Points(
        particleGeo,
        new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 0.035,
            transparent: true,
            opacity: 0.75
        })
    );

    scene.add(particles);

    let active = true;

    const animate = () => {
        if (!active) return;

        requestAnimationFrame(animate);

        if (document.hidden || isLiteMode) return;

        core.rotation.x += 0.004;
        core.rotation.y += 0.008;
        particles.rotation.y -= 0.0015;
        renderer.render(scene, camera);
    };

    animate();

    const triggerReactor = () => {
        if (isLiteMode) return;

        const ripple = document.createElement("div");
        ripple.className = "reactor-ripple";
        container.appendChild(ripple);

        core.scale.setScalar(1.18);

        window.setTimeout(() => {
            core.scale.setScalar(1);
            ripple.remove();
        }, 350);

        playUIBeep(950, "sine", 0.12, 0.02);
    };

    container.addEventListener("click", triggerReactor);
    container.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerReactor();
        }
    });

    window.addEventListener("beforeunload", () => {
        active = false;
        renderer.dispose();
        core.geometry.dispose();
        core.material.dispose();
        particleGeo.dispose();
        particles.material.dispose();
    }, { once: true });
}

const roles = [
    "COMPUTATIONAL ENGINEER",
    "PHYSICS ENTHUSIAST",
    "WEB EXPERIMENTER",
    "JEE ASPIRANT"
];

function setupTyping() {
    const typedElement = $("#typed-text");
    if (!typedElement) return;

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const typeEffect = () => {
        const current = roles[roleIndex];

        if (!deleting) {
            charIndex++;
            typedElement.textContent = current.slice(0, charIndex);

            if (charIndex === current.length) {
                deleting = true;
                return window.setTimeout(typeEffect, 1800);
            }

            return window.setTimeout(typeEffect, 58);
        }

        charIndex--;
        typedElement.textContent = current.slice(0, charIndex);

        if (charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            return window.setTimeout(typeEffect, 500);
        }

        return window.setTimeout(typeEffect, 28);
    };

    window.setTimeout(typeEffect, 900);
}

function setupNavigation() {
    const mobileBtn = $("#mobile-menu-btn");
    const navLinks = $("#nav-links");
    if (!mobileBtn || !navLinks) return;

    const closeMenu = () => {
        mobileBtn.classList.remove("active");
        navLinks.classList.remove("open");
        mobileBtn.setAttribute("aria-expanded", "false");
    };

    mobileBtn.addEventListener("click", () => {
        const willOpen = !navLinks.classList.contains("open");
        mobileBtn.classList.toggle("active", willOpen);
        navLinks.classList.toggle("open", willOpen);
        mobileBtn.setAttribute("aria-expanded", String(willOpen));
    });

    $$("a", navLinks).forEach((link) => link.addEventListener("click", closeMenu));

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) closeMenu();
    }, { passive: true });

    const sections = $$("main section[id]");
    const links = $$(".nav-links a");

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                links.forEach((link) => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === `#${entry.target.id}`
                    );
                });
            });
        }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });

        sections.forEach((section) => observer.observe(section));
    }
}

function setupTilt() {
    $$(".hover-tilt").forEach((el) => {
        let frame = null;
        let nextX = 0;
        let nextY = 0;

        const reset = () => {
            el.style.transform =
                "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
        };

        el.addEventListener("pointermove", (e) => {
            if (window.innerWidth <= 768 || isLiteMode || e.pointerType === "touch") return;

            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;

            nextX = py * -7;
            nextY = px * 7;

            if (frame) return;

            frame = requestAnimationFrame(() => {
                el.style.transform =
                    `perspective(1000px) rotateX(${nextX}deg) rotateY(${nextY}deg) scale3d(1.01,1.01,1.01)`;
                frame = null;
            });
        });

        el.addEventListener("pointerleave", reset);
    });
}

function setupHUDCanvas() {
    const canvas = $("#hud-canvas");
    if (!canvas || isLiteMode) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { alpha: false });
    if (!offCtx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let raf = 0;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        offscreen.width = Math.floor(width * dpr);
        offscreen.height = Math.floor(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        particles = Array.from({
            length: width < 768 ? CONFIG.particleMobile : CONFIG.particleDesktop
        }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.8 + 0.2,
            speedY: (Math.random() - 0.5) * 0.25,
            opacity: Math.random() * 0.28
        }));

        offCtx.fillStyle = "#030712";
        offCtx.fillRect(0, 0, width, height);

        offCtx.strokeStyle = "rgba(0,240,255,0.035)";
        offCtx.lineWidth = 1;
        offCtx.beginPath();

        for (let x = 0; x <= width; x += 50) {
            offCtx.moveTo(x, 0);
            offCtx.lineTo(x, height);
        }

        for (let y = 0; y <= height; y += 50) {
            offCtx.moveTo(0, y);
            offCtx.lineTo(width, y);
        }

        offCtx.stroke();
    }

    function draw() {
        if (raf) cancelAnimationFrame(raf);

        raf = requestAnimationFrame(draw);

        if (document.hidden || isLiteMode) return;

        ctx.drawImage(offscreen, 0, 0, width, height);
        ctx.fillStyle = "#00f0ff";

        for (const p of particles) {
            p.y += p.speedY;

            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    resize();
    draw();

    window.addEventListener("resize", resize, { passive: true });
}

function setupForm() {
    const form = $("#comms-form");
    const status = $("#form-status");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const button = $("button[type='submit']", form);
        const name = $("#name", form)?.value.trim();
        const email = $("#email", form)?.value.trim();
        const message = $("#message", form)?.value.trim();

        if (!name || !email || !message) return;

        const subject = encodeURIComponent(`NEXUS CORE: Secure Comms from ${name}`);
        const body = encodeURIComponent(
`>>> INCOMING TRANSMISSION <<<

ID_NAME: ${name}
UPLINK_EMAIL: ${email}

DATA_PAYLOAD:
${message}

>>> END TRANSMISSION <<<`
        );

        if (button) {
            button.disabled = true;
            button.textContent = "OPENING SECURE UPLINK...";
        }

        if (status) {
            status.textContent = "Preparing your mail client...";
        }

        playUIBeep(500, "sine", 0.3, 0.025);

        window.setTimeout(() => {
            window.location.href =
                `mailto:Shreeyansraj463@gmail.com?subject=${subject}&body=${body}`;

            if (status) {
                status.textContent = "Mail client launched. Complete the transmission there.";
            }

            form.reset();

            if (button) {
                button.disabled = false;
                button.textContent = "TRANSMIT DATA";
            }

            playUIBeep(1200, "square", 0.12, 0.025);
        }, 500);
    });
}

const aiDatabase = {
    schrodinger: `> A week before the exam, your brain enters a very unstable quantum state.

> Logically, you may feel prepared. Then the mock test arrives and measurement begins.

> Some topics are "I know this" while others become "Why does this chapter exist?"

> The trick is to collapse the uncertainty early. Test yourself before the real measurement.`,

    grind: `> At 2:00 AM, the problem starts feeling personal.

> First: stop staring at it.
> Second: write the given data.
> Third: identify the exact concept.
> Fourth: solve one small piece.

> If the problem is still toxic, switch to an easier question for a reset.

> The goal is not maximum suffering. It is maximum useful thinking.`,

    bribe: `> Chicken biryani has entered the debugging pipeline.

> Step 1: read the error.
> Step 2: trace the logic.
> Step 3: isolate the smallest failing block.
> Step 4: fix it.

> Food is not a compiler, but it can definitely improve morale.`,

    bollywood: `> Hero jumps from a bike, catches a falling object, and lands perfectly.

> Physics check:
> - Relative velocity matters.
> - Horizontal and vertical motion can be analyzed separately.
> - Air resistance changes the trajectory.
> - Landing safely requires a physically reasonable impulse.

> Verdict: cinematic first, physics second.`,

    railway: `> 20 hours on a train is an engineering problem.

> Thermal management: window + ventilation.
> Noise control: headphones.
> Energy optimization: do not overwork continuously.
> Sleep: find a stable position and stop fighting the motion.

> System stability achieved.`,

    error: `> A weird simulation usually has a hidden invariant.

> Freeze the system.
> Compare the last known-good state.
> Change one variable at a time.
> Find the smallest point where reality diverges.

> Debugging is controlled experimentation.`,

    physics: `> I would break causality for one day.

> Effects could appear before causes.
> A dropped phone might crack five minutes later.
> A correct answer could appear before the question.

> The interesting part would not be the chaos.
> It would be discovering which physical laws still survive.`
};

function setupAssistant() {
    const toggle = $("#ai-toggle-btn");
    const terminal = $("#ai-terminal");
    const close = $("#ai-close-btn");
    const chat = $("#ai-chat-window");
    const promptButtons = $$(".ai-prompt-btn");

    if (!toggle || !terminal || !close || !chat) return;

    let typing = false;

    const setOpen = (open) => {
        terminal.classList.toggle("hidden", !open);
        toggle.setAttribute("aria-expanded", String(open));

        if (open) {
            setTimeout(() => promptButtons[0]?.focus(), 50);
            playUIBeep(900, "square", 0.07, 0.015);
        }
    };

    toggle.addEventListener("click", () => {
        setOpen(terminal.classList.contains("hidden"));
    });

    close.addEventListener("click", () => setOpen(false));

    promptButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (typing) return;

            const query = button.dataset.query;
            const answer = aiDatabase[query];
            if (!answer) return;

            const userMessage = document.createElement("div");
            userMessage.className = "ai-message user-msg";

            const userLabel = document.createElement("span");
            userLabel.className = "ai-label";
            userLabel.textContent = "USER:";

            const userText = document.createElement("span");
            userText.className = "ai-text";
            userText.textContent = button.textContent.trim();

            userMessage.append(userLabel, userText);
            chat.appendChild(userMessage);

            const systemMessage = document.createElement("div");
            systemMessage.className = "ai-message system-msg";

            const systemLabel = document.createElement("span");
            systemLabel.className = "ai-label";
            systemLabel.textContent = "SYS:";

            const systemText = document.createElement("span");
            systemText.className = "ai-text";

            systemMessage.append(systemLabel, systemText);
            chat.appendChild(systemMessage);

            typing = true;
            let index = 0;

            const typeChunk = () => {
                if (index < answer.length) {
                    index = Math.min(answer.length, index + 4);
                    systemText.textContent = answer.slice(0, index);
                    chat.scrollTop = chat.scrollHeight;

                    if (!isLiteMode && index % 12 === 0) {
                        playUIBeep(1200, "square", 0.008, 0.005);
                    }

                    return window.setTimeout(typeChunk, 18);
                }

                typing = false;
            };

            window.setTimeout(typeChunk, 250);
        });
    });
}

function bootstrap() {
    setupPerformanceToggle();
    setupBootSequence();
    bindAudioEvents();
    setupCustomCursor();
    setupNavigation();
    setupSectionUnlocks();
    setupTyping();
    setupTilt();
    setupHUDCanvas();
    setupForm();
    setupAssistant();
    setupPhysicsLab();
    loadGitHubSignal();

    window.requestAnimationFrame(() => {
        initTerminalSidebar();
        setupReactor();
    });
}

bootstrap();


/* --- LIVE PHYSICS RESEARCH LAB --- */
function setupPhysicsLab() {
    const canvas = $("#physics-canvas");
    const velocityControl = $("#velocity-control");
    const angleControl = $("#angle-control");
    const velocityValue = $("#velocity-value");
    const angleValue = $("#angle-value");
    const launchButton = $("#launch-simulation");
    const resetButton = $("#reset-simulation");
    const rangeOutput = $("#range-output");
    const heightOutput = $("#height-output");
    const timeOutput = $("#time-output");
    const state = $("#sim-state");

    if (!canvas || !velocityControl || !angleControl || !launchButton || !resetButton) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const G = 9.81;
    let animation = 0;
    let running = false;

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawStatic();
    }

    function getValues() {
        return {
            velocity: Number(velocityControl.value),
            angleDeg: Number(angleControl.value)
        };
    }

    function updateLabels() {
        velocityValue.textContent = velocityControl.value;
        angleValue.textContent = `${angleControl.value}°`;
    }

    function drawStatic() {
        const width = canvas.clientWidth || 900;
        const height = canvas.clientHeight || 420;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(0,240,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let x = 0; x <= width; x += 40) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += 40) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }

        ctx.stroke();

        ctx.strokeStyle = "rgba(0,240,255,0.35)";
        ctx.beginPath();
        ctx.moveTo(24, height - 34);
        ctx.lineTo(width - 24, height - 34);
        ctx.stroke();

        ctx.fillStyle = "rgba(226,232,240,0.6)";
        ctx.font = "12px Orbitron, sans-serif";
        ctx.fillText("REAL-TIME BALLISTIC MODEL", 24, 24);
    }

    function launch() {
        cancelAnimationFrame(animation);

        const { velocity, angleDeg } = getValues();
        const angle = angleDeg * Math.PI / 180;
        const vx = velocity * Math.cos(angle);
        const vy = velocity * Math.sin(angle);

        const totalTime = (2 * vy) / G;
        const theoreticalRange = vx * totalTime;
        const theoreticalHeight = (vy * vy) / (2 * G);

        rangeOutput.textContent = `${theoreticalRange.toFixed(1)} m`;
        heightOutput.textContent = `${theoreticalHeight.toFixed(1)} m`;
        timeOutput.textContent = `${totalTime.toFixed(2)} s`;

        running = true;
        state.textContent = "RUNNING";

        const width = canvas.clientWidth || 900;
        const height = canvas.clientHeight || 420;
        const groundY = height - 34;
        const originX = 30;
        const usableWidth = width - 60;
        const scaleX = usableWidth / Math.max(theoreticalRange, 1);
        const verticalScale = Math.min(7, usableWidth / Math.max(theoreticalRange, 1));
        const start = performance.now();
        const durationMs = Math.max(1400, totalTime * 700);

        function frame(now) {
            if (!running) return;

            const elapsed = Math.min(1, (now - start) / durationMs);
            const t = totalTime * elapsed;

            drawStatic();

            const x = vx * t;
            const y = vy * t - 0.5 * G * t * t;

            const px = originX + x * scaleX;
            const py = groundY - y * verticalScale;

            ctx.beginPath();
            ctx.strokeStyle = "rgba(0,240,255,0.6)";
            ctx.lineWidth = 2;
            for (let i = 0; i <= 70; i++) {
                const trailT = totalTime * (i / 70);
                const trailX = originX + (vx * trailT) * scaleX;
                const trailY = groundY - Math.max(0, vy * trailT - 0.5 * G * trailT * trailT) * verticalScale;
                if (i === 0) ctx.moveTo(trailX, trailY);
                else ctx.lineTo(trailX, trailY);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = "#00f0ff";
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#00f0ff";
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (elapsed < 1) {
                animation = requestAnimationFrame(frame);
            } else {
                running = false;
                state.textContent = "COMPLETE";
                playUIBeep(1350, "sine", 0.12, 0.018);
            }
        }

        playUIBeep(700, "sine", 0.08, 0.014);
        animation = requestAnimationFrame(frame);
    }

    function reset() {
        running = false;
        cancelAnimationFrame(animation);
        rangeOutput.textContent = "--";
        heightOutput.textContent = "--";
        timeOutput.textContent = "--";
        state.textContent = "READY";
        drawStatic();
    }

    velocityControl.addEventListener("input", updateLabels);
    angleControl.addEventListener("input", updateLabels);
    launchButton.addEventListener("click", launch);
    resetButton.addEventListener("click", reset);
    window.addEventListener("resize", resizeCanvas, { passive: true });

    updateLabels();
    resizeCanvas();
}

/* --- GITHUB SIGNAL --- */
async function loadGitHubSignal() {
    const repos = $("#github-repos");
    const followers = $("#github-followers");
    const following = $("#github-following");

    if (!repos || !followers || !following) return;

    try {
        const response = await fetch(
            "https://api.github.com/users/shreeyansraj463-hue",
            { headers: { Accept: "application/vnd.github+json" } }
        );

        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

        const data = await response.json();

        repos.textContent = data.public_repos ?? "--";
        followers.textContent = data.followers ?? "--";
        following.textContent = data.following ?? "--";
    } catch (error) {
        repos.textContent = "N/A";
        followers.textContent = "N/A";
        following.textContent = "N/A";
        console.warn("GitHub signal unavailable:", error);
    }
}
