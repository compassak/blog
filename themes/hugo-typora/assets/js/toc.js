document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80% 0px', // Trigger when section hits top 20% of viewport
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                // Remove active class from all links
                document.querySelectorAll('#TableOfContents a').forEach(link => {
                    link.classList.remove('active');
                });
                // Add active class to current link
                const activeLink = document.querySelector(`#TableOfContents a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    // Optional: Scroll TOC to keep active item in view
                    // activeLink.scrollIntoView({ block: 'nearest' });
                }
            }
        });
    }, observerOptions);

    // Track all h1-h6 elements that have an id
    document.querySelectorAll('.post-content h1[id], .post-content h2[id], .post-content h3[id], .post-content h4[id], .post-content h5[id], .post-content h6[id]').forEach((section) => {
        observer.observe(section);
    });
});
