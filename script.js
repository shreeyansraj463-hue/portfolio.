import * as THREE from "https://esm.sh/three@0.148.0";

const CONFIG = { bootMinDelay: 300, bootMaxDelay: 800, particleDesktop: 50, particleMobile: 15 };
let isLiteMode = false;

// --- AUDIO SYSTEM ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playUIBeep(freq, type, duration, vol) {
    if (isLiteMode) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

document.querySelectorAll('.sound-hover').forEach(el => { el.addEventListener('mouseenter', () => playUIBeep(800, 'sine', 0.1, 0.01)); });
document.querySelectorAll('.sound-click').forEach(el => { el.addEventListener('click', () => playUIBeep(1200, 'square', 0.15, 0.03)); });

// --- LITE MODE TOGGLE ---
const perfToggle = document.getElementById('perf-toggle');
if (perfToggle) {
    perfToggle.addEventListener('click', () => {
        isLiteMode = !isLiteMode;
        document.body.classList.toggle('lite-mode', isLiteMode);
        perfToggle.innerHTML = isLiteMode ? "MODE: <span class='glow-green'>LITE</span>" : "MODE: <span class='glow-text'>MAX</span>";
        playUIBeep(isLiteMode ? 400 : 1000, 'square', 0.2, 0.03);
    });
}

// --- BOOT SEQUENCE ---
const bootScreen = document.getElementById('boot-sequence');
const bootText = document.getElementById('boot-text');
const bootProgress = document.querySelector('.boot-progress');
const bootSequenceData = [ "INITIALIZING SECURE PROXY...", "VERIFYING JEE PREPARATION STATUS...", "LOADING PHYSICS ENGINE...", "WELCOME TO NEXUS, SHREEYANS." ];
let bootIndex = 0; let progress = 0;

function runBootSequence() {
    if (!bootScreen || !bootText || !bootProgress) return;
    if (bootIndex < bootSequenceData.length) {
        bootText.innerText = bootSequenceData[bootIndex];
        bootIndex++; progress += (100 / bootSequenceData.length);
        bootProgress.style.width = `${progress}%`;
        playUIBeep(600 + (bootIndex * 100), 'sawtooth', 0.1, 0.03);
        setTimeout(runBootSequence, Math.floor(Math.random() * (CONFIG.bootMaxDelay - CONFIG.bootMinDelay + 1)) + CONFIG.bootMinDelay);
    } else {
        playUIBeep(1500, 'sine', 0.5, 0.05);
        setTimeout(() => { bootScreen.classList.add('hidden'); initTerminalSidebar(); }, 600);
    }
}
window.addEventListener('load', runBootSequence);

// --- SINGLE DOT CURSOR (NO LAG) ---
const cursor = document.getElementById('custom-cursor');
if (cursor && window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
        if (isLiteMode) return;
        cursor.style.left = `${e.clientX}px`; 
        cursor.style.top = `${e.clientY}px`;
    });
    window.addEventListener('mousedown', () => { if (!isLiteMode) document.body.classList.add('clicking'); });
    window.addEventListener('mouseup', () => document.body.classList.remove('clicking'));
}

// --- LIVE TERMINAL SIDEBAR ---
function initTerminalSidebar() {
    const termLogs = document.getElementById('term-logs');
    if (!termLogs || window.innerWidth <= 1024) return;
    
    const logsData = [
        `> CONNECTION ESTABLISHED`,
        `> AGENT: ${navigator.userAgent.split(' ')[0]}`,
        `> RENDER_TARGET: 60 FPS`,
        `> MEMORY_ALLOC: OPTIMAL`,
        `> PHYSICS_ENGINE: STANDBY`,
        `> LISTENING FOR INPUT...`
    ];
    let logIndex = 0;

    function appendLog() {
        if (logIndex < logsData.length) {
            const li = document.createElement('li');
            li.innerText = logsData[logIndex];
            termLogs.appendChild(li);
            logIndex++;
            setTimeout(appendLog, Math.random() * 800 + 400);
        }
    }
    setTimeout(appendLog, 1000);
}

// --- SCROLL UNLOCKING ---
const unlockObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('unlocked')) {
            entry.target.classList.add("unlocked");
            const statusText = entry.target.querySelector('.module-status');
            if(statusText) { playUIBeep(900, 'square', 0.2, 0.03); statusText.innerText = "[ MODULE_UNLOCKED ]"; }
        }
    });
}, { threshold: 0.2 });
document.querySelectorAll(".unlock-module").forEach(el => unlockObserver.observe(el));

