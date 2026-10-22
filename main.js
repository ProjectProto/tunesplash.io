
        // Generate random stars
        function createStars() {
            const starsContainer = document.getElementById('stars');

            // Minimal stars for performance
            const starConfigs = [
                { count: 20, size: 'small' },
                { count: 10, size: 'medium' }
            ];

            starConfigs.forEach(config => {
                for (let i = 0; i < config.count; i++) {
                    const star = document.createElement('div');
                    star.className = 'star ' + config.size;
                    star.style.left = Math.random() * 100 + '%';
                    star.style.top = Math.random() * 100 + '%';
                    star.style.animationDelay = Math.random() * 6 + 's';
                    starsContainer.appendChild(star);
                }
            });
        }

        createStars();

        // Floating Notes with Collision Detection
        const floatingNotes = [];
        const noteSymbols = ['♪', '♫', '♩', '♬', '♯'];
        const noteColors = ['#00d4aa', '#9b59b6', '#667eea', '#e91e8c', '#20b2aa'];
        const splashContainer = document.getElementById('splash-container');
        const musicNotesContainer = document.querySelector('.music-notes');

        class FloatingNote {
            constructor() {
                this.element = document.createElement('span');
                this.element.className = 'floating-note';
                this.element.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
                this.element.style.color = noteColors[Math.floor(Math.random() * noteColors.length)];
                this.element.style.willChange = 'transform';

                this.x = Math.random() * window.innerWidth;
                this.y = window.innerHeight + 50;
                this.speedX = (Math.random() - 0.5) * 1.5;
                this.speedY = -(0.8 + Math.random() * 1);
                this.size = 20 + Math.random() * 10;
                this.element.style.fontSize = this.size + 'px';
                this.hasCollided = false;

                musicNotesContainer.appendChild(this.element);
                this.updatePosition();
            }

            updatePosition() {
                this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.updatePosition();

                if (this.y < -50 || this.y > window.innerHeight + 100 ||
                    this.x < -100 || this.x > window.innerWidth + 100) {
                    this.remove();
                    return false;
                }
                return true;
            }

            remove() {
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }

            distanceTo(other) {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                return Math.sqrt(dx * dx + dy * dy);
            }
        }

        function createSplash(x, y) {
            const splash = document.createElement('div');
            splash.className = 'splash';
            splash.style.transform = `translate(${x}px, ${y}px)`;

            // Ripple ring
            const ring = document.createElement('div');
            ring.className = 'splash-ring';
            splash.appendChild(ring);

            // Splash text
            const text = document.createElement('div');
            text.className = 'splash-text';
            text.textContent = 'splash!';
            splash.appendChild(text);

            // Musical staff with dancing notes
            const staff = document.createElement('div');
            staff.className = 'music-staff';

            // 5 staff lines
            for (let i = 0; i < 5; i++) {
                const line = document.createElement('div');
                line.className = 'staff-line';
                staff.appendChild(line);
            }

            // 2 dancing notes
            const linePositions = [0, 25, 50, 75, 100];
            const noteX = [20, 60];
            for (let i = 0; i < 2; i++) {
                const note = document.createElement('div');
                note.className = 'staff-note' + (i === 1 ? ' purple' : '');
                note.style.left = noteX[i] + '%';
                note.style.top = (linePositions[Math.floor(Math.random() * 5)] - 5) + '%';
                note.style.animationDelay = (0.4 + i * 0.15) + 's, ' + (0.5 + i * 0.1) + 's';
                staff.appendChild(note);
            }

            splash.appendChild(staff);
            splashContainer.appendChild(splash);

            // Remove after animation
            setTimeout(() => {
                if (splash.parentNode) splash.parentNode.removeChild(splash);
            }, 2500);
        }

        // Spawn a collision pair - notes meet at screen EDGES only, never near center text
        function spawnCollisionPair() {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const edgeMargin = 120; // How far from edge

            // Collision zones ONLY at far edges - never in center
            const zones = [
                // LEFT edge only
                { x: 40 + Math.random() * 60, y: 150 + Math.random() * 400 },
                { x: 50 + Math.random() * 50, y: 200 + Math.random() * 300 },
                { x: 30 + Math.random() * 70, y: 250 + Math.random() * 250 },
                // RIGHT edge only
                { x: screenW - 40 - Math.random() * 60, y: 150 + Math.random() * 400 },
                { x: screenW - 50 - Math.random() * 50, y: 200 + Math.random() * 300 },
                { x: screenW - 30 - Math.random() * 70, y: 250 + Math.random() * 250 },
            ];

            // Pick a random zone
            const zone = zones[Math.floor(Math.random() * zones.length)];
            const collisionX = zone.x;
            const collisionY = zone.y;

            // Note 1: comes from LEFT side
            const note1 = new FloatingNote();
            note1.x = -30;
            note1.y = collisionY + (Math.random() - 0.5) * 60;
            note1.speedX = 3 + Math.random() * 1.5; // Move right
            note1.speedY = (collisionY - note1.y) / ((collisionX - note1.x) / note1.speedX);
            note1.element.style.opacity = '0.85';
            floatingNotes.push(note1);

            // Note 2: comes from RIGHT side
            const note2 = new FloatingNote();
            note2.x = window.innerWidth + 30;
            note2.y = collisionY + (Math.random() - 0.5) * 60;
            note2.speedX = -(3 + Math.random() * 1.5); // Move left
            note2.speedY = (collisionY - note2.y) / ((collisionX - note2.x) / note2.speedX);
            note2.element.style.opacity = '0.85';
            floatingNotes.push(note2);
        }

        // Spawn notes from bottom that float up - limited for performance
        function spawnRisingNote() {
            if (floatingNotes.length > 8) return;
            const note = new FloatingNote();
            note.x = 50 + Math.random() * (window.innerWidth - 100);
            note.y = window.innerHeight + 30;
            note.speedY = -(0.6 + Math.random() * 0.8);
            note.speedX = (Math.random() - 0.5) * 1;
            floatingNotes.push(note);
        }

        // Exclusion zone around hero content - no splashes allowed here
        function isInHeroExclusionZone(x, y) {
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;

            // Define exclusion box: centered horizontally, covers hero content
            // Box is roughly 700px wide (or 80% on mobile), from y=100 to y=750
            const boxWidth = Math.min(700, screenW * 0.8);
            const boxLeft = (screenW - boxWidth) / 2;
            const boxRight = boxLeft + boxWidth;
            const boxTop = 100;
            const boxBottom = 750;

            return x > boxLeft && x < boxRight && y > boxTop && y < boxBottom;
        }

        function checkCollisions() {
            for (let i = 0; i < floatingNotes.length; i++) {
                for (let j = i + 1; j < floatingNotes.length; j++) {
                    const noteA = floatingNotes[i];
                    const noteB = floatingNotes[j];

                    if (!noteA.hasCollided && !noteB.hasCollided) {
                        const distance = noteA.distanceTo(noteB);
                        if (distance < 50) {
                            // Collision detected!
                            const midX = (noteA.x + noteB.x) / 2;
                            const midY = (noteA.y + noteB.y) / 2;

                            // Only create splash if OUTSIDE the hero exclusion zone
                            if (!isInHeroExclusionZone(midX, midY)) {
                                createSplash(midX, midY);
                            }

                            noteA.hasCollided = true;
                            noteB.hasCollided = true;

                            // Make notes scatter
                            noteA.speedX = -3 - Math.random() * 2;
                            noteB.speedX = 3 + Math.random() * 2;
                            noteA.speedY = -2 - Math.random() * 2;
                            noteB.speedY = -2 - Math.random() * 2;

                            // Fade out collided notes
                            noteA.element.style.opacity = '0.2';
                            noteB.element.style.opacity = '0.2';
                        }
                    }
                }
            }
        }

        function animateNotes() {
            for (let i = floatingNotes.length - 1; i >= 0; i--) {
                if (!floatingNotes[i].update()) {
                    floatingNotes.splice(i, 1);
                }
            }
            checkCollisions();
            requestAnimationFrame(animateNotes);
        }

        // Spawn collision pairs every 4-6 seconds
        function scheduleNextCollision() {
            const delay = 4000 + Math.random() * 2000;
            setTimeout(() => {
                if (floatingNotes.length < 8) spawnCollisionPair();
                scheduleNextCollision();
            }, delay);
        }

        // Spawn rising notes less frequently
        setInterval(spawnRisingNote, 3000);

        // Start with one collision after delay
        setTimeout(spawnCollisionPair, 2000);
        scheduleNextCollision();

        // Just 2 initial notes
        setTimeout(spawnRisingNote, 500);
        setTimeout(spawnRisingNote, 1000);

        requestAnimationFrame(animateNotes);

        // Intersection Observer for feature cards
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });

        // Modal functions
        function openModal(type) {
            document.getElementById(type + '-modal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal(type) {
            document.getElementById(type + '-modal').classList.remove('active');
            document.body.style.overflow = '';
        }

        // Close modal on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal('privacy');
                closeModal('terms');
            }
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal-overlay').forEach(function(modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal('privacy');
                    closeModal('terms');
                }
            });
        });
    
// Bind UI actions without inline event attributes.
document.querySelectorAll('[data-inert-link]').forEach(link => {
    link.addEventListener('click', event => event.preventDefault());
});
document.querySelectorAll('[data-modal-open]').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        openModal(link.dataset.modalOpen);
    });
});
document.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.modalClose));
});
