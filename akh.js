// Fonction pour charger les cours depuis le localStorage
function loadCoursesFromStorage() {
    const storedCourses = localStorage.getItem('courses');
    if (storedCourses) {
        return JSON.parse(storedCourses);
    }
    return [];
}

// Fonction pour afficher les cours par catégorie
function displayCourses() {
    const courses = loadCoursesFromStorage();
    
    // Vider tous les conteneurs de cours
    document.querySelector('.beginner-courses').innerHTML = '';
    document.querySelector('.advanced-courses').innerHTML = '';
    document.querySelector('.paid-courses').innerHTML = '';
    
    // Filtrer et afficher les cours par catégorie
    const beginnerCourses = courses.filter(course => course.category === 'beginner');
    const advancedCourses = courses.filter(course => course.category === 'advanced');
    const paidCourses = courses.filter(course => course.category === 'paid');
    
    // Afficher les cours débutants
    beginnerCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        document.querySelector('.beginner-courses').appendChild(courseCard);
    });
    
    // Afficher les cours avancés
    advancedCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        document.querySelector('.advanced-courses').appendChild(courseCard);
    });
    
    // Afficher les cours payants
    paidCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        document.querySelector('.paid-courses').appendChild(courseCard);
    });
    
    // Afficher un message si aucune catégorie n'a de cours
    if (courses.length === 0) {
        document.querySelector('.beginner-courses').innerHTML = '<p class="no-courses">Aucun cours disponible pour le moment.</p>';
    }
}

// Fonction pour créer une carte de cours
function createCourseCard(course) {
    const courseCard = document.createElement('a');
    courseCard.href = `form.html?id=${course.id}`;
    courseCard.className = 'course-card';
    courseCard.innerHTML = `
        <img src="${course.image}" alt="${course.title}">
        <div class="course-info">
            <h3>${course.title}</h3>
            <p>${course.description}</p>
            <p class="course-details">
                <span class="course-duration">Durée: ${course.duration}</span>
                <span class="course-price">Prix: ${course.price}€</span>
            </p>
        </div>
    `;
    return courseCard;
}

// Fonction pour faire défiler les cours
function scrollCourses(category, direction) {
    const coursesContainer = document.querySelector(`.${category}-courses`);
    const scrollAmount = 300; // Ajustez selon vos besoins
    coursesContainer.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// Charger les cours au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les cours ont des IDs, sinon en ajouter
    const courses = loadCoursesFromStorage();
    let needsUpdate = false;
    
    const updatedCourses = courses.map(course => {
        if (!course.id) {
            needsUpdate = true;
            return {
                ...course,
                id: generateUniqueId()
            };
        }
        return course;
    });
    
    if (needsUpdate) {
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
    }
    
    displayCourses();
});

// Fonction pour générer un ID unique
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function scrollRight() {
  const container = document.querySelector('.courses');
  container.scrollBy({
      left: 300, // Déplace de 300px vers la droite
      behavior: 'smooth'
  });
}

// Le chargement dynamique des cours est désactivé car nous utilisons des cours statiques
// Si vous souhaitez revenir au chargement dynamique, décommentez le code ci-dessous

/*
// Fonction pour charger et afficher les cours depuis le localStorage
function loadCourses() {
  // Vérifier si nous sommes sur la page d'accueil
  if (document.querySelector('.course-container')) {
      const coursesContainer = document.querySelector('.courses');
      const courses = JSON.parse(localStorage.getItem('courses')) || [];
      
      // Vider le conteneur de cours existant
      coursesContainer.innerHTML = '';
      
      // Ajouter chaque cours au conteneur
      courses.forEach(course => {
          const courseCard = document.createElement('a');
          courseCard.href = 'form.html';
          courseCard.className = 'course-card';
          
          courseCard.innerHTML = `
              <img src="image/${course.img}" alt="${course.title}">
              <div class="course-info">
                  <h3>${course.title}</h3>
                  <p>${course.desc}</p>
                  <p class="course-details">
                      <span class="course-duration">Durée: ${course.duration}</span>
                      <span class="course-price">Prix: ${course.price}€</span>
                  </p>
              </div>
          `;
          
          coursesContainer.appendChild(courseCard);
      });
      
      // Si aucun cours n'est disponible, afficher un message
      if (courses.length === 0) {
          coursesContainer.innerHTML = '<p class="no-courses">Aucun cours disponible pour le moment.</p>';
      }
  }
}

// Charger les cours au chargement de la page
document.addEventListener('DOMContentLoaded', loadCourses);
*/