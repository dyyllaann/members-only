function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// public/javascripts/distance.js
document.addEventListener('submit', (e) => {
  if (e.target && e.target.id === 'nearby-post-form') {
    e.preventDefault(); 
    console.log("Form intercepted. Requesting location...");
    
    const form = e.target;
    const latInput = document.getElementById('lat-input');
    const lngInput = document.getElementById('lng-input');
    const submitBtn = form.querySelector('.post-btn');

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    const originalBtnText = submitBtn.value;
    submitBtn.value = "Locating...";
    submitBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location found! Lat:", position.coords.latitude, "Lng:", position.coords.longitude);
        
        latInput.value = position.coords.latitude;
        lngInput.value = position.coords.longitude;
        
        console.log("Submitting form to server...");
        form.submit();
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        alert("IvyLink needs your location to post. Please enable location permissions.");
        
        submitBtn.value = originalBtnText;
        submitBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }
});