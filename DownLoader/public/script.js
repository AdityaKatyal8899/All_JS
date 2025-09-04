document.addEventListener('DOMContentLoaded', () => {
    const features = document.querySelectorAll('.feature');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.2 });

    features.forEach(f => observer.observe(f));
});

function login() {
    window.location.href = '/auth/google';
}