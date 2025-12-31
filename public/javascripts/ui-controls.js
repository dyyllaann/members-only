/**
 * UI Control Functions
 * Contains utility functions for user interface interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Profile dropdown toggle
  const profileButton = document.querySelector('.control-item.profile');
  const userMenu = document.getElementById('user-menu');
  
  if (profileButton && userMenu) {
    profileButton.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenu.classList.toggle('visible');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!profileButton.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.classList.remove('visible');
      }
    });
  }
});