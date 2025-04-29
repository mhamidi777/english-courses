// Récupérer les paramètres de l'URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

// Éléments du DOM
const courseTitle = document.getElementById('course-title');
const courseImage = document.getElementById('course-image');
const courseDescription = document.getElementById('course-description');
const courseDuration = document.getElementById('course-duration');
const coursePrice = document.getElementById('course-price');
const courseCategory = document.getElementById('course-category');
const registrationForm = document.getElementById('registration-form');

// Fonction pour charger les détails du cours
function loadCourseDetails(courseId) {
    const courses = JSON.parse(localStorage.getItem('courses')) || [];
    const course = courses.find(c => c.id === courseId);
    
    if (course) {
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-description').textContent = course.description;
        
        // Afficher d'autres détails si disponibles
        if (document.getElementById('course-duration')) {
            document.getElementById('course-duration').textContent = course.duration || '';
        }
        if (document.getElementById('course-price')) {
            document.getElementById('course-price').textContent = course.price || '';
        }
        if (document.getElementById('course-category')) {
            document.getElementById('course-category').textContent = course.category || '';
        }
    }
}

// Fonction pour vérifier si l'utilisateur est déjà inscrit
function checkRegistrationStatus(courseId) {
    if (!courseId) return;
    
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    const isRegistered = registrations.some(reg => reg.courseId === courseId);
    
    if (isRegistered) {
        // Afficher la section vidéo et masquer le formulaire
        document.getElementById('registration-form').style.display = 'none';
        document.getElementById('video-section').style.display = 'block';
        loadCourseVideos(courseId);
    } else {
        // Afficher le formulaire et masquer la section vidéo
        document.getElementById('registration-form').style.display = 'block';
        document.getElementById('video-section').style.display = 'none';
    }
}

// Fonction pour charger les vidéos du cours
function loadCourseVideos(courseId) {
    // Example videos - in a real application, these would come from a database
    const videos = [
        {
            id: 1,
            title: 'Introduction to the Course',
            description: 'An overview of what you will learn in this course',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 2,
            title: 'First Lesson',
            description: 'Getting started with the basics',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 3,
            title: 'Advanced Concepts',
            description: 'Deep dive into advanced topics',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        },
        {
            id: 4,
            title: 'Final Project',
            description: 'How to complete your final project',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }
    ];

    const videoList = document.getElementById('video-modules-list');
    videoList.innerHTML = '';

    videos.forEach(video => {
        const li = document.createElement('li');
        li.textContent = video.title;
        li.addEventListener('click', () => playVideo(video));
        videoList.appendChild(li);
    });

    // Jouer la première vidéo par défaut
    if (videos.length > 0) {
        playVideo(videos[0]);
    }
}

// Fonction pour jouer une vidéo
function playVideo(video) {
    const iframe = document.getElementById('video-player');
    iframe.src = video.url;
    
    document.getElementById('video-title').textContent = video.title;
    document.getElementById('video-description').textContent = video.description;
    
    // Mettre à jour la classe active dans la liste
    const videoItems = document.querySelectorAll('#video-modules-list li');
    videoItems.forEach(item => {
        item.classList.remove('active');
        if (item.textContent === video.title) {
            item.classList.add('active');
        }
    });
}

// Gérer la soumission du formulaire
document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId') || urlParams.get('id'); // Support both parameters
    
    if (courseId) {
        loadCourseDetails(courseId);
    }

    // Vérifier si l'utilisateur est déjà inscrit
    checkRegistrationStatus(courseId);

    // Ajouter l'écouteur d'événements pour le formulaire
    const form = document.getElementById('registration-form');
    form.addEventListener('submit', handleFormSubmit);
});

function handleFormSubmit(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId') || urlParams.get('id');
    
    const formData = {
        fullName: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        courseId: courseId
    };

    // Store registration data
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    registrations.push(formData);
    localStorage.setItem('registrations', JSON.stringify(registrations));

    // Hide form and show video section
    document.getElementById('registration-form').style.display = 'none';
    document.getElementById('video-section').style.display = 'block';

    // Load videos after registration
    loadCourseVideos(courseId);

    // Show success message
    alert('Registration successful! You can now access the course content.');
} 