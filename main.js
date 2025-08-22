/*===== MAIN SCRIPT =====*/
window.addEventListener('load', () => {
    // Initialize Typed.js
    const typed = new Typed('.typed', {
        strings: ['Full Stack Developer', 'UI/UX Designer', 'Problem Solver', 'Tech Enthusiast'],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 2000,
        loop: true,
        showCursor: true,
        cursorChar: '|',
        autoInsertCss: true,
    });
});

/*===== MENU SHOW =====*/ 
const showMenu = (toggleId, navId) =>{
    const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId)

    if(toggle && nav){
        toggle.addEventListener('click', ()=>{
            nav.classList.toggle('show')
        })
    }
}
showMenu('nav-toggle','nav-menu')

/*===== DARK MODE =====*/
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// Check for saved user preference, if any, on load of the website
const darkMode = localStorage.getItem('darkMode');
if (darkMode === 'enabled') {
    body.classList.add('dark-mode');
    darkModeToggle.querySelector('i').classList.replace('bx-moon', 'bx-sun');
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    
    if (body.classList.contains('dark-mode')) {
        icon.classList.replace('bx-moon', 'bx-sun');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        icon.classList.replace('bx-sun', 'bx-moon');
        localStorage.setItem('darkMode', null);
    }
});

/*===== SCROLL REVEAL ANIMATION =====*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 2000,
    delay: 200,
    reset: true,
    mobile: true,
    useDelay: 'onload',
    viewFactor: 0.2,
    viewOffset: {top: 0, right: 0, bottom: 0, left: 0}
});

/*SCROLL HOME*/
sr.reveal('.home__title', {
    duration: 2000,
    origin: 'left',
    distance: '80px',
    delay: 300
});
sr.reveal('.button', {
    duration: 2000,
    origin: 'right',
    distance: '80px',
    delay: 400
});
sr.reveal('.home__img', {
    duration: 2000,
    origin: 'bottom',
    distance: '60px',
    delay: 500
});
sr.reveal('.home__social-icon', {
    duration: 2000,
    origin: 'left',
    distance: '60px',
    delay: 600,
    interval: 200
});

/*SCROLL ABOUT*/
sr.reveal('.about__img', {
    duration: 2000,
    origin: 'left',
    distance: '90px',
    delay: 400
});
sr.reveal('.about__subtitle', {
    duration: 2000,
    origin: 'right',
    distance: '60px',
    delay: 500
});
sr.reveal('.about__text', {
    duration: 2000,
    origin: 'right',
    distance: '60px',
    delay: 600
});

/*SCROLL SKILLS*/
sr.reveal('.skills__subtitle', {
    duration: 2000,
    origin: 'left',
    distance: '60px',
    delay: 300
});
sr.reveal('.skills__text', {
    duration: 2000,
    origin: 'left',
    distance: '60px',
    delay: 400
});
sr.reveal('.skills__data', {
    duration: 1500,
    origin: 'right',
    distance: '60px',
    interval: 200
});
sr.reveal('.skills__img', {
    duration: 2000,
    origin: 'right',
    distance: '60px',
    delay: 600
});

/*SCROLL PROJECTS*/
sr.reveal('.projects__intro', {
    duration: 1500,
    origin: 'top',
    distance: '60px',
    delay: 300
});
sr.reveal('.github-stats', {
    duration: 1500,
    origin: 'bottom',
    distance: '60px',
    delay: 400
});
sr.reveal('.project-card', {
    duration: 1500,
    origin: 'bottom',
    distance: '60px',
    interval: 200,
    delay: 500
});

/*SCROLL WORK*/
sr.reveal('.work__img', {
    duration: 1500,
    origin: 'bottom',
    distance: '60px',
    interval: 200
});

/*SCROLL CONTACT*/
sr.reveal('.contact__input', {
    duration: 1500,
    origin: 'left',
    distance: '60px',
    interval: 200
});

// Add smooth parallax effect
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.home__data, .skills__subtitle');
    
    parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Add current year to footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Enhanced navigation active state
const navLinks = document.querySelectorAll('.nav__link');

function removeAllActiveClasses() {
    navLinks.forEach(link => link.classList.remove('active-link'));
}

navLinks.forEach(link => {
    link.addEventListener('click', function() {
        removeAllActiveClasses();
        this.classList.add('active-link');
    });
});

/*===== ACTIVE SECTIONS HIGHLIGHT =====*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        const sectionId = current.getAttribute('id')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.add('active-link')
        }else{
            document.querySelector('.nav__menu a[href*=' + sectionId + ']').classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*===== SMOOTH SCROLL =====*/
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Exclude fixed image from animation
ScrollReveal().reveal('.fixed-image', { reset: false, distance: '0px', duration: 0, delay: 0 });

// Make sure any other animations don't affect the image
document.addEventListener('DOMContentLoaded', function() {
    const fixedImage = document.querySelector('.fixed-image');
    if (fixedImage) {
        // Override any animations applied to this element
        fixedImage.style.transform = 'none';
        fixedImage.style.transition = 'none';
        fixedImage.style.animation = 'none';
    }
});

/*===== EMAIL JS CONFIGURATION =====*/
(function() {
    // Initialize EmailJS with your public key
    emailjs.init("ML0a9XcmR95GavNU6");
    
    // Get form element
    const contactForm = document.getElementById('contact-form');
    const submitButton = document.getElementById('submit-btn');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Change button text while sending
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Prepare template parameters according to template field names
            const templateParams = {
                to_email: 'pushkarakagitha@gmail.com', // Your email that will receive messages
                name: name,                            // From name in template
                reply_to: email,                       // Reply-to address in template
                message: `Email: ${email}\n\n${message}`  // Include email in the message content
            };
            
            // Send the email using EmailJS
            emailjs.send('service_yt3hg9w', 'template_h3bdgej', templateParams)
                .then(function(response) {
                    console.log('SUCCESS!', response.status, response.text);
                    
                    // Show success message
                    showEmailStatus('Message sent successfully!', 'success');
                    
                    // Reset the form
                    contactForm.reset();
                }, function(error) {
                    console.log('FAILED...', error);
                    
                    // Show error message
                    showEmailStatus('Failed to send message. Please try again.', 'error');
                })
                .finally(function() {
                    // Reset button
                    submitButton.textContent = 'Send Message';
                    submitButton.disabled = false;
                });
        });
    }
    
    // Function to show status message
    function showEmailStatus(message, type) {
        // Create status element if it doesn't exist
        let statusElement = document.getElementById('email-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'email-status';
            contactForm.appendChild(statusElement);
        }
        
        // Set message and style based on type
        statusElement.textContent = message;
        statusElement.className = `email-status ${type}`;
        
        // Show the message
        statusElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
})(); 