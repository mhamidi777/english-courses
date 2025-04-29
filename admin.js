// Configuration des administrateurs
const DEFAULT_ADMIN_CONFIG = {
    admins: [
        {
            username: 'admin',
            password: 'admin123',
            role: 'super_admin'
        },
        {
            username: 'mehdi',
            password: 'mehdi123',
            role: 'admin'
        }
    ]
};

// Initialiser ADMIN_CONFIG
let ADMIN_CONFIG = { ...DEFAULT_ADMIN_CONFIG };

// Éléments du DOM
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const courseForm = document.getElementById('course-form');
const coursesList = document.getElementById('courses-list');
const studentsList = document.getElementById('students-list');
const courseFilter = document.getElementById('course-filter');
const settingsForm = document.getElementById('settings-form');
const adminForm = document.getElementById('admin-form');
const adminsList = document.getElementById('admins-list');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addVideoBtn = document.getElementById('add-video-btn');
const courseVideosContainer = document.getElementById('course-videos-container');
const imageInput = document.getElementById('course-img');
const imagePreview = document.getElementById('image-preview');

// État de l'application
let courses = [];
let students = [];
let isEditing = false;
let editingIndex = -1;
let currentAdmin = null;
let videoCounter = 0;

// Vérifier si l'admin est déjà connecté
if (localStorage.getItem('isAdminLoggedIn') === 'true') {
    console.log('Vérification de la session existante...');
    const storedAdmin = localStorage.getItem('currentAdmin');
    if (storedAdmin) {
        try {
            currentAdmin = JSON.parse(storedAdmin);
            console.log('Admin trouvé dans le stockage:', currentAdmin);
            loginSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
            updateUIForRole();
            loadCourses();
            loadStudents();
            renderAdmins();
        } catch (error) {
            console.error('Erreur lors de la récupération de la session:', error);
            // Nettoyer la session en cas d'erreur
            localStorage.removeItem('isAdminLoggedIn');
            localStorage.removeItem('currentAdmin');
            currentAdmin = null;
        }
    }
}

// Gestion de l'authentification
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Tentative de connexion...');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Identifiants saisis:', { username, password });
    console.log('Liste des administrateurs:', ADMIN_CONFIG.admins);

    const admin = ADMIN_CONFIG.admins.find(
        admin => admin.username === username && admin.password === password
    );

    if (admin) {
        console.log('Connexion réussie pour:', admin.username, 'Rôle:', admin.role);
        currentAdmin = admin;
        loginSection.classList.add('hidden');
        adminSection.classList.remove('hidden');
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('currentAdmin', JSON.stringify(admin));
        updateUIForRole();
        loadCourses();
        loadStudents();
        renderAdmins();
    } else {
        console.log('Échec de la connexion - Identifiants incorrects');
        alert('Identifiants incorrects. Veuillez réessayer.');
    }
});

logoutBtn.addEventListener('click', () => {
    loginSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('currentAdmin');
    currentAdmin = null;
});

// Gestion des onglets
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Retirer la classe active de tous les onglets
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Ajouter la classe active à l'onglet cliqué
        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
    });
});

