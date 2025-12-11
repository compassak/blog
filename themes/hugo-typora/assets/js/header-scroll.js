// Header scroll effect - add opaque background when scrolled
(function() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const scrollThreshold = 50; // pixels to scroll before adding background

    function updateHeaderBackground() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Initial check
    updateHeaderBackground();

    // Listen for scroll events
    window.addEventListener('scroll', updateHeaderBackground, { passive: true });
})();
