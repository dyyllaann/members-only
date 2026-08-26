function getLocation(options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function populateLocation(coords) {
  document.getElementById('lat-input').value = coords.latitude;
  document.getElementById('lng-input').value = coords.longitude;
}

if (window.location.pathname === '/nearby' && !window.location.search) {
  getLocation()
    .then((position) => {
      const { latitude, longitude } = position.coords;
      window.location.replace(`/nearby?lat=${latitude}&lng=${longitude}`);
    })
    .catch((error) => {
      console.error("Geolocation error:", error.message);
    });
}

// if (window.needsLocation) {
//   getLocation()
//     .then((position) => {
//       const { latitude, longitude } = position.coords;
//       window.location.replace(`/nearby?lat=${latitude}&lng=${longitude}`);
//     })
//     .catch((error) => {
//       console.error("Geolocation error:", error.message);
//     });
// }

// Called on post submission: attach coordinates to the hidden fields, then submit.
document.addEventListener('submit', (e) => {
  if (e.target && e.target.id === 'nearby-post-form') {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.post-btn');
    const originalBtnText = submitBtn.value;
    submitBtn.value = "Locating...";
    submitBtn.disabled = true;

    getLocation()
      .then((position) => {
        populateLocation(position.coords);
        form.submit();
      })
      .catch((error) => {
        console.error("Geolocation error:", error.message);
        alert("IvyLink could not determine your location. Check that location permissions are enabled and try again.");
        submitBtn.value = originalBtnText;
        submitBtn.disabled = false;
      });
  }
});