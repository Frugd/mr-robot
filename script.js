import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    updateProfile, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    addDoc,
    collection,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ТВОЙ КОНФИГ
const firebaseConfig = {
    apiKey: "AIzaSyAaPpAVWhaiO35rFemklxTv-YnGNQ1u8Y4",
    authDomain: "sitestore-86c1b.firebaseapp.com",
    projectId: "sitestore-86c1b",
    storageBucket: "sitestore-86c1b.firebasestorage.app",
    messagingSenderId: "412619926190",
    appId: "1:412619926190:web:b7499e7b923de5057e1b3f",
    measurementId: "G-5D1NZS627H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Экспорт (привязка к window для доступности из HTML onclick атрибутов)
window.auth = getAuth(app);
window.db = getFirestore(app);
window.currentUser = null;

onAuthStateChanged(window.auth, (user) => {
    if (user) {
        window.currentUser = user;
        updateAuthUI(user);
        syncCartWithDB(user.uid);
    } else {
        window.currentUser = null;
        updateAuthUI(null);
    }
});

function syncCartWithDB(uid) {
    const cartRef = doc(window.db, 'users', uid, 'data', 'cart');
    onSnapshot(cartRef, (docSnap) => {
        if (docSnap.exists()) {
            window.cart = docSnap.data().items || [];
            window.updateCartUI(false); 
        }
    });
}

window.saveCartToDB = async (items) => {
    if (!window.currentUser || !window.db) return;
    try {
        await setDoc(doc(window.db, 'users', window.currentUser.uid, 'data', 'cart'), {
            items: items,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error saving cart:", e);
    }
};

// УЛУЧШЕННАЯ ФУНКЦИЯ РЕГИСТРАЦИИ С ВЫВОДОМ ОШИБОК
window.registerUser = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        // Пробуем записать в БД
        await setDoc(doc(window.db, 'users', user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        window.closeAuthModal();
        window.showToast(`Добро пожаловать, ${name}!`, 'success');
        updateAuthUI({ ...user, displayName: name });
    } catch (error) {
        console.error("Registration Error:", error);
        
        let msg = `Ошибка: ${error.code}`;
        if (error.code === 'auth/email-already-in-use') msg = "Этот Email уже занят";
        if (error.code === 'auth/weak-password') msg = "Пароль слишком простой (минимум 6 символов)";
        if (error.code === 'auth/operation-not-allowed') msg = "Вход по Email/Password отключен в Firebase Console!";
        if (error.code === 'permission-denied') msg = "Нет прав на запись в БД (проверьте Rules)";
        
        alert(msg);
    }
}

window.loginUser = async (email, password) => {
    try {
        await signInWithEmailAndPassword(window.auth, email, password);
        window.closeAuthModal();
        window.showToast("Вы успешно вошли!", "success");
    } catch (error) {
        console.error("Login Error:", error);
        let msg = "Ошибка входа";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            msg = "Неверный email или пароль";
        }
        alert(msg);
    }
}

window.logoutUser = async () => {
    if(confirm("Выйти из аккаунта?")) {
        await signOut(window.auth);
        location.reload();
    }
}

window.submitOrderToDB = async (orderData) => {
    try {
        await addDoc(collection(window.db, 'orders'), orderData);
        return true;
    } catch (e) {
        console.error("Order Error:", e);
        let msg = "Ошибка создания заказа. ";
        if(e.code === 'permission-denied') msg += "Проверьте правила БД (Firestore Rules).";
        else msg += e.message;
        alert(msg);
        return false;
    }
}

function updateAuthUI(user) {
    const authBtn = document.getElementById('auth-btn');
    const userAvatar = document.getElementById('user-avatar-container');
    const userNameDisplay = document.getElementById('user-name-display');

    if (user) {
        authBtn.classList.add('hidden');
        userAvatar.classList.remove('hidden');
        const name = user.displayName || user.email.split('@')[0];
        userNameDisplay.innerText = name.charAt(0).toUpperCase();
    } else {
        authBtn.classList.remove('hidden');
        userAvatar.classList.add('hidden');
    }
}

// --- ДАННЫЕ ТОВАРОВ (18 шт) ---
const products = [
    { id: 1, name: "Беспроводные наушники Pro", price: 12990, category: "electronics" },
    { id: 2, name: "Умные часы Series 5", price: 24500, category: "electronics" },
    { id: 3, name: "Рюкзак Urban Traveler", price: 4900, category: "accessories" },
    { id: 4, name: "Фотоаппарат Retro Cam", price: 45000, category: "electronics" },
    { id: 5, name: "Кроссовки Run Fast", price: 8900, category: "clothing" },
    { id: 6, name: "Очки Sun Block", price: 3200, category: "accessories" },
    { id: 7, name: "Худи Comfort", price: 5500, category: "clothing" },
    { id: 8, name: "Колонка Bass Mini", price: 3990, category: "electronics" },
    { id: 9, name: "Игровая мышь Viper", price: 4500, category: "electronics" },
    { id: 10, name: "Механическая клавиатура", price: 7800, category: "electronics" },
    { id: 11, name: "Джинсовая куртка", price: 6500, category: "clothing" },
    { id: 12, name: "Кошелек Leather", price: 2800, category: "accessories" },
    { id: 13, name: "Кепка Baseball", price: 1500, category: "accessories" },
    { id: 14, name: "Коврик для йоги", price: 1900, category: "accessories" },
    { id: 15, name: "Планшет Pro Tab", price: 32000, category: "electronics" },
    { id: 16, name: "Футболка Basic White", price: 1200, category: "clothing" },
    { id: 17, name: "Шарф Winter Warm", price: 1800, category: "clothing" },
    { id: 18, name: "Power Bank 20k", price: 3500, category: "electronics" }
];

const categories = [
    { id: 'all', name: 'Все' },
    { id: 'electronics', name: 'Электроника' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'accessories', name: 'Аксессуары' }
];

// --- ЛОГИКА УНИКАЛЬНЫХ ИЗОБРАЖЕНИЙ ---
const imagePool = Array.from({length: 30}, (_, i) => i + 1);
for (let i = imagePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [imagePool[i], imagePool[j]] = [imagePool[j], imagePool[i]];
}
products.forEach((product, index) => {
    product.imageId = imagePool[index];
});

window.handleImageError = function(img, id) {
    const currentSrc = img.src;
    if (currentSrc.endsWith('.jpg')) img.src = `img/${id}.png`;
    else if (currentSrc.endsWith('.png')) img.src = `img/${id}.webp`;
    else if (currentSrc.endsWith('.webp')) img.src = `img/${id}.gif`;
    else {
        img.style.display = 'none';
        img.nextElementSibling.classList.remove('hidden');
    }
};

// --- СОСТОЯНИЕ ---
window.cart = [];
let currentCategory = 'all';
let isLoginMode = true;

const productGrid = document.getElementById('product-grid');
const filtersContainer = document.getElementById('category-filters');
const cartModal = document.getElementById('cart-modal');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const cartBadge = document.getElementById('cart-badge');
const emptyState = document.getElementById('empty-state');
const authModal = document.getElementById('auth-modal');
const authContent = document.getElementById('auth-content');

function init() {
    renderFilters();
    renderProducts();
    initTheme();
    const localCart = localStorage.getItem('novaCart');
    if(localCart) {
        window.cart = JSON.parse(localCart);
        window.updateCartUI(false);
    }
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }
}

// Привязка к window для вызова из HTML
window.toggleTheme = function() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    document.getElementById('theme-icon').className = isDark ? 'ph-fill ph-sun text-xl' : 'ph-fill ph-moon text-xl';
}