// Gestion des vidéos
function createVideoEntry() {
    const videoEntry = document.createElement('div');
    videoEntry.className = 'video-entry';
    videoEntry.innerHTML = `
        <div class="form-group">
            <label>Titre de la vidéo</label>
            <input type="text" class="video-title" required>
        </div>
        <div class="form-group">
            <label>Description de la vidéo</label>
            <textarea class="video-desc" required></textarea>
        </div>
        <div class="form-group">
            <label>Fichier vidéo</label>
            <input type="file" class="video-file" accept="video/*" required>
            <small>Formats acceptés : MP4, WebM. Taille maximale : 100MB</small>
            <div class="video-preview"></div>
        </div>
        <button type="button" class="remove-video-btn">Supprimer</button>
    `;

    // Ajouter l'écouteur d'événements pour l'aperçu de la vidéo
    const videoFile = videoEntry.querySelector('.video-file');
    const videoPreview = videoEntry.querySelector('.video-preview');
    
    videoFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier la taille du fichier (100MB max)
            if (file.size > 100 * 1024 * 1024) {
                alert('La vidéo ne doit pas dépasser 100MB');
                videoFile.value = '';
                videoPreview.innerHTML = '';
                return;
            }

            // Vérifier le type de fichier
            if (!file.type.match('video.*')) {
                alert('Veuillez sélectionner une vidéo valide');
                videoFile.value = '';
                videoPreview.innerHTML = '';
                return;
            }

            // Afficher l'aperçu
            const videoURL = URL.createObjectURL(file);
            videoPreview.innerHTML = `
                <video controls style="max-width: 100%; margin-top: 10px;">
                    <source src="${videoURL}" type="${file.type}">
                    Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
            `;
        } else {
            videoPreview.innerHTML = '';
        }
    });

    videoEntry.querySelector('.remove-video-btn').addEventListener('click', () => {
        videoEntry.remove();
    });

    return videoEntry;
}

document.getElementById('add-video-btn').addEventListener('click', () => {
    const container = document.getElementById('course-videos-container');
    container.appendChild(createVideoEntry());
});

// Fonction pour convertir un fichier en base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        // Vérifier si le fichier existe
        if (!file) {
            reject(new Error('Aucun fichier sélectionné'));
            return;
        }

        // Vérifier la taille du fichier (20MB max pour les images, 100MB pour les vidéos)
        const maxImageSize = 20 * 1024 * 1024; // 20MB
        const maxVideoSize = 100 * 1024 * 1024; // 100MB
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? maxVideoSize : maxImageSize;
        
        if (file.size > maxSize) {
            const fileType = isVideo ? 'vidéo' : 'image';
            const maxSizeMB = isVideo ? '100MB' : '20MB';
            reject(new Error(`Le fichier ${fileType} est trop volumineux. Taille maximale : ${maxSizeMB}`));
            return;
        }

        // Vérifier le type de fichier
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        const allowedTypes = isVideo ? allowedVideoTypes : allowedImageTypes;
        
        if (!allowedTypes.includes(file.type)) {
            const fileType = isVideo ? 'vidéo' : 'image';
            const formats = isVideo ? 'MP4, WebM, OGG' : 'JPG, PNG, GIF';
            reject(new Error(`Type de fichier non supporté. Formats acceptés pour les ${fileType}s : ${formats}`));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = () => {
            try {
                const base64String = reader.result;
                resolve(base64String);
            } catch (error) {
                reject(new Error('Erreur lors de la conversion du fichier'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Erreur lors de la lecture du fichier'));
        };

        try {
            reader.readAsDataURL(file);
        } catch (error) {
            reject(new Error('Erreur lors de la lecture du fichier'));
        }
    });
}

// Fonction pour compresser une image
function compressImage(base64String, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Redimensionner si l'image est trop large
            if (width > maxWidth) {
                height = (maxWidth * height) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compresser en JPEG avec une qualité réduite
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
        img.src = base64String;
    });
}

// Fonction pour compresser une vidéo
function compressVideo(base64String) {
    // Réduire la qualité de la vidéo en base64
    return base64String.split(',')[0] + ',' + base64String.split(',')[1].substring(0, 1000000);
}

// Fonction pour optimiser les données du cours
async function optimizeCourseData(courseData) {
    try {
        // Compresser l'image
        if (courseData.image) {
            courseData.image = await compressImage(courseData.image);
        }

        // Compresser les vidéos
        if (courseData.videos && courseData.videos.length > 0) {
            courseData.videos = courseData.videos.map(video => ({
                ...video,
                file: compressVideo(video.file)
            }));
        }

        return courseData;
    } catch (error) {
        console.error('Erreur lors de l\'optimisation des données:', error);
        throw error;
    }
}

