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

// Перемикання між входом і реєстрацією 
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const goToReg = document.getElementById('go-to-reg');
const goToLogin = document.getElementById('go-to-login');

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

// Завантаження курсів з бд 
async function fetchCourses() {
    try {
        const response = await fetch('http://localhost:3000/api/courses');
        const courses = await response.json();
        
        if (courses.length > 0) {
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
    }
}

//Завантаження квикладачів з бд 
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
    } catch (err) {
        console.error("Помилка викладачів:", err);
    }
}

// Завантаження відгуків з бд
async function loadReviews() {
    try {
        const response = await fetch('http://localhost:3000/api/reviews');
        const reviews = await response.json();

        if (reviews.length > 0) {
            reviewsContainer.innerHTML = reviews.map(r => `
                <article class="course-card" style="padding: 2rem;">
                    <div style="color: #ffc107; margin-bottom: 1rem;">
                        ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                    </div>
                    <p style="font-style: italic; margin-bottom: 1.5rem;">"${r.text}"</p>
                    <h4 style="color: var(--primary); font-weight: 700;">${r.client_name}</h4>
                </article>
            `).join('');
        }
    } catch (err) {
        console.error("Помилка відгуків:", err);
    }
}

//  Логіка авторизації
// Перевірка сесії користувача
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('gt_user'));
    if (user) {
        userStatus.textContent = `Привіт, ${user.name}!`;
        loginOpenBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        userStatus.textContent = '';
        loginOpenBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
}

// Вхід в акаунт
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) return alert("Заповніть поля!");

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('gt_user', JSON.stringify(data.user));
            location.reload();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Помилка з'єднання.");
    }
}

// Реєстрація нового користувача
async function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) return alert("Заповніть всі поля!");

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('gt_user', JSON.stringify(data.user));
            location.reload();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Помилка реєстрації.");
    }
}

// Вихід з акаунта
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('gt_user');
        location.reload();
    });
}

// Створення заявок
// Запис на конкретний курс
async function createOrder(courseId) {
    const user = JSON.parse(localStorage.getItem('gt_user'));
    if (!user) return alert("Будь ласка, увійдіть в акаунт.");

    const phone = prompt("Введіть ваш номер телефону:");
    if (!phone) return;

    await fetch('http://localhost:3000/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId, phone })
    });
    alert("Заявка відправлена!");
}

// Загальна консультація
async function requestConsultation() {
    const user = JSON.parse(localStorage.getItem('gt_user'));
    if (!user) {
        loginModal.style.display = 'flex';
        return;
    }

    const phone = prompt("Ваш телефон для консультації:");
    if (!phone) return;

    await fetch('http://localhost:3000/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: null, phone })
    });
    alert("Очікуйте на дзвінок!");
}

// Керевання модальним вікном
if (loginOpenBtn) loginOpenBtn.onclick = () => {
    loginModal.style.display = 'flex';
    loginView.classList.remove('hidden');
    registerView.classList.add('hidden');
};

if (closeModal) closeModal.onclick = () => loginModal.style.display = 'none';
if (loginSubmitBtn) loginSubmitBtn.onclick = handleLogin;
if (regSubmitBtn) regSubmitBtn.onclick = handleRegister;

window.onclick = (e) => { if (e.target == loginModal) loginModal.style.display = 'none'; };

// Меню
const burgerBtn = document.getElementById('burger-btn');
const navMenu = document.getElementById('nav');
if (burgerBtn) {
    burgerBtn.addEventListener('click', () => navMenu.classList.toggle('nav--active'));
}

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
    loadTeachers();
    loadReviews(); 
    checkAuthStatus();
});