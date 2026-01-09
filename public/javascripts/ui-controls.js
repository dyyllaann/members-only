/**
 * UI Control Functions
 * Contains utility functions for user interface interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // View toggle functionality
  const viewButtons = document.querySelectorAll('.view-btn');
  const postsContainer = document.querySelector('.posts-container');
  
  viewButtons.forEach(button => {
    button.addEventListener('click', function() {
      const view = this.dataset.view;
      
      // Update active button
      viewButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Update container class
      postsContainer.className = `posts-container ${view}-view`;
    });
  });

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

  // Like button functionality
  document.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      const postId = this.dataset.postId;
      
      try {
        const response = await fetch(`/post/${postId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        // Update UI
        this.querySelector('.like-count').textContent = data.likeCount;
        this.classList.toggle('liked', data.liked);
      } catch (error) {
        console.error('Error liking post:', error);
      }
    });
  });

  // Comment button functionality
  document.querySelectorAll('.comment-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const postId = this.dataset.postId;
      const post = this.closest('.post');
      
      toggleCommentInput(post, postId);
      loadComments(post, postId);
    });
  });

  // Show/hide comment input
  function toggleCommentInput(post, postId) {
    let commentInput = post.querySelector('.comment-input-container');
    let commentsList = post.querySelector('.comments-list');
    
    if (commentInput) {
      commentInput.classList.toggle('hidden');
      if (commentsList) {
        commentsList.classList.toggle('hidden'); // ← Toggle comments list too
      }
      
      if (!commentInput.classList.contains('hidden')) {
        commentInput.querySelector('input').focus();
      }
    } else {
      createCommentInput(post, postId);
    }
  }

  // Create comment input form
  function createCommentInput(post, postId) {
    const commentInput = document.createElement('div');
    commentInput.className = 'comment-input-container';
    commentInput.innerHTML = `
      <form class="comment-form" data-post-id="${postId}">
        <input 
          type="text" 
          class="comment-input" 
          placeholder="Write a comment..." 
          autocomplete="off"
          required
        />
        <button type="submit" class="btn comment-submit-btn">Post</button>
      </form>
    `;

    const postActions = post.querySelector('.post-actions');
    postActions.insertAdjacentElement('afterend', commentInput);
    commentInput.querySelector('input').focus();
    
    setupCommentFormSubmit(commentInput, postId);
  }

  // Handle comment form submission
  function setupCommentFormSubmit(commentInput, postId) {
    const form = commentInput.querySelector('.comment-form');
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const input = this.querySelector('.comment-input');
      const text = input.value.trim();
      
      if (!text) return;
      
      try {
        const response = await fetch(`/post/${postId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('POST response:', data);
          console.log('Comment to add:', data.comment);
          
          input.value = '';
          updateCommentCount(postId, data.commentCount);
          
          const post = document.querySelector(`[data-post-id="${postId}"]`);
          console.log('Found post:', post);
          
          addCommentToDOM(post, data.comment);
          console.log('Comment should be added now');
        }
      } catch (error) {
        console.error('Error posting comment:', error);
      }
    });
  }

  // Load and render existing comments
  async function loadComments(post, postId) {
    // Check if comments already loaded
    if (post.querySelector('.comments-list')) {
      return; // Already loaded
    }
    
    try {
      const response = await fetch(`/post/${postId}/comments`);
      const comments = await response.json();
      
      renderComments(post, comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  // Render comments list
  function renderComments(post, comments) {
    const commentsContainer = document.createElement('div');
    commentsContainer.className = 'comments-list';
    
    comments.forEach(comment => {
      const commentElement = createCommentElement(comment);
      commentsContainer.appendChild(commentElement);
    });
    
    // Insert after comment input
    const commentInput = post.querySelector('.comment-input-container');
    commentInput.insertAdjacentElement('afterend', commentsContainer);
  }

  // Create a single comment element
  function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    div.dataset.commentId = comment._id;
    div.innerHTML = `
      <div class="comment-header">
        <div class="comment-author">
          <span class="username">${comment.user.username}</span>
          <span class="major">${comment.user.major}</span>
        </div>
        <span class="timestamp">${comment.timestamp_formatted}</span>
      </div>
      <div class="comment-text">${comment.text}</div>
    `;
    return div;
  }

  // Add newly created comment to DOM
  function addCommentToDOM(post, comment) {
    let commentsList = post.querySelector('.comments-list');
    
    // If comments list doesn't exist, create it
    if (!commentsList) {
      commentsList = document.createElement('div');
      commentsList.className = 'comments-list';
      
      // Insert after comment input
      const commentInput = post.querySelector('.comment-input-container');
      if (commentInput) {
        commentInput.insertAdjacentElement('afterend', commentsList);
      }
    }
    
    // Create and add the new comment
    const commentElement = createCommentElement(comment);
    commentsList.append(commentElement); // Add to bottom
  }

  // Update comment count
  function updateCommentCount(postId, count) {
    const post = document.querySelector(`[data-post-id="${postId}"]`);
    const commentCount = post.querySelector('.comment-count');
    
    if (commentCount) {
      commentCount.textContent = count || 0;
    }
  }

});