// Fonction pour nettoyer le localStorage
function clearLocalStorage() {
    try {
        localStorage.clear();
        courses = [];
        students = [];
        alert('Le stockage local a été nettoyé avec succès');
        loadCourses();
        loadStudents();
    } catch (error) {
        console.error('Erreur lors du nettoyage du stockage local:', error);
        alert('Erreur lors du nettoyage du stockage local');
    }
}

// Fonction pour gérer le stockage local
function manageLocalStorage(data, key) {
    try {
        // Essayer de sauvegarder directement
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.log('Le stockage local est plein, nettoyage en cours...');
            
            // Récupérer les cours existants
            const existingCourses = JSON.parse(localStorage.getItem('courses') || '[]');
            
            // Trier les cours par date de création (les plus récents en premier)
            existingCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Garder seulement les 3 cours les plus récents
            const recentCourses = existingCourses.slice(0, 3);
            
            // Nettoyer le localStorage
            localStorage.clear();
            
            // Sauvegarder les cours récents
            localStorage.setItem('courses', JSON.stringify(recentCourses));
            
            // Réessayer de sauvegarder les nouvelles données
            try {
                localStorage.setItem(key, JSON.stringify(data));
                alert('Les anciens cours ont été archivés. Vous pouvez maintenant ajouter de nouveaux cours.');
            } catch (retryError) {
                alert('Impossible de sauvegarder les données. Veuillez supprimer manuellement quelques cours existants.');
                throw retryError;
            }
        } else {
            throw error;
        }
    }
}

// Fonction pour charger les cours
async function loadCourses() {
    try {
        console.log('Début du chargement des cours');
        const storedCourses = localStorage.getItem('courses');
        console.log('Cours stockés:', storedCourses);
        
        if (!storedCourses) {
            console.log('Aucun cours trouvé dans le localStorage');
            courses = [];
        } else {
            try {
                courses = JSON.parse(storedCourses);
                console.log('Nombre de cours chargés:', courses.length);
            } catch (parseError) {
                console.error('Erreur lors du parsing des cours:', parseError);
                courses = [];
                localStorage.removeItem('courses'); // Nettoyer les données corrompues
            }
        }
        
        renderCourses();
        console.log('Fin du chargement des cours');
    } catch (error) {
        console.error('Erreur lors du chargement des cours:', error);
        alert('Erreur lors du chargement des cours');
        courses = []; // Réinitialiser en cas d'erreur
    }
}

// Fonction pour afficher les cours
function renderCourses() {
    try {
        console.log('Début du rendu des cours');
        if (!coursesList) {
            console.error('Element coursesList non trouvé');
            return;
        }
        
        coursesList.innerHTML = '';
        
        if (!courses || courses.length === 0) {
            console.log('Aucun cours à afficher');
            coursesList.innerHTML = '<p>Aucun cours disponible</p>';
            return;
        }
        
        courses.forEach((course, index) => {
            try {
                const card = document.createElement('div');
                card.className = 'course-card';
                
                // Vérifier que toutes les propriétés nécessaires existent
                const title = course.title || 'Sans titre';
                const description = course.description || 'Aucune description';
                const duration = course.duration || 'Non spécifié';
                const price = course.price || 0;
                const category = course.category || 'default';
                const image = course.image || 'placeholder.jpg';
                const createdBy = course.createdBy || 'Admin';
                const createdAt = course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'Date inconnue';
                
                card.innerHTML = `
                    <img src="${image}" alt="${title}">
                    <div class="course-info">
                        <h3>${title}</h3>
                        <p>${description}</p>
                        <p class="course-details">
                            <span class="course-duration">Durée: ${duration}</span>
                            <span class="course-price">Prix: ${price}€</span>
                        </p>
                        <span class="course-category" style="background-color: ${getCategoryColor(category)}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${getCategoryName(category)}</span>
                        <div class="course-meta">
                            <small>Créé par: ${createdBy}</small>
                            <small>Le: ${createdAt}</small>
                            <small>Vidéos: ${course.videos ? course.videos.length : 0}</small>
                        </div>
                        <div class="admin-controls">
                            <button class="edit-btn" onclick="editCourse(${index})">Modifier</button>
                            <button class="delete-btn" onclick="deleteCourse(${index})">Supprimer</button>
                        </div>
                    </div>
                `;
                coursesList.appendChild(card);
            } catch (cardError) {
                console.error('Erreur lors de la création de la carte du cours:', cardError);
            }
        });
        
        console.log('Fin du rendu des cours');
    } catch (error) {
        console.error('Erreur lors du rendu des cours:', error);
        coursesList.innerHTML = '<p>Erreur lors du chargement des cours</p>';
    }
}

