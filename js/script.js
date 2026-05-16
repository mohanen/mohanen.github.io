/* ═══════════════════════════════════════════════════
   NEURAL NETWORK RESUME - Main Script
   Three.js scene + GSAP scroll + Text effects + Cursor
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;

    /* ═══════════════════════════════════════════════
       1. THREE.JS NEURAL NETWORK SCENE
       ═══════════════════════════════════════════════ */
    class NeuralNetworkScene {
        constructor(canvas) {
            this.canvas = canvas;
            this.mouseScreen = new THREE.Vector2(0, 0);
            this.scroll = 0;
            this.clock = new THREE.Clock();

            // High density for breathtaking plexus effect
            this.NODE_COUNT = isMobile ? 150 : 350;
            this.MAX_DISTANCE = isMobile ? 3.0 : 3.5;

            this.init();
            this.createNetwork();
            this.animate();
            this.handleResize();
        }

        init() {
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0xf3f4f6, 0.04);

            this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
            this.camera.position.set(0, 0, 10);

            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: !isMobile,
                alpha: true,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setClearColor(0x000000, 0); // Transparent background
        }

        createNetwork() {
            // --- 1. Create Points ---
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(this.NODE_COUNT * 3);
            this.basePositions = new Float32Array(this.NODE_COUNT * 3);
            this.phases = new Float32Array(this.NODE_COUNT);
            this.speeds = new Float32Array(this.NODE_COUNT);

            // --- Create Structured DNN Layers ---
            const numLayers = isMobile ? 6 : 9;
            const layerSpacing = 24 / (numLayers - 1);
            
            for (let i = 0; i < this.NODE_COUNT; i++) {
                let x, y, z;
                
                // Distribute nodes evenly across strict vertical layers
                const layerIdx = i % numLayers;
                
                // X position is fixed to the layer plane, with tiny depth jitter
                x = -12 + (layerIdx * layerSpacing) + (Math.random() - 0.5) * 0.8;
                
                // Y is distributed broadly to form tall columns
                y = (Math.random() - 0.5) * 16;
                
                // Z is kept relatively flat so the network structure is clearly legible
                z = (Math.random() - 0.5) * 4;

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                this.basePositions[i * 3] = x;
                this.basePositions[i * 3 + 1] = y;
                this.basePositions[i * 3 + 2] = z;

                this.phases[i] = Math.random() * Math.PI * 2;
                this.speeds[i] = 0.1 + Math.random() * 0.3;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            // Custom soft circle texture
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(148, 163, 184, 1)');
            gradient.addColorStop(1, 'rgba(148, 163, 184, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(16, 16, 16, 0, Math.PI * 2);
            ctx.fill();
            const texture = new THREE.CanvasTexture(canvas);

            const material = new THREE.PointsMaterial({
                size: 0.25,
                map: texture,
                transparent: true,
                opacity: 0.7,
                depthWrite: false,
                color: 0xffffff,
                sizeAttenuation: true
            });

            this.points = new THREE.Points(geometry, material);
            this.scene.add(this.points);

            // --- 2. Create Dynamic Lines ---
            this.linesGeometry = new THREE.BufferGeometry();
            const maxConnections = (this.NODE_COUNT * (this.NODE_COUNT - 1)) / 2;
            this.linesPositions = new Float32Array(maxConnections * 6);
            this.linesColors = new Float32Array(maxConnections * 6);
            
            this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(this.linesPositions, 3));
            this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(this.linesColors, 3));

            const linesMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 1.0,
                depthWrite: false
            });

            this.lines = new THREE.LineSegments(this.linesGeometry, linesMaterial);
            this.scene.add(this.lines);
            
            // --- 3. Create Accent Data Pulses (Glowing Orbs) ---
            this.accentCount = isMobile ? 15 : 30;
            
            // Custom glowing texture for crimson accents
            const accentCanvas = document.createElement('canvas');
            accentCanvas.width = 64; accentCanvas.height = 64;
            const actx = accentCanvas.getContext('2d');
            const agradient = actx.createRadialGradient(32, 32, 0, 32, 32, 32);
            agradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Hot white core
            agradient.addColorStop(0.2, 'rgba(225, 29, 72, 1)'); // Crimson body
            agradient.addColorStop(1, 'rgba(225, 29, 72, 0)');   // Smooth fade to invisible
            actx.fillStyle = agradient;
            actx.beginPath();
            actx.arc(32, 32, 32, 0, Math.PI * 2);
            actx.fill();
            
            const accentTexture = new THREE.CanvasTexture(accentCanvas);
            const accentMat = new THREE.SpriteMaterial({ 
                map: accentTexture,
                transparent: true,
                opacity: 0.95,
                depthWrite: false,
                blending: THREE.NormalBlending
            });
            
            this.accents = [];
            for(let i = 0; i < this.accentCount; i++) {
                const sprite = new THREE.Sprite(accentMat);
                // Scale sprite to match node size (0.15 is similar to the 0.03 radius sphere)
                sprite.scale.set(0.18, 0.18, 0.18); 
                
                sprite.userData = {
                    idxA: Math.floor(Math.random() * this.NODE_COUNT),
                    idxB: Math.floor(Math.random() * this.NODE_COUNT),
                    progress: Math.random(),
                    speed: 0.005 + Math.random() * 0.015
                };
                this.accents.push(sprite);
                this.scene.add(sprite);
            }
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            const time = this.clock.getElapsedTime();
            const positions = this.points.geometry.attributes.position.array;

            // Compute actual 3D mouse position for physics
            const vector = new THREE.Vector3(this.mouseScreen.x, this.mouseScreen.y, 0.5);
            vector.unproject(this.camera);
            const dir = vector.sub(this.camera.position).normalize();
            const distance = -this.camera.position.z / dir.z;
            const mousePos = this.camera.position.clone().add(dir.multiplyScalar(distance));

            // --- Update Nodes (Float + Repulsion) ---
            for (let i = 0; i < this.NODE_COUNT; i++) {
                let bx = this.basePositions[i * 3];
                let by = this.basePositions[i * 3 + 1];
                let bz = this.basePositions[i * 3 + 2];

                let x = bx + Math.sin(time * this.speeds[i] + this.phases[i]) * 0.4;
                let y = by + Math.cos(time * this.speeds[i] * 0.8 + this.phases[i]) * 0.4;
                let z = bz + Math.sin(time * this.speeds[i] * 1.2 + this.phases[i]) * 0.2;

                const dx = mousePos.x - x;
                const dy = mousePos.y - y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < 12) {
                    const force = (12 - distSq) / 12;
                    x -= dx * force * 0.15;
                    y -= dy * force * 0.15;
                }

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
            }
            this.points.geometry.attributes.position.needsUpdate = true;

            // --- Update Lines (Plexus) ---
            let vertexIndex = 0;
            let colorIndex = 0;
            const maxD = this.MAX_DISTANCE;
            const maxDSq = maxD * maxD;

            for (let i = 0; i < this.NODE_COUNT; i++) {
                const x1 = positions[i * 3];
                const y1 = positions[i * 3 + 1];
                const z1 = positions[i * 3 + 2];

                for (let j = i + 1; j < this.NODE_COUNT; j++) {
                    const x2 = positions[j * 3];
                    const y2 = positions[j * 3 + 1];
                    const z2 = positions[j * 3 + 2];

                    const dx = x1 - x2;
                    const dy = y1 - y2;
                    const dz = z1 - z2;
                    const distSq = dx * dx + dy * dy + dz * dz;

                    if (distSq < maxDSq) {
                        const alpha = Math.pow(1.0 - (distSq / maxDSq), 1.5) * 0.5;

                        this.linesPositions[vertexIndex++] = x1;
                        this.linesPositions[vertexIndex++] = y1;
                        this.linesPositions[vertexIndex++] = z1;
                        this.linesPositions[vertexIndex++] = x2;
                        this.linesPositions[vertexIndex++] = y2;
                        this.linesPositions[vertexIndex++] = z2;

                        // Fade between network color (slate) and background color (fog)
                        // Slate: 148, 163, 184 | Bg: 243, 244, 246
                        const r = (148 * alpha + 243 * (1 - alpha)) / 255;
                        const g = (163 * alpha + 244 * (1 - alpha)) / 255;
                        const b = (184 * alpha + 246 * (1 - alpha)) / 255;

                        this.linesColors[colorIndex++] = r;
                        this.linesColors[colorIndex++] = g;
                        this.linesColors[colorIndex++] = b;
                        this.linesColors[colorIndex++] = r;
                        this.linesColors[colorIndex++] = g;
                        this.linesColors[colorIndex++] = b;
                    }
                }
            }

            this.linesGeometry.setDrawRange(0, vertexIndex / 3);
            this.linesGeometry.attributes.position.needsUpdate = true;
            this.linesGeometry.attributes.color.needsUpdate = true;

            // --- Update Accent Pulses ---
            for (let i = 0; i < this.accentCount; i++) {
                const acc = this.accents[i];
                const d = acc.userData;
                d.progress += d.speed;

                if (d.progress >= 1) {
                    d.progress = 0;
                    d.idxA = d.idxB;
                    
                    let found = false;
                    const ax = positions[d.idxA * 3];
                    const ay = positions[d.idxA * 3 + 1];
                    const az = positions[d.idxA * 3 + 2];
                    
                    // Seek new connected node
                    for (let j = 0; j < this.NODE_COUNT; j++) {
                        if (j !== d.idxA) {
                            const dx = ax - positions[j * 3];
                            const dy = ay - positions[j * 3 + 1];
                            const dz = az - positions[j * 3 + 2];
                            if (dx * dx + dy * dy + dz * dz < maxDSq) {
                                if (Math.random() > 0.6) {
                                    d.idxB = j;
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!found) d.idxB = Math.floor(Math.random() * this.NODE_COUNT);
                }

                const ax = positions[d.idxA * 3];
                const ay = positions[d.idxA * 3 + 1];
                const az = positions[d.idxA * 3 + 2];
                const bx = positions[d.idxB * 3];
                const by = positions[d.idxB * 3 + 1];
                const bz = positions[d.idxB * 3 + 2];

                acc.position.set(
                    ax + (bx - ax) * d.progress,
                    ay + (by - ay) * d.progress,
                    az + (bz - az) * d.progress
                );
            }

            // --- Parallax Camera with Ambient Breathing ---
            const targetX = this.mouseScreen.x * 2.5 + Math.sin(time * 0.15) * 1.5;
            const targetY = this.mouseScreen.y * 1.5 + Math.cos(time * 0.12) * 1.0;
            const targetZ = 10 - this.scroll * 2;

            this.camera.position.x += (targetX - this.camera.position.x) * 0.04;
            this.camera.position.y += (targetY - this.camera.position.y) * 0.04;
            this.camera.position.z += (targetZ - this.camera.position.z) * 0.03;
            this.camera.lookAt(0, 0, 0);

            this.renderer.render(this.scene, this.camera);
        }

        handleResize() {
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        updateMouse(x, y) {
            this.mouseScreen.x = (x / window.innerWidth - 0.5) * 2;
            this.mouseScreen.y = -(y / window.innerHeight - 0.5) * 2;
        }

        updateScroll(progress) {
            this.scroll = progress;
        }
    }

    /* ═══════════════════════════════════════════════
       2. TEXT SCRAMBLE EFFECT
       ═══════════════════════════════════════════════ */
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#_01';
            this.frameRequest = null;
            this.frame = 0;
            this.queue = [];
            this.resolve = null;
        }

        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise(resolve => this.resolve = resolve);
            this.queue = [];

            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 20);
                const end = start + Math.floor(Math.random() * 20);
                this.queue.push({ from, to, start, end });
            }

            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;

            this.el.classList.add('chromatic-active');
            setTimeout(() => this.el.classList.remove('chromatic-active'), 400);

            this.update();
            return promise;
        }

        update() {
            let output = '';
            let complete = 0;

            for (let i = 0; i < this.queue.length; i++) {
                let { from, to, start, end, char } = this.queue[i];

                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.chars[Math.floor(Math.random() * this.chars.length)];
                        this.queue[i].char = char;
                    }
                    output += `<span style="color:var(--color-text-muted)">${char}</span>`;
                } else {
                    output += from;
                }
            }

            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                if (this.resolve) this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(() => {
                    this.frame++;
                    this.update();
                });
            }
        }
    }

    /* ═══════════════════════════════════════════════
       3. CUSTOM CURSOR
       ═══════════════════════════════════════════════ */
    class NeuralCursor {
        constructor() {
            this.dot = document.querySelector('.cursor-dot');
            this.outline = document.querySelector('.cursor-outline');
            if (!this.dot || !this.outline) return;

            this.mouseX = 0;
            this.mouseY = 0;
            this.outlineX = 0;
            this.outlineY = 0;
            this.visible = true;

            this.init();
        }

        init() {
            document.addEventListener('mousemove', e => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                if (!this.visible) {
                    this.dot.style.display = 'block';
                    this.outline.style.display = 'block';
                    this.visible = true;
                }
            });

            document.addEventListener('mousedown', () => {
                this.dot.classList.add('clicking');
                this.outline.classList.add('clicking');
            });

            document.addEventListener('mouseup', () => {
                this.dot.classList.remove('clicking');
                this.outline.classList.remove('clicking');
            });

            document.addEventListener('mouseleave', () => {
                this.dot.style.display = 'none';
                this.outline.style.display = 'none';
                this.visible = false;
            });

            const interactiveEls = 'a, button, .skill-tag, .project-card, .contact-btn, .hero__badge, .award-card, .education-card, .timeline__card';

            document.querySelectorAll(interactiveEls).forEach(el => {
                el.addEventListener('mouseenter', () => {
                    this.dot.classList.add('hovering');
                    this.outline.classList.add('hovering');
                });
                el.addEventListener('mouseleave', () => {
                    this.dot.classList.remove('hovering');
                    this.outline.classList.remove('hovering');
                });
            });

            this.render();
        }

        render() {
            this.outlineX += (this.mouseX - this.outlineX) * 0.12;
            this.outlineY += (this.mouseY - this.outlineY) * 0.12;

            this.dot.style.left = `${this.mouseX}px`;
            this.dot.style.top = `${this.mouseY}px`;
            this.outline.style.left = `${this.outlineX}px`;
            this.outline.style.top = `${this.outlineY}px`;

            requestAnimationFrame(() => this.render());
        }
    }

    /* ═══════════════════════════════════════════════
       4. APP INITIALIZATION
       ═══════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {

        // --- Neural Network 3D Scene ---
        const canvas = document.getElementById('neural-network');
        let neuralScene = null;
        if (canvas) {
            neuralScene = new NeuralNetworkScene(canvas);

            window.addEventListener('mousemove', e => {
                neuralScene.updateMouse(e.clientX, e.clientY);
            }, { passive: true });
        }

        // --- GSAP ScrollTrigger Setup ---
        gsap.registerPlugin(ScrollTrigger);

        // Neural network camera follows scroll progress
        ScrollTrigger.create({
            trigger: '.resume-wrapper',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: self => {
                if (neuralScene) {
                    neuralScene.updateScroll(self.progress);
                }
            }
        });

        // --- Intro Animations ---
        gsap.from('.resume-header', {
            y: -30,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });

        gsap.from('.resume-main .resume-section', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.2
        });

        gsap.from('.resume-sidebar .resume-section', {
            x: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.4
        });

        // --- Scroll Animations for Projects ---
        gsap.utils.toArray('.proj-card').forEach((card, i) => {
            ScrollTrigger.create({
                trigger: card,
                start: 'top 90%',
                animation: gsap.from(card, {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power3.out'
                }),
                toggleActions: 'play none none reverse'
            });
        });

        // --- Custom Cursor ---
        if (!isMobile) {
            const cursor = new NeuralCursor();
            
            // Bind cursor to new interactive elements
            const interactiveEls = 'a, button, .contact-item, .patent-card, .proj-card, .edu-item, .award-item, .tag';
            document.querySelectorAll(interactiveEls).forEach(el => {
                el.addEventListener('mouseenter', () => {
                    if(cursor.dot) cursor.dot.classList.add('hovering');
                    if(cursor.outline) cursor.outline.classList.add('hovering');
                });
                el.addEventListener('mouseleave', () => {
                    if(cursor.dot) cursor.dot.classList.remove('hovering');
                    if(cursor.outline) cursor.outline.classList.remove('hovering');
                });
            });
        }
    });

})();
