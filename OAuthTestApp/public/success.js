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
        // In a real app, you would invalidate the session here
        // For now, just redirect back to the login page
        window.location.href = '/';
    });
    
    function displayUserInfo(userData) {
        const { name, picture, id } = userData;
        
        userInfoDiv.innerHTML = `
            <div class="user-profile">
                <img src="${picture}" alt="Profile Picture" class="profile-picture" onerror="this.style.display='none'">
                <div class="user-name">${name}</div>
                <div class="user-id">ID: ${id}</div>
            </div>
        `;
    }
});