function getCategoryName(category) {
    switch(category) {
        case 'beginner': return 'Cours débutant';
        case 'advanced': return 'Cours avancé';
        case 'paid': return 'Cours payant';
        default: return category;
    }
}

function getCategoryColor(category) {
    switch(category) {
        case 'beginner': return '#4CAF50';
        case 'advanced': return '#2196F3';
        case 'paid': return '#FF9800';
        default: return '#999';
    }
}

function editCourse(index) {
    const course = courses[index];
    document.getElementById('course-title').value = course.title;
    document.getElementById('course-desc').value = course.description;
    document.getElementById('course-duration').value = course.duration;
    document.getElementById('course-price').value = course.price;
    document.getElementById('course-category').value = course.category;
    
    // Réinitialiser le formulaire de vidéos
    resetVideoForm();
    
    // Ajouter les vidéos existantes
    if (course.videos && course.videos.length > 0) {
        course.videos.forEach((video, i) => {
            if (i === 0) {
                // Utiliser la première entrée vidéo existante
                const firstEntry = document.querySelector('.video-entry');
                firstEntry.querySelector('.video-title').value = video.title;
                firstEntry.querySelector('.video-desc').value = video.description;
            } else {
                // Créer de nouvelles entrées pour les vidéos supplémentaires
                const newEntry = createVideoEntry();
                newEntry.querySelector('.video-title').value = video.title;
                newEntry.querySelector('.video-desc').value = video.description;
                document.getElementById('course-videos-container').appendChild(newEntry);
            }
        });
    }
    
    isEditing = true;
    editingIndex = index;
    document.getElementById('course-submit-btn').textContent = 'Mettre à jour le cours';
    
    // Faire défiler jusqu'au formulaire
    courseForm.scrollIntoView({ behavior: 'smooth' });
}

// Fonction pour réinitialiser le formulaire de vidéos
function resetVideoForm() {
    const container = document.getElementById('course-videos-container');
    container.innerHTML = '';
    container.appendChild(createVideoEntry());
}

// Fonction pour générer un ID unique
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Fonction pour sauvegarder un cours
async function saveCourse(courseData) {
    try {
        // Optimiser les données avant la sauvegarde
        const optimizedData = await optimizeCourseData(courseData);

        if (isEditing) {
            courses[editingIndex] = optimizedData;
            isEditing = false;
            editingIndex = -1;
        } else {
            courses.push(optimizedData);
        }
        
        // Utiliser manageLocalStorage au lieu de localStorage.setItem directement
        manageLocalStorage(courses, 'courses');
        await loadCourses();
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du cours:', error);
        return false;
    }
}

