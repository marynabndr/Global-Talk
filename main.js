// Елементи інтерфейсу 
const loginModal = document.getElementById('login-modal');
const loginOpenBtn = document.getElementById('login-open-btn');
const closeModal = document.getElementById('close-modal');
const loginSubmitBtn = document.getElementById('login-submit-btn');
const regSubmitBtn = document.getElementById('reg-submit-btn');
const logoutBtn = document.getElementById('logout-btn');
const userStatus = document.getElementById('user-status');

const coursesContainer = document.getElementById('courses-container');
const teachersContainer = document.getElementById('teachers-container');
const reviewsContainer = document.getElementById('reviews-container');

const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const goToReg = document.getElementById('go-to-reg');
const goToLogin = document.getElementById('go-to-login');

// Перемикання між входом і реєстрацією 
if (goToReg) {
    goToReg.onclick = (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        registerView.classList.remove('hidden');
    };
}
if (goToLogin) {
    goToLogin.onclick = (e) => {
        e.preventDefault();
        registerView.classList.add('hidden');
        loginView.classList.remove('hidden');
    };
}

// Завантаження курсів
async function fetchCourses() {
    try {
        const response = await fetch('http://localhost:3000/api/courses');
        const result = await response.json();
        
        // Перевіряємо, чи дані лежать у полі .data (якщо працює кеш), 
        // чи прийшли просто масивом
        const courses = result.data ? result.data : result;
        
        // Відображення "Джерела даних" у консолі 
        if (result.source) console.log(`Курси отримано з: ${result.source}`);

        if (Array.isArray(courses) && courses.length > 0) {
            coursesContainer.innerHTML = courses.map(course => `
                <article class="course-card">
                    <div class="course-card__info">
                        <div class="course-tag">${course.language}</div>
                        <h3>${course.title}</h3>
                        <p>Рівень: ${course.level}. Тривалість: ${course.duration}</p>
                        <span class="price">${course.price} грн</span>
                    </div>
                    <button class="btn btn--card" onclick="createOrder(${course.id})">Записатися</button>
                </article>
            `).join('');
        } else {
            coursesContainer.innerHTML = "<p>Наразі курсів немає.</p>";
        }
    } catch (err) {
        console.error("Помилка курсів:", err);
        coursesContainer.innerHTML = "<p>Помилка завантаження курсів.</p>";
    }
}

// Завантаження викладачів
async function loadTeachers() {
    try {
        const response = await fetch('http://localhost:3000/api/teachers');
        const teachers = await response.json();
        if (teachers.length > 0) {
            teachersContainer.innerHTML = teachers.map(t => `
                <article class="teacher-card active">
                    <div class="teacher-card__img">
                        <img src="${t.imageUrl || 'https://via.placeholder.com/400'}" alt="${t.full_name}">
                    </div>
                    <div class="teacher-card__content">
                        <p class="teacher-card__spec">${t.qualification || 'Expert'}</p>
                        <h3>${t.full_name}</h3>
                        <p>Досвід: ${t.experience || 'від 5 років'}</p>
                    </div>
                </article>
            `).join('');
        }
    } catch (err) { console.error("Помилка викладачів:", err); }
}

// Завантаження відгуків
async function loadReviews() {
    try {
        const response = await fetch('http://localhost:3000/api/reviews');
        const reviews = await response.json();
        if (reviews.length > 0) {
            reviewsContainer.innerHTML = reviews.map(r => `
                <article class="course-card" style="padding: 2rem;">
                    <div style="color: #ffc107; margin-bottom: 1rem;">★ ★ ★ ★ ★</div>
                    <p style="font-style: italic; margin-bottom: 1.5rem;">"${r.text}"</p>
                    <h4 style="color: var(--primary); font-weight: 700;">${r.client_name}</h4>
                </article>
            `).join('');
        }
    } catch (err) { console.error("Помилка відгуків:", err); }
}

// ПЕРЕВІРКА СТАТУСУ (JWT)
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('gt_user'));
    const token = localStorage.getItem('token');

    if (token && user) {
        userStatus.textContent = `Привіт, ${user.name}!`;
        if (loginOpenBtn) loginOpenBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        userStatus.textContent = '';
        if (loginOpenBtn) loginOpenBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

//  ВХІД 
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.success) {
            localStorage.setItem('token', data.accessToken); // Зберігаємо токен
            localStorage.setItem('gt_user', JSON.stringify(data.user)); // Зберігаємо інфо про юзера
            location.reload();
        } else {
            alert(data.message);
        }
    } catch (err) { alert("Помилка з'єднання з сервером."); }
}

// РЕЄСТРАЦІЯ 
async function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password')?.value || password; // Підтримка підтвердження

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword })
        });
        const data = await response.json();
        if (data.success) {
            alert("Реєстрація успішна! Тепер увійдіть.");
            location.reload();
        } else {
            alert(data.message || "Помилка валідації");
        }
    } catch (err) { alert("Помилка реєстрації."); }
}

// ВИХІД
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('gt_user');
        location.reload();
    });
}

// СТВОРЕННЯ ЗАЯВКИ (З ТОКЕНОМ)
async function createOrder(courseId) {
    const token = localStorage.getItem('token');
    if (!token) return alert("Будь ласка, увійдіть в акаунт.");

    const phone = prompt("Введіть ваш номер телефону:");
    if (!phone) return;

    const response = await fetch('http://localhost:3000/api/apply', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ПРЕД'ЯВЛЯЄМО ТОКЕН
        },
        body: JSON.stringify({ courseId, phone })
    });
    
    if (response.ok) alert("Заявка відправлена!");
    else alert("Помилка при відправці.");
}

// Управління модалкою
if (loginOpenBtn) loginOpenBtn.onclick = () => { loginModal.style.display = 'flex'; };
if (closeModal) closeModal.onclick = () => loginModal.style.display = 'none';
if (loginSubmitBtn) loginSubmitBtn.onclick = handleLogin;
if (regSubmitBtn) regSubmitBtn.onclick = handleRegister;

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    loadTeachers();
    loadReviews(); 
    checkAuthStatus();
});