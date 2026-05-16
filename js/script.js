/* ═══════════════════════════════════════════════════
   NEURAL NETWORK RESUME - Main Script
   GSAP scroll effects
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════════
       APP INITIALIZATION
       ═══════════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {

        // --- GSAP ScrollTrigger Setup ---
        gsap.registerPlugin(ScrollTrigger);

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
        gsap.set('.proj-card', { opacity: 0, y: 15 });
        
        ScrollTrigger.batch('.proj-card', {
            start: 'top 90%',
            once: true,
            onEnter: batch => gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.25,
                stagger: 0.05,
                ease: 'back.out(1.5)'
            })
        });
    });

})();