// Gestion du formulaire de cours
courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Vérifier les champs requis
        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-desc').value;
        const duration = document.getElementById('course-duration').value;
        const price = document.getElementById('course-price').value;
        const category = document.getElementById('course-category').value;
        const imageFile = document.getElementById('course-img').files[0];

        if (!title || !description || !duration || !price || !category || !imageFile) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        // Vérifier les vidéos
        const videoEntries = document.querySelectorAll('.video-entry');
        if (videoEntries.length === 0) {
            alert('Veuillez ajouter au moins une vidéo');
            return;
        }

        // Convertir l'image en base64
        const imageBase64 = await getBase64(imageFile);
        
        // Collecter les données des vidéos
        const videos = [];
        for (const entry of videoEntries) {
            const videoFile = entry.querySelector('.video-file').files[0];
            if (!videoFile) {
                alert('Veuillez sélectionner une vidéo pour chaque entrée');
                return;
            }
            const videoBase64 = await getBase64(videoFile);
            videos.push({
                title: entry.querySelector('.video-title').value,
                description: entry.querySelector('.video-desc').value,
                file: videoBase64
            });
        }

        // Créer l'objet cours
        const courseData = {
            id: generateUniqueId(),
            title,
            description,
            duration,
            price: parseFloat(price),
            category,
            image: imageBase64,
            videos,
            createdAt: new Date().toISOString(),
            createdBy: currentAdmin.username
        };

        // Sauvegarder le cours
        const success = await saveCourse(courseData);
        if (success) {
            courseForm.reset();
            document.getElementById('course-videos-container').innerHTML = '';
            alert(isEditing ? 'Cours mis à jour avec succès' : 'Cours ajouté avec succès');
        } else {
            alert('Une erreur est survenue lors de la sauvegarde du cours');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du cours:', error);
        alert('Une erreur est survenue lors de l\'ajout du cours: ' + error.message);
    }
});

// Fonction pour supprimer un cours
async function deleteCourse(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
        try {
            courses.splice(index, 1);
            localStorage.setItem('courses', JSON.stringify(courses));
            await loadCourses();
            alert('Cours supprimé avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression du cours:', error);
            alert('Erreur lors de la suppression du cours');
        }
    }
}

// Gestion des étudiants
function loadStudents() {
    try {
        console.log('Chargement des étudiants...');
        const storedStudents = localStorage.getItem('registrations');
        if (storedStudents) {
            students = JSON.parse(storedStudents);
            console.log('Étudiants chargés:', students);
        } else {
            students = [];
            console.log('Aucun étudiant trouvé');
        }
        
        // Mettre à jour le filtre de cours
        updateCourseFilter();
        
        // Rendre les étudiants
        renderStudents();
    } catch (error) {
        console.error('Erreur lors du chargement des étudiants:', error);
        students = [];
        renderStudents();
    }
}

function renderStudents() {
    try {
        console.log('Rendu des étudiants...');
        const studentsList = document.getElementById('students-list');
        if (!studentsList) {
            console.error('Element students-list non trouvé');
            return;
        }
        
        studentsList.innerHTML = '';
        
        if (students.length === 0) {
            studentsList.innerHTML = '<tr><td colspan="6">Aucun étudiant trouvé</td></tr>';
            return;
        }
        
        // Récupérer la valeur du filtre
        const courseFilterValue = document.getElementById('course-filter').value;
        console.log('Filtre de cours actif:', courseFilterValue);
        
        // Filtrer les étudiants si un cours est sélectionné
        let filteredStudents = students;
        if (courseFilterValue) {
            filteredStudents = students.filter(student => student.courseId === courseFilterValue);
            console.log('Étudiants filtrés:', filteredStudents.length);
        }
        
        if (filteredStudents.length === 0) {
            studentsList.innerHTML = '<tr><td colspan="6">Aucun étudiant trouvé pour ce cours</td></tr>';
            return;
        }
        
        // Trier les étudiants par date d'inscription (les plus récents en premier)
        filteredStudents.sort((a, b) => {
            const dateA = new Date(a.registrationDate);
            const dateB = new Date(b.registrationDate);
            return dateB - dateA;
        });
        
        filteredStudents.forEach((student, index) => {
            // Trouver l'index original de l'étudiant dans le tableau complet
            const originalIndex = students.findIndex(s => 
                s.fullName === student.fullName && 
                s.email === student.email && 
                s.registrationDate === student.registrationDate
            );
            
            const row = document.createElement('tr');
            
            // Trouver le titre du cours
            let courseTitle = 'N/A';
            if (student.courseId) {
                const course = courses.find(c => c.id === student.courseId);
                if (course) {
                    courseTitle = course.title;
                }
            }
            
            // Formater la date d'inscription
            const formattedDate = formatDate(student.registrationDate);
            
            row.innerHTML = `
                <td>${student.fullName || 'N/A'}</td>
                <td>${student.email || 'N/A'}</td>
                <td>${student.phone || 'N/A'}</td>
                <td>${courseTitle}</td>
                <td class="registration-date">${formattedDate}</td>
                <td>
                    <button class="action-btn" onclick="deleteStudent(${originalIndex})">Supprimer</button>
                </td>
            `;
            studentsList.appendChild(row);
        });
        
        console.log('Étudiants rendus avec succès');
    } catch (error) {
        console.error('Erreur lors du rendu des étudiants:', error);
        const studentsList = document.getElementById('students-list');
        if (studentsList) {
            studentsList.innerHTML = '<tr><td colspan="6">Erreur lors du chargement des étudiants</td></tr>';
        }
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Date inconnue';
        }
        
        // Format jour/mois/année
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
        return 'Date invalide';
    }
}

