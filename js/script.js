document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.cnn-block');
    const mapNodes = document.querySelectorAll('.cnn-map .map-node');
    const cnnMap = document.querySelector('.cnn-map');
    const contentFlow = document.querySelector('.content-flow');
    let mouseX = 0, mouseY = 0;
    let targetRotateX = 0, targetRotateY = 0;
    let currentRotateX = 0, currentRotateY = 0;
    let isAnimating = false;

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all sections for animation
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });

    // --- Mouse Move Wobble Effect --- //
    const handleMouseMove = (event) => {
        if (!isAnimating) {
            mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
            const maxRotate = 0.15;
            targetRotateY = mouseX * maxRotate;
            targetRotateX = -mouseY * maxRotate;
        }
    };

    const applyWobble = () => {
        currentRotateX += (targetRotateX - currentRotateX) * 0.08;
        currentRotateY += (targetRotateY - currentRotateY) * 0.08;
        
        contentFlow.style.transform = `rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
        
        requestAnimationFrame(applyWobble);
    };

    // Debounced mouse move handler with RAF
    let mouseMoveTimeout;
    window.addEventListener('mousemove', (event) => {
        if (mouseMoveTimeout) cancelAnimationFrame(mouseMoveTimeout);
        mouseMoveTimeout = requestAnimationFrame(() => handleMouseMove(event));
    }, { passive: true });

    // Start animation loop
    requestAnimationFrame(applyWobble);

    // --- Smooth scroll for map links --- //
    if (cnnMap) {
        mapNodes.forEach(node => {
            node.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = node.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    isAnimating = true;
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                    });
                    setTimeout(() => {
                        isAnimating = false;
                    }, 1000);
                }
            });
        });
    }

    // --- Update Active Map Node Based on Scroll Position --- //
    const updateActiveMapNode = () => {
        if (!cnnMap) return;

        let closestSectionId = null;
        let minDistance = Infinity;
        const viewportCenterY = window.innerHeight / 2;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionCenterY = rect.top + rect.height / 2;
            const distance = Math.abs(viewportCenterY - sectionCenterY);
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible && distance < minDistance) {
                minDistance = distance;
                closestSectionId = section.getAttribute('id');
            }
        });

        // Update active class with smooth transition
        mapNodes.forEach(node => {
            const isActive = node.getAttribute('data-section') === closestSectionId;
            if (isActive && !node.classList.contains('active')) {
                node.classList.add('active');
            } else if (!isActive && node.classList.contains('active')) {
                node.classList.remove('active');
            }
        });
    };

    // Debounced scroll handler with RAF
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
        scrollTimeout = requestAnimationFrame(updateActiveMapNode);
    }, { passive: true });

    // Initial map node active state
    if (cnnMap && mapNodes.length > 0) {
        updateActiveMapNode();
    }

    // Handle show more projects button with improved transitions
    const showMoreBtn = document.getElementById('show-more-projects');
    const additionalProjects = document.querySelector('.additional-projects');
    
    if (showMoreBtn && additionalProjects) {
        additionalProjects.classList.remove('visible');
        
        showMoreBtn.addEventListener('click', function() {
            const isExpanding = !additionalProjects.classList.contains('visible');
            
            if (isExpanding) {
                additionalProjects.classList.add('visible');
                showMoreBtn.textContent = 'Show Less Projects';
                
                // Smooth scroll to newly visible content
                setTimeout(() => {
                    additionalProjects.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 100);
            } else {
                additionalProjects.classList.remove('visible');
                showMoreBtn.textContent = 'Show More Projects';
                
                // Scroll to button after collapse
                setTimeout(() => {
                    showMoreBtn.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 300);
            }
        });
    }

    // Add parallax effect to background
    // const handleParallax = () => {
    //     const scrolled = window.pageYOffset;
    //     document.querySelector('.background-container').style.transform = 
    //         `translateY(${scrolled * 0.5}px)`;
    // };

    // window.addEventListener('scroll', () => {
    //     requestAnimationFrame(handleParallax);
    // }, { passive: true });
}); 