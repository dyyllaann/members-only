/**
 * UI Control Functions
 * Contains utility functions for user interface interactions
 */

/**
 * Toggle visibility of an element by adding/removing a CSS class
 * @param {HTMLElement} el - The element to toggle
 * @param {string} className - The CSS class to toggle
 */
var toggleVisible = (el, className) => {
  if (el) {
    el.classList.toggle(className);
  }
};