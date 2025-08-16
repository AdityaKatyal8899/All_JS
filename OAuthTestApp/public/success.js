document.addEventListener('DOMContentLoaded', function() {
    const userInfoDiv = document.getElementById('userInfo');
    const signOutBtn = document.getElementById('signOut');

    // Get user data from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userDataParam = urlParams.get('user');

    if (userDataParam) {
        try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            displayUserInfo(userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            userInfoDiv.innerHTML = '<div class="error-message">Error loading user information</div>';
        }
    } else {
        userInfoDiv.innerHTML = '<div class="error-message">No user data found</div>';
    }

    // Sign out
    signOutBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    function displayUserInfo(userData) {
        const { googleId, name, picture } = userData;

        userInfoDiv.innerHTML = `
            <div class="user-profile">
                <img src="${picture}" alt="Profile Picture" class="profile-picture" onerror="this.style.display='none'">
                <div class="user-name">Hey! ${name}</div>
                <div class="user-id">
                    Here is your Google ID: ${googleId}
                    <label class="copy-btn-container">
                        <input type="checkbox">
                        <div class="checkmark">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"
                                    d="M416 128L192 384l-96-96"></path>
                            </svg>
                        </div>
                    </label>
                </div>
            </div>
        `;

        // Copy ID functionality
        const copyCheckbox = document.querySelector('.copy-btn-container input');
        copyCheckbox.addEventListener('click', () => {
            navigator.clipboard.writeText(googleId)
            .then(() => {
                const svg = copyCheckbox.nextElementSibling.querySelector('svg');
                svg.style.opacity = '1';
                setTimeout(() => svg.style.opacity = '0', 1000);
                console.log('Copied!');
            })
            .catch(err => console.error('Failed to copy ID:', err));
        });
    }
});