// --- THREE.JS REACTOR ---
const container = document.getElementById('three-reactor');
if (container && window.innerWidth > 768) { 
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(300, 300); container.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(1.5, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.5 });
    const core = new THREE.Mesh(geo, mat); scene.add(core);

    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(100 * 3);
    for(let i=0; i<300; i++) posArray[i] = (Math.random() - 0.5) * 5;
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMesh = new THREE.Points(particleGeo, new THREE.PointsMaterial({ size: 0.04, color: 0x00f0ff }));
    scene.add(particlesMesh);

    function animateThree() {
        requestAnimationFrame(animateThree);
        if (isLiteMode) return; 
        core.rotation.x += 0.005; core.rotation.y += 0.01;
        particlesMesh.rotation.y -= 0.002;
        renderer.render(scene, camera);
    }
    animateThree();
    
    container.addEventListener('click', () => {
        if (isLiteMode) return;
        const ripple = document.createElement('div'); ripple.classList.add('reactor-ripple');
        container.appendChild(ripple); core.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => { core.scale.set(1, 1, 1); ripple.remove(); }, 300);
    });
}

// --- TYPING EFFECT ---
const roles = ["COMPUTATIONAL ENGINEER", "PHYSICS ENTHUSIAST", "JEE ASPIRANT"];
const typedElement = document.getElementById("typed-text");
let rIndex = 0, cIndex = 0, isDel = false;
function typeEffect() {
    if (!typedElement) return;
    const curr = roles[rIndex];
    typedElement.textContent = isDel ? curr.substring(0, cIndex - 1) : curr.substring(0, cIndex + 1);
    cIndex += isDel ? -1 : 1;
    let speed = isDel ? 30 : 60;
    if (!isDel && cIndex === curr.length) { speed = 2500; isDel = true; } 
    else if (isDel && cIndex === 0) { isDel = false; rIndex = (rIndex + 1) % roles.length; speed = 500; }
    setTimeout(typeEffect, speed);
}
setTimeout(typeEffect, 2500);

// --- NAV & TILT ---
const mobileBtn = document.getElementById('mobile-menu-btn');
const navLinksContainer = document.getElementById('nav-links');
if (mobileBtn && navLinksContainer) {
    mobileBtn.addEventListener('click', () => { mobileBtn.classList.toggle('active'); navLinksContainer.classList.toggle('open'); });
    document.querySelectorAll('.nav-links a').forEach(link => { link.addEventListener('click', () => { mobileBtn.classList.remove('active'); navLinksContainer.classList.remove('open'); }); });
}

window.addEventListener("scroll", () => {
    let current = "";
    document.querySelectorAll("section").forEach(sec => { if (pageYOffset >= (sec.offsetTop - sec.clientHeight / 3)) current = sec.getAttribute("id"); });
    document.querySelectorAll(".nav-links a").forEach(link => { link.classList.remove("active"); if (link.getAttribute("href").includes(current)) link.classList.add("active"); });
});

