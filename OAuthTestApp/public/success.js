document.addEventListener('DOMContentLoaded', function() {
    const userInfoDiv = document.getElementById('userInfo');
    const signOutBtn = document.getElementById('signOut');
    
    // Get user data from URL parameters
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

    // Handle sign out
    signOutBtn.addEventListener('click', function() {
        window.location.href = '/';
    });

    function displayUserInfo(userData) {
        const { googleId, name, picture } = userData;

        userInfoDiv.innerHTML = `
            <div class="user-profile">
                <img src="${picture}" alt="Profile Picture" class="profile-picture" onerror="this.style.display='none'">
                <div class="user-name">Hey! ${name}</div>
                <div class="user-id">Here is your google ID: ${googleId}</div>
                <button class="noselect">
                    <span class="text">Copy ID</span>
                </button>
            </div>
        `;

        // Attach copy button logic AFTER it's in the DOM
        document.addEventListener('DOMContentLoaded', () => {
        const copyCheckbox = document.querySelector('.container input');
        const googleId = "${googleId}"; // dynamically insert user's Google ID here

        copyCheckbox.addEventListener('click', () => {
            navigator.clipboard.writeText(googleId)
            .then(() => {
                // Show the checkmark briefly to indicate success
                const svg = copyCheckbox.nextElementSibling.querySelector('svg');
                svg.style.opacity = '1';
                setTimeout(() => svg.style.opacity = '0', 1000); 
                console.log(`Copied!`);
            })
            .catch(err => console.error(`Failed to copy ID: ${err}`));
        });
    });

    }
});
