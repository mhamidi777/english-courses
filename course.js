// Récupérer les paramètres de l'URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

// Éléments du DOM
const courseTitle = document.getElementById('course-title');
const courseDuration = document.getElementById('course-duration');
const coursePrice = document.getElementById('course-price');
const courseCategory = document.getElementById('course-category');
const courseVideo = document.getElementById('course-video');
const videoTitle = document.getElementById('video-title');
const videoDescription = document.getElementById('video-description');
const videoModulesList = document.getElementById('video-modules-list');

// Vérifier si l'utilisateur est inscrit au cours
function checkRegistration() {
    // Récupérer l'email de l'étudiant s'il existe dans le localStorage
    const studentEmail = localStorage.getItem('currentStudentEmail');
    
    if (!studentEmail) {
        alert('Vous devez vous inscrire au cours pour y accéder.');
        window.location.href = `form.html?id=${courseId}`;
        return false;
    }
    
    // Récupérer les étudiants depuis le localStorage
    const storedStudents = localStorage.getItem('students');
    if (!storedStudents) {
        alert('Vous devez vous inscrire au cours pour y accéder.');
        window.location.href = `form.html?id=${courseId}`;
        return false;
    }
    
    const students = JSON.parse(storedStudents);
    
    // Récupérer les cours depuis le localStorage
    const storedCourses = localStorage.getItem('courses');
    if (!storedCourses) {
        alert('Cours non trouvé.');
        window.location.href = 'index.html';
        return false;
    }
    
    const courses = JSON.parse(storedCourses);
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
        alert('Cours non trouvé.');
        window.location.href = 'index.html';
        return false;
    }
    
    // Vérifier si l'étudiant est inscrit à ce cours
    const isRegistered = students.some(student => 
        student.email === studentEmail && student.course === course.title
    );
    
    if (!isRegistered) {
        alert('Vous devez vous inscrire au cours pour y accéder.');
        window.location.href = `form.html?id=${courseId}`;
        return false;
    }
    
    return true;
}

// Charger les détails du cours
function loadCourseDetails() {
    // Récupérer les cours depuis le localStorage
    const storedCourses = localStorage.getItem('courses');
    if (!storedCourses) {
        alert('Cours non trouvé.');
        window.location.href = 'index.html';
        return;
    }

    const courses = JSON.parse(storedCourses);
    
    // Trouver le cours correspondant à l'ID
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
        alert('Cours non trouvé.');
        window.location.href = 'index.html';
        return;
    }

    // Afficher les détails du cours
    courseTitle.textContent = course.title;
    courseDuration.textContent = `Durée: ${course.duration}`;
    coursePrice.textContent = `Prix: ${course.price}€`;
    courseCategory.textContent = getCategoryName(course.category);
    
    // Charger les vidéos du cours
    loadCourseVideos(course);
}

// Fonction pour obtenir le nom de la catégorie
function getCategoryName(category) {
    switch(category) {
        case 'beginner': return 'Cours débutant';
        case 'advanced': return 'Cours avancé';
        case 'paid': return 'Cours payant';
        default: return category;
    }
}

// Charger les vidéos du cours
function loadCourseVideos(course) {
    // Vidéos YouTube (à remplacer par les vraies vidéos du cours)
    const videos = [
        {
            id: 1,
            title: 'Introduction au cours',
            description: 'Cette vidéo présente une introduction au cours et explique les objectifs d\'apprentissage.',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: '5:30'
        },
        {
            id: 2,
            title: 'Première leçon',
            description: 'Dans cette première leçon, nous aborderons les concepts fondamentaux du cours.',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: '15:45'
        },
        {
            id: 3,
            title: 'Exercices pratiques',
            description: 'Cette vidéo contient des exercices pratiques pour renforcer votre compréhension.',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: '10:20'
        },
        {
            id: 4,
            title: 'Évaluation',
            description: 'Cette vidéo vous guide à travers l\'évaluation finale du cours.',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: '8:15'
        }
    ];

    // Afficher la première vidéo par défaut
    if (videos.length > 0) {
        // Remplacer la balise video par un iframe YouTube
        courseVideo.outerHTML = `<iframe id="course-video" width="100%" height="400" src="${videos[0].url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        videoTitle.textContent = videos[0].title;
        videoDescription.textContent = videos[0].description;
    }

    // Afficher la liste des vidéos
    videoModulesList.innerHTML = '';
    videos.forEach(video => {
        const li = document.createElement('li');
        li.textContent = `${video.title} (${video.duration})`;
        li.dataset.videoId = video.id;
        li.dataset.videoUrl = video.url;
        
        li.addEventListener('click', () => {
            // Mettre à jour la vidéo active
            document.querySelectorAll('#video-modules-list li').forEach(item => {
                item.classList.remove('active');
            });
            li.classList.add('active');
            
            // Charger la vidéo sélectionnée
            const iframe = document.getElementById('course-video');
            iframe.src = video.url;
            
            // Mettre à jour les informations de la vidéo
            videoTitle.textContent = video.title;
            videoDescription.textContent = video.description;
        });
        
        videoModulesList.appendChild(li);
    });

    // Activer la première vidéo
    if (videoModulesList.firstChild) {
        videoModulesList.firstChild.classList.add('active');
    }
}

// Charger les détails du cours au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est inscrit au cours
    if (checkRegistration()) {
        loadCourseDetails();
    }
}); 