function renderFilters() {
    filtersContainer.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat.id}')" class="px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${currentCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}">${cat.name}</button>
    `).join('');
}

// Привязка к window
window.setCategory = function(id) {
    currentCategory = id;
    renderFilters();
    renderProducts();
}

window.resetFilters = function() {
    window.setCategory('all');
    document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
}

window.scrollToProducts = function() {
    document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
}

function renderProducts() {
    const filtered = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        productGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    productGrid.innerHTML = filtered.map(product => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700 flex flex-col">
            <div class="relative h-64 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img 
                    src="img/${product.imageId}.jpg" 
                    alt="${product.name}"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onerror="handleImageError(this, ${product.imageId})"
                >
                <div class="hidden absolute inset-0 w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700">
                    <i class="ph ph-image text-4xl"></i>
                </div>
                <div class="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide z-10">
                    ${getCategoryName(product.category)}
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-1 leading-snug">${product.name}</h3>
                <p class="text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-4">${product.price.toLocaleString()} ₽</p>
                <button onclick="addToCart(${product.id})" class="mt-auto w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-200 transition font-medium flex items-center justify-center gap-2 active:scale-95">
                    <i class="ph ph-plus"></i> В корзину
                </button>
            </div>
        </div>
    `).join('');
}

function getCategoryName(id) {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : id;
}

window.toggleCart = function() {
    const isHidden = cartModal.classList.contains('modal-hidden');
    if (isHidden) {
        cartModal.classList.remove('modal-hidden');
        cartModal.classList.add('modal-visible');
        requestAnimationFrame(() => cartSidebar.classList.remove('translate-x-full'));
    } else {
        cartSidebar.classList.add('translate-x-full');
        setTimeout(() => {
            cartModal.classList.remove('modal-visible');
            cartModal.classList.add('modal-hidden');
        }, 300);
    }
}

window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = window.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty++;
    } else {
        window.cart.push({ ...product, qty: 1 });
    }
    window.updateCartUI(true);
    cartBadge.classList.add('bump-anim');
    setTimeout(() => cartBadge.classList.remove('bump-anim'), 300);
    window.showToast(`"${product.name}" в корзине`);
    if(cartModal.classList.contains('modal-hidden')) window.toggleCart();
}

