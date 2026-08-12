const usernameInput = document.getElementById('username-input');
const feedbackSpan = document.getElementById('username-feedback');
const emailInput = document.getElementById('email-input');
const emailFeedbackSpan = document.getElementById('email-feedback');
const passwordInput = document.getElementById('password-input');
const passwordConfirmInput = document.getElementById('password-confirm-input');
const createAccountForm = document.getElementById('create-account-form');
const submitButton = document.getElementById('create-account-submit');

let usernameDebounceTimer;
let emailDebounceTimer;
let usernameAvailable = false;
let emailAvailable = false;

function updateSubmitButton() {
  const passwordsMatch = passwordInput.value === passwordConfirmInput.value;
  submitButton.disabled = !(
    createAccountForm.checkValidity() &&
    passwordsMatch &&
    usernameAvailable &&
    emailAvailable
  );
}

function setFeedback(element, message, isAvailable) {
  element.textContent = message;
  element.style.color = isAvailable ? 'green' : 'red';
  element.style.display = message ? 'block' : 'none';
}

usernameInput.addEventListener('input', function() {
  const username = this.value.trim();

  // Reset UI if they clear the input
  if (username.length === 0) {
    usernameAvailable = false;
    setFeedback(feedbackSpan, '', false);
    updateSubmitButton();
    return;
  }

  // Show a loading state if you want
  // feedbackSpan.textContent = 'Checking...';
  // feedbackSpan.style.color = 'gray';

  // Clear the previous timer on every keystroke
  clearTimeout(usernameDebounceTimer);
  usernameAvailable = false;
  updateSubmitButton();

  // Set a new timer. The fetch will only run if 500ms pass WITHOUT a keystroke
  usernameDebounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(`/create-account/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      console.log('Username check response:', data); // For debugging

      usernameAvailable = data.available && usernameInput.value.trim() === username;
      setFeedback(feedbackSpan, data.message, usernameAvailable);
      updateSubmitButton();
      
    } catch (error) {
      console.error('Error checking username:', error);
      usernameAvailable = false;
      setFeedback(feedbackSpan, 'Error checking availability.', false);
      updateSubmitButton();
    }
  }, 500); // 500 milliseconds (half a second)
});

emailInput.addEventListener('input', function() {
  const email = this.value.trim();

  // Reset UI if they clear the input
  if (email.length === 0) {
    emailAvailable = false;
    setFeedback(emailFeedbackSpan, '', false);
    updateSubmitButton();
    return;
  }

  if (!emailInput.validity.valid || !email.toLowerCase().endsWith('.edu')) {
    emailAvailable = false;
    setFeedback(emailFeedbackSpan, 'Enter a valid .edu email address.', false);
    clearTimeout(emailDebounceTimer);
    updateSubmitButton();
    return;
  }

  clearTimeout(emailDebounceTimer);
  emailAvailable = false;
  updateSubmitButton();

  emailDebounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(`/create-account/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      console.log('Email check response:', data); // For debugging

      emailAvailable = data.available && emailInput.value.trim() === email;
      setFeedback(emailFeedbackSpan, data.message, emailAvailable);
      updateSubmitButton();
      
    } catch (error) {
      console.error('Error checking email:', error);
      emailAvailable = false;
      setFeedback(emailFeedbackSpan, 'Error checking availability.', false);
      updateSubmitButton();
    }
  }, 500); // 500 milliseconds (half a second)
});

createAccountForm.addEventListener('input', updateSubmitButton);
updateSubmitButton();