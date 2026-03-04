// мобільне меню
const burgerBtn = document.getElementById('burger-btn');
const navMenu = document.getElementById('nav');

burgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('nav--active');
});

// закриття меню при кліку на посилання
document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('nav--active');
    });
});

// анімація появи елементів 
const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // припиняємо спостереження після появи
            revealOnScroll.unobserve(entry.target);
        }
    });
}, observerOptions);

// класи для анімації карткам
document.querySelectorAll('.course-card, .teacher-card').forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = `all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) ${index * 0.1}s`;
    
    
    const obs = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
        }
    }, { threshold: 0.1 });
    obs.observe(el);
});


window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.padding = "0.8rem 0";
        header.style.boxShadow = "0 10px 30px rgba(0,0,0,0.05)";
    } else {
        header.style.padding = "1.2rem 0";
        header.style.boxShadow = "none";
    }
});