window.removeFromCart = function(productId) {
    window.cart = window.cart.filter(item => item.id !== productId);
    window.updateCartUI(true);
}

window.changeQty = function(productId, delta) {
    const item = window.cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) window.removeFromCart(productId);
        else window.updateCartUI(true);
    }
}

window.updateCartUI = function(shouldSave = true) {
    const totalQty = window.cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.innerText = totalQty;
    cartBadge.classList.toggle('opacity-0', totalQty === 0);

    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-20">
                <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4"><i class="ph ph-shopping-cart text-4xl"></i></div>
                <p class="font-medium text-lg text-gray-900 dark:text-white">Корзина пуста</p>
                <button onclick="toggleCart()" class="mt-6 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-6 py-2 rounded-lg font-medium transition">В каталог</button>
            </div>`;
        document.getElementById('checkout-btn').disabled = true;
        cartTotalElement.innerText = "0 ₽";
    } else {
        document.getElementById('checkout-btn').disabled = false;
        cartItemsContainer.innerHTML = window.cart.map(item => `
            <div class="flex gap-4 p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl">
                <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                    <i class="ph ph-shopping-bag text-2xl text-gray-400"></i>
                </div>
                <div class="flex flex-1 flex-col justify-between">
                    <div>
                        <h3 class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">${item.name}</h3>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                            <button onclick="changeQty(${item.id}, -1)" class="w-5 h-5 flex items-center justify-center">-</button>
                            <span class="text-sm font-medium">${item.qty}</span>
                            <button onclick="changeQty(${item.id}, 1)" class="w-5 h-5 flex items-center justify-center">+</button>
                        </div>
                        <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400">${(item.price * item.qty).toLocaleString()} ₽</p>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.id})" class="text-gray-300 hover:text-red-500 self-start p-1"><i class="ph ph-trash"></i></button>
            </div>
        `).join('');
        const total = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        cartTotalElement.innerText = total.toLocaleString() + " ₽";
    }
    if (shouldSave) {
        localStorage.setItem('novaCart', JSON.stringify(window.cart));
        if (window.saveCartToDB) window.saveCartToDB(window.cart);
    }
}

window.checkout = async function() {
    if (window.cart.length === 0) return;
    if (!window.currentUser) {
        window.showToast("Пожалуйста, войдите в аккаунт", "normal");
        window.toggleCart();
        setTimeout(window.openAuthModal, 300);
        return;
    }

    const total = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    if(confirm(`Оформить заказ на сумму ${total.toLocaleString()} ₽?`)) {
        const orderData = {
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || "Без имени",
            userEmail: window.currentUser.email,
            items: window.cart.map(i => ({
                productId: i.id,
                name: i.name,
                qty: i.qty,
                price: i.price,
                total: i.price * i.qty
            })),
            totalAmount: total,
            status: "new",
            createdAt: new Date().toISOString()
        };

        const success = await window.submitOrderToDB(orderData);

        if (success) {
            window.cart = [];
            window.updateCartUI(true);
            window.toggleCart();
            window.showToast("Заказ успешно оформлен! Мы свяжемся с вами.", "success");
        }
    }
}

window.showToast = function(message, type = 'normal') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    msgEl.innerText = message;
    if (type === 'success') icon.className = 'ph-fill ph-check-circle text-green-400 dark:text-green-600 text-xl';
    else icon.className = 'ph-fill ph-info text-indigo-400 dark:text-indigo-300 text-xl';
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}

window.openAuthModal = function() {
    authModal.classList.remove('modal-hidden');
    authModal.classList.add('modal-visible');
    authContent.classList.remove('scale-95');
    authContent.classList.add('scale-100');
}

window.closeAuthModal = function() {
    authModal.classList.remove('modal-visible');
    authModal.classList.add('modal-hidden');
    authContent.classList.add('scale-95');
    authContent.classList.remove('scale-100');
}

window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const nameField = document.getElementById('name-field');
    const submitBtn = document.getElementById('submit-auth-btn');
    const toggleText = document.getElementById('toggle-auth-text');
    const nameInput = document.getElementById('auth-name');

    if (isLoginMode) {
        title.innerText = "Вход";
        nameField.classList.add('hidden');
        nameInput.required = false;
        submitBtn.innerText = "Войти";
        toggleText.innerText = "Нет аккаунта? Зарегистрироваться";
    } else {
        title.innerText = "Регистрация";
        nameField.classList.remove('hidden');
        nameInput.required = true;
        submitBtn.innerText = "Зарегистрироваться";
        toggleText.innerText = "Есть аккаунт? Войти";
    }
}

window.handleAuthSubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (isLoginMode) {
        window.loginUser(email, password);
    } else {
        const name = document.getElementById('auth-name').value;
        window.registerUser(email, password, name);
    }
}

init();