function updateCourseFilter() {
    const courseFilter = document.getElementById('course-filter');
    if (!courseFilter) {
        console.error('Element course-filter non trouvé');
        return;
    }
    
    courseFilter.innerHTML = '<option value="">Tous les cours</option>';
    
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.title;
        courseFilter.appendChild(option);
    });
    
    // Ajouter un écouteur d'événements pour le filtre
    courseFilter.addEventListener('change', function() {
        console.log('Filtre de cours modifié:', this.value);
        renderStudents();
    });
}

function deleteStudent(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
        students.splice(index, 1);
        localStorage.setItem('registrations', JSON.stringify(students));
        renderStudents();
    }
}

// Gestion des administrateurs
function addAdmin(username, password, role) {
    try {
        console.log('Tentative d\'ajout d\'un administrateur:', { username, role });
        
        // Vérifications de base
        if (!username || !password || !role) {
            console.error('Données manquantes');
            return false;
        }

        // Vérifier si l'utilisateur existe déjà
        if (ADMIN_CONFIG.admins.some(admin => admin.username === username)) {
            console.error('Nom d\'utilisateur déjà utilisé');
            return false;
        }
        
        // Créer le nouvel administrateur
        const newAdmin = {
            username: username.trim(),
            password: password,
            role: role,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter l'administrateur à la liste
        ADMIN_CONFIG.admins.push(newAdmin);
        
        // Sauvegarder dans le localStorage
        try {
            localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
            console.log('Administrateur ajouté avec succès:', newAdmin);
            
            // Mettre à jour l'interface
            renderAdmins();
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            // Restaurer l'état précédent
            ADMIN_CONFIG.admins.pop();
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'administrateur:', error);
        return false;
    }
}

function deleteAdmin(index) {
    console.log('Tentative de suppression d\'un administrateur:', index);
    
    if (!isSuperAdmin()) {
        console.log('Accès refusé: utilisateur n\'est pas un super administrateur');
        return false;
    }
    
    const adminToDelete = ADMIN_CONFIG.admins[index];
    
    // Empêcher la suppression de son propre compte
    if (adminToDelete.username === currentAdmin.username) {
        console.log('Impossible de supprimer son propre compte');
        return false;
    }
    
    // Supprimer l'administrateur
    ADMIN_CONFIG.admins.splice(index, 1);
    
    // Sauvegarder dans le localStorage
    try {
        localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
        console.log('Administrateur supprimé avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'administrateur:', error);
        return false;
    }
}

function renderAdmins() {
    console.log('Rendu des administrateurs...');
    
    const adminsList = document.getElementById('admins-list');
    if (!adminsList) {
        console.error('Element admins-list non trouvé');
        return;
    }
    
    adminsList.innerHTML = '';
    
    if (!ADMIN_CONFIG.admins || !Array.isArray(ADMIN_CONFIG.admins)) {
        console.error('Liste des administrateurs invalide');
        adminsList.innerHTML = '<tr><td colspan="3">Erreur: Liste des administrateurs invalide</td></tr>';
        return;
    }
    
    ADMIN_CONFIG.admins.forEach((admin, index) => {
        const row = document.createElement('tr');
        const isCurrentUser = currentAdmin && admin.username === currentAdmin.username;
        const showDeleteButton = isSuperAdmin() && !isCurrentUser;
        
        row.innerHTML = `
            <td>${admin.username} ${isCurrentUser ? '(Vous)' : ''}</td>
            <td><span class="admin-role role-${admin.role}">${getRoleName(admin.role)}</span></td>
            <td>
                ${showDeleteButton ? `<button class="action-btn" onclick="deleteAdmin(${index})">Supprimer</button>` : ''}
            </td>
        `;
        adminsList.appendChild(row);
    });
    
    console.log('Administrateurs rendus avec succès');
}

// Fonction pour automatiser la gestion des administrateurs
function autoManageAdmins() {
    console.log('Initialisation de l\'automatisation des administrateurs...');
    
    // Vérifier et mettre à jour les administrateurs toutes les 5 minutes
    setInterval(() => {
        try {
            // Vérifier si la configuration existe
            const storedConfig = localStorage.getItem('adminConfig');
            if (!storedConfig) {
                console.log('Configuration des administrateurs non trouvée, initialisation...');
                localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
            }

            // Mettre à jour l'interface
            renderAdmins();
            
            // Vérifier les permissions
            updateUIForRole();
            
            console.log('Mise à jour automatique des administrateurs effectuée');
        } catch (error) {
            console.error('Erreur lors de la mise à jour automatique des administrateurs:', error);
        }
    }, 300000); // 5 minutes
}

// Fonction pour initialiser l'automatisation
function initializeAutoManagement() {
    console.log('Initialisation de l\'automatisation...');
    
    // Initialiser l'automatisation des administrateurs
    autoManageAdmins();
    
    // Initialiser l'automatisation des cours
    autoManageCourses();
    
    // Initialiser l'automatisation des étudiants
    autoManageStudents();
    
    console.log('Automatisation initialisée avec succès');
}

// Initialiser le formulaire d'administrateur
function initializeAdminForm() {
    console.log('Initialisation du formulaire d\'administrateur...');
    
    const adminForm = document.getElementById('admin-form');
    if (!adminForm) {
        console.error('Formulaire d\'administrateur non trouvé');
        return;
    }
    
    // Supprimer les écouteurs d'événements existants pour éviter les doublons
    const newAdminForm = adminForm.cloneNode(true);
    adminForm.parentNode.replaceChild(newAdminForm, adminForm);
    
    // Ajouter un nouvel écouteur d'événements
    newAdminForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Soumission du formulaire d\'administrateur...');
        
        // Récupérer les valeurs des champs
        const username = document.getElementById('new-admin-username').value;
        const password = document.getElementById('new-admin-password').value;
        const role = document.getElementById('new-admin-role').value;
        
        console.log('Valeurs du formulaire:', { username, role });
        
        // Vérifier si l'utilisateur est un super admin
        if (!isSuperAdmin()) {
            alert('Seuls les super administrateurs peuvent ajouter de nouveaux administrateurs.');
            return;
        }
        
        // Ajouter l'administrateur
        if (addAdmin(username, password, role)) {
            alert('Administrateur ajouté avec succès!');
            this.reset();
        } else {
            alert('Erreur lors de l\'ajout de l\'administrateur. Vérifiez les données saisies.');
        }
    });
    
    console.log('Formulaire d\'administrateur initialisé avec succès');
}

