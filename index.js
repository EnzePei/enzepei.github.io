// Smooth Scroll for Navigation
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent default anchor behavior
      const targetId = this.getAttribute('href'); // Get the target section ID
      const targetElement = document.querySelector(targetId);
  
      // Check if the target section exists
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth', // Enable smooth scrolling
          block: 'start', // Align the section to the top
        });
      }
    });
  });
  