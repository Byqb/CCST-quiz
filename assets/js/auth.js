// Authentication Module
const Auth = {
    checkAuth() {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const authModal = document.getElementById('authModal');
        const mainContent = document.getElementById('mainContent');

        if (!isAuthenticated) {
            authModal.classList.remove('hidden');
            mainContent.classList.remove('visible');
        } else {
            authModal.classList.add('hidden');
            mainContent.classList.add('visible');
            window.dispatchEvent(new Event('quiz-start'));
        }
    },

    handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const correctUsername = '3mkmYusuf';
        const correctPassword = '3mkmYusuf';

        if (username === correctUsername && password === correctPassword) {
            localStorage.setItem('isAuthenticated', 'true');
            document.getElementById('authModal').classList.add('hidden');
            document.getElementById('mainContent').classList.add('visible');
            document.getElementById('authError').style.display = 'none';
            window.dispatchEvent(new Event('quiz-start'));
        } else {
            document.getElementById('authError').style.display = 'block';
            document.getElementById('password').value = '';
        }
    },

    init() {
        // Set up form submission handler
        const loginForm = document.querySelector('#authModal form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
};

// Make handleLogin available globally for inline onclick
window.handleLogin = (event) => Auth.handleLogin(event);

// Initialize on page load
window.addEventListener('load', () => {
    Auth.init();
    Auth.checkAuth();
});