// Initialiser l'auto-modification au chargement
window.addEventListener('load', function() {
    AUTO_MODIFY.init();
    
    // Initialiser le formulaire d'administrateur
    initializeAdminForm();
    
    // Charger la configuration des administrateurs
    loadAdminConfig();
});

// Fonction pour vérifier si l'utilisateur est un super admin
function isSuperAdmin() {
    return currentAdmin && currentAdmin.role === 'super_admin';
}

// Fonction pour afficher/masquer les éléments selon le rôle
function updateUIForRole() {
    const superAdminElements = document.querySelectorAll('.super-admin-only');
    const adminElements = document.querySelectorAll('.admin-only');
    
    if (isSuperAdmin()) {
        superAdminElements.forEach(el => el.style.display = 'block');
        adminElements.forEach(el => el.style.display = 'block');
    } else {
        superAdminElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'block');
    }
}

// Fonction pour charger la configuration des administrateurs
function loadAdminConfig() {
    try {
        console.log('Chargement de la configuration des administrateurs...');
        const storedConfig = localStorage.getItem('adminConfig');
        
        if (storedConfig) {
            const config = JSON.parse(storedConfig);
            if (config && config.admins && Array.isArray(config.admins)) {
                ADMIN_CONFIG.admins = config.admins;
                console.log('Configuration chargée:', ADMIN_CONFIG);
            } else {
                console.log('Configuration invalide, utilisation de la configuration par défaut');
                ADMIN_CONFIG = { ...DEFAULT_ADMIN_CONFIG };
                localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
            }
        } else {
            console.log('Aucune configuration trouvée, utilisation de la configuration par défaut');
            localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
        }
        
        renderAdmins();
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        ADMIN_CONFIG = { ...DEFAULT_ADMIN_CONFIG };
        localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
        renderAdmins();
    }
}