document.querySelectorAll(".hover-tilt").forEach(el => {
    el.addEventListener("mousemove", (e) => {
        if (window.innerWidth <= 768 || isLiteMode) return; 
        const rect = el.getBoundingClientRect();
        el.style.transform = `perspective(1000px) rotateX(${(((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2)) * -5}deg) rotateY(${(((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * 5}deg) scale3d(1.01, 1.01, 1.01)`;
    });
    el.addEventListener("mouseleave", () => { if (window.innerWidth > 768 && !isLiteMode) el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`; });
});

// --- CACHED HUD CANVAS ---
const canvas = document.getElementById("hud-canvas");
if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: false }); 
    const offCtx = document.createElement('canvas').getContext('2d', { alpha: false });
    let w, h, parts = [];
    function initCanvas() {
        w = canvas.width = offCtx.canvas.width = window.innerWidth;
        h = canvas.height = offCtx.canvas.height = window.innerHeight;
        parts = [];
        for (let i = 0; i < (w < 768 ? CONFIG.particleMobile : CONFIG.particleDesktop); i++) {
            parts.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2, speedY: (Math.random() - 0.5) * 0.3, opacity: Math.random() * 0.3 });
        }
        offCtx.fillStyle = '#030712'; offCtx.fillRect(0, 0, w, h);
        offCtx.strokeStyle = "rgba(0, 240, 255, 0.03)"; offCtx.beginPath();
        for(let x = 0; x < w; x += 50) { offCtx.moveTo(x, 0); offCtx.lineTo(x, h); }
        for(let y = 0; y < h; y += 50) { offCtx.moveTo(0, y); offCtx.lineTo(w, y); }
        offCtx.stroke();
    }
    function drawHUD() {
        requestAnimationFrame(drawHUD);
        if (isLiteMode) return; 
        ctx.drawImage(offCtx.canvas, 0, 0);
        ctx.fillStyle = "rgba(0, 240, 255, 0.3)";
        parts.forEach(p => {
            p.y += p.speedY; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            ctx.globalAlpha = p.opacity; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
    window.addEventListener("resize", initCanvas);
    initCanvas(); drawHUD();
}

// --- FORM SUBMIT (100% NATIVE, NO APPS) ---
const form = document.getElementById('comms-form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const btn = form.querySelector('button'); 
        const origText = btn.innerText;
        
        btn.innerText = "OPENING SECURE UPLINK..."; 
        btn.style.background = "var(--cyan)"; 
        btn.style.color = "#000";
        if (!isLiteMode) playUIBeep(500, 'sine', 1.5, 0.05);

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const mailSubject = encodeURIComponent(`NEXUS CORE: Secure Comms from ${name}`);
        const mailBody = encodeURIComponent(
`>>> INCOMING TRANSMISSION <<<

ID_NAME: ${name}
UPLINK_EMAIL: ${email}

DATA_PAYLOAD:
${message}

>>> END TRANSMISSION <<<`
        );

        setTimeout(() => {
            window.location.href = `mailto:Shreeyansraj463@gmail.com?subject=${mailSubject}&body=${mailBody}`;
            
            btn.innerText = "CLIENT LAUNCHED"; 
            btn.style.background = "#22c55e"; 
            form.reset();
            if (!isLiteMode) playUIBeep(1200, 'square', 0.2, 0.05);
            
            setTimeout(() => { 
                btn.innerText = origText; 
                btn.style.background = ""; 
                btn.style.color = ""; 
            }, 3000);
        }, 800); 
    });
}

// --- NEXUS AI CONSTRUCT ---
const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiTerminal = document.getElementById('ai-terminal');
const aiCloseBtn = document.getElementById('ai-close-btn');
const aiChatWindow = document.getElementById('ai-chat-window');
const aiPromptBtns = document.querySelectorAll('.ai-prompt-btn');

const aiDatabase = {
    "who": "SHREEYANS IS A COMPUTATIONAL ENGINEER & JEE ASPIRANT. HE TRANSLATES COMPLEX PHYSICS AND MATHEMATICS INTO INTERACTIVE WEB ARCHITECTURES.",
    "media": "CURRENT FAVORITES: CHRISTOPHER NOLAN MIND-BENDERS, THE MARVEL CINEMATIC UNIVERSE, AND CLASSIC SHAH RUKH KHAN ROM-COMS.",
    "food": "OPTIMAL FUEL SOURCES: CHICKEN BIRYANI, MUTTON DISHES, SOYABEAN, CARROT HALWA, AND TOMATO CHUTNEY.",
    "vibe": "CURIOUS, FOCUSED, AND ANALYTICAL. TRANSITIONS TO EASYGOING AND COLLABORATIVE UPON COMFORT.",
    "icebreaker": "RECOMMENDED PING: 'Hey, I really like the computational engineering angle. Let's connect!'"
};
let isAITyping = false;

if (aiToggleBtn && aiTerminal) {
    aiToggleBtn.addEventListener('click', () => {
        aiTerminal.classList.toggle('hidden');
        if (!aiTerminal.classList.contains('hidden') && !isLiteMode) playUIBeep(900, 'square', 0.1, 0.03);
    });
    aiCloseBtn.addEventListener('click', () => { aiTerminal.classList.add('hidden'); });
}

aiPromptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isAITyping) return; 
        const query = btn.getAttribute('data-query'); const userText = btn.innerText;
        
        const msgDiv = document.createElement('div'); msgDiv.className = `ai-message user-msg`;
        msgDiv.innerHTML = `<span class="ai-label">USER:</span> <span class="ai-text">${userText}</span>`;
        aiChatWindow.appendChild(msgDiv); aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
        
        isAITyping = true;
        if (!isLiteMode) playUIBeep(400, 'sine', 0.2, 0.01);
        
        setTimeout(() => {
            const sysDiv = document.createElement('div'); sysDiv.className = `ai-message system-msg`;
            const textSpan = document.createElement('span'); textSpan.className = 'ai-text';
            sysDiv.innerHTML = `<span class="ai-label">SYS:</span> `; sysDiv.appendChild(textSpan);
            aiChatWindow.appendChild(sysDiv);
            
            const fullText = aiDatabase[query]; let i = 0;
            function typeChar() {
                if (i < fullText.length) {
                    textSpan.textContent += fullText.charAt(i); i++;
                    if (!isLiteMode && i % 3 === 0) playUIBeep(1200, 'square', 0.01, 0.01);
                    aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
                    setTimeout(typeChar, 15);
                } else { isAITyping = false; }
            }
            typeChar();
        }, 500);
    });
});