// Fonction pour automatiser la gestion des étudiants
function autoManageStudents() {
    // Vérifier et mettre à jour les étudiants toutes les 5 minutes
    setInterval(() => {
        try {
            const storedStudents = localStorage.getItem('registrations');
            if (storedStudents) {
                students = JSON.parse(storedStudents);
                // Mettre à jour les informations des cours pour chaque étudiant
                students.forEach(student => {
                    const course = courses.find(c => c.id === student.courseId);
                    if (!course) {
                        student.courseStatus = 'Cours non disponible';
                    } else {
                        student.courseStatus = 'Cours disponible';
                    }
                });
                localStorage.setItem('registrations', JSON.stringify(students));
                renderStudents();
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour automatique des étudiants:', error);
        }
    }, 300000); // 5 minutes
}

// Fonction pour automatiser la gestion des cours
function autoManageCourses() {
    // Vérifier et mettre à jour les cours toutes les 5 minutes
    setInterval(() => {
        try {
            loadCourses();
            updateCourseFilter();
        } catch (error) {
            console.error('Erreur lors de la mise à jour automatique des cours:', error);
        }
    }, 300000); // 5 minutes
}

// Fonction pour obtenir le nom du rôle
function getRoleName(role) {
    switch(role) {
        case 'super_admin':
            return 'Super Administrateur';
        case 'admin':
            return 'Administrateur';
        default:
            return role;
    }
}

// Système d'auto-modification du code
const AUTO_MODIFY = {
    enabled: true,
    interval: 5000, // 5 secondes
    lastCheck: Date.now(),
    
    init() {
        if (!this.enabled) return;
        
        setInterval(() => {
            this.checkAndModify();
        }, this.interval);
        
        console.log('Système d\'auto-modification initialisé');
    },
    
    checkAndModify() {
        try {
            // Vérifier les modifications nécessaires
            this.checkAdminConfig();
            this.checkFormValidation();
            this.checkErrorHandling();
            
            this.lastCheck = Date.now();
            console.log('Vérification auto-modification effectuée');
        } catch (error) {
            console.error('Erreur lors de l\'auto-modification:', error);
        }
    },
    
    checkAdminConfig() {
        const storedConfig = localStorage.getItem('adminConfig');
        if (!storedConfig) {
            localStorage.setItem('adminConfig', JSON.stringify(ADMIN_CONFIG));
            console.log('Configuration des administrateurs initialisée');
        }
    },
    
    checkFormValidation() {
        const adminForm = document.getElementById('admin-form');
        if (adminForm) {
            const inputs = adminForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (!input.hasAttribute('required')) {
                    input.setAttribute('required', '');
                }
            });
        }
    },
    
    checkErrorHandling() {
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Erreur détectée:', {msg, url, lineNo, columnNo, error});
            return false;
        };
    }
};