let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('ministore_cart')) || [];

let currentSearch = '';
let currentCategory = 'all';
let currentSort = 'default';

// DOM Elements
let productGrid, loadingState, categoryFilters, cartBadge, cartModal, cartItemsContainer, cartTotalItems, cartTotalPrice, toastNotification, toastMessage, searchInput, sortSelect, checkoutBtn;

window.addEventListener('DOMContentLoaded', async () => {
    productGrid = document.getElementById('productGrid');
    loadingState = document.getElementById('loadingState');
    categoryFilters = document.getElementById('categoryFilters');
    cartBadge = document.getElementById('cartBadge');
    cartModal = document.getElementById('cartModal');
    cartItemsContainer = document.getElementById('cartItemsContainer');
    cartTotalItems = document.getElementById('cartTotalItems');
    cartTotalPrice = document.getElementById('cartTotalPrice');
    toastNotification = document.getElementById('toastNotification');
    toastMessage = document.getElementById('toastMessage');
    searchInput = document.getElementById('searchInput');
    sortSelect = document.getElementById('sortSelect');
    checkoutBtn = document.getElementById('checkoutBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderProducts();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            checkoutCart();
        });
    }

    // Attach listener to default 'Semua' button
    const defaultCatBtn = document.querySelector('.cat-btn[data-cat="all"]');
    if (defaultCatBtn) {
        defaultCatBtn.addEventListener('click', () => filterCategory('all'));
    }

    await fetchProducts();
    await fetchCategories();
    updateCartUI();
});

async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) throw new Error('Network response was not ok');
        products = await response.json();
        if (loadingState) loadingState.classList.add('hidden');
        renderProducts();
    } catch (error) {
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="text-center py-12 text-red-400 text-sm">
                    <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                    <p>Gagal memuat produk. Periksa koneksi internet Anda.</p>
                </div>
            `;
        }
    }
}

async function fetchCategories() {
    try {
        const response = await fetch('https://fakestoreapi.com/products/categories');
        if (!response.ok) throw new Error('Network response was not ok');
        categories = await response.json();
        
        categories.forEach(cat => {
            const capitalized = cat.charAt(0).toUpperCase() + cat.slice(1);
            const btn = document.createElement('button');
            btn.addEventListener('click', () => filterCategory(cat));
            btn.setAttribute('data-cat', cat);
            btn.className = "cat-btn px-4 py-2 rounded-xl font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all whitespace-nowrap cursor-pointer";
            btn.innerText = capitalized;
            if (categoryFilters) categoryFilters.appendChild(btn);
        });
    } catch (error) {
        console.error('Gagal memuat kategori:', error);
    }
}

function getFilteredAndSortedProducts() {
    let result = [...products];

    if (currentSearch.trim() !== '') {
        const query = currentSearch.toLowerCase();
        result = result.filter(p => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }

    if (currentCategory !== 'all') {
        result = result.filter(p => p.category === currentCategory);
    }

    if (currentSort === 'low-high') {
        result.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'high-low') {
        result.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'rating') {
        result.sort((a, b) => b.rating.rate - a.rating.rate);
    }

    return result;
}

function renderProducts() {
    if (!productGrid) return;
    const displayList = getFilteredAndSortedProducts();

    if (displayList.length === 0) {
        productGrid.innerHTML = `
            <div class="col-span-full text-center py-16 text-slate-500 text-sm">
                <i class="fa-solid fa-box-open text-3xl mb-2 opacity-50"></i>
                <p>Tidak ada produk yang cocok dengan pencarian atau filter.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = displayList.map(p => `
        <div class="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-xl transition-all hover:border-slate-700 group">
            <div>
                <div class="w-full h-48 bg-white/5 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden mb-4">
                    <img src="${p.image}" alt="${escapeHtml(p.title)}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://placehold.co/300x300/1e293b/cbd5e1?text=Product'">
                    <span class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[10px] font-bold text-amber-400 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
                        <i class="fa-solid fa-star"></i> ${p.rating.rate} (${p.rating.count})
                    </span>
                </div>
                <span class="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md inline-block mb-1.5">${p.category}</span>
                <h3 class="font-bold text-sm text-slate-200 line-clamp-1 mb-1">${escapeHtml(p.title)}</h3>
                <p class="text-xs text-slate-400 line-clamp-2 mb-4">${escapeHtml(p.description)}</p>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span class="font-extrabold text-lg text-emerald-400">$${p.price.toFixed(2)}</span>
                <button data-product-id="${p.id}" class="add-to-cart-btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <i class="fa-solid fa-cart-plus"></i> Beli
                </button>
            </div>
        </div>
    `).join('');

    // Attach event listeners to Add to Cart buttons securely
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prodId = Number(btn.getAttribute('data-product-id'));
            const product = products.find(item => item.id === prodId);
            if (product) addToCart(product);
        });
    });
}

function filterCategory(cat) {
    currentCategory = cat;
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.getAttribute('data-cat') === cat) {
            btn.className = "cat-btn px-4 py-2 rounded-xl font-semibold bg-indigo-600 text-white transition-all whitespace-nowrap cursor-pointer shadow-md shadow-indigo-600/20";
        } else {
            btn.className = "cat-btn px-4 py-2 rounded-xl font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all whitespace-nowrap cursor-pointer";
        }
    });

    renderProducts();
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showToast(`Berhasil menambahkan "${product.title.substring(0, 20)}..." ke keranjang!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('ministore_cart', JSON.stringify(cart));
}

function updateCartUI() {
    if (!cartBadge || !cartTotalItems || !cartTotalPrice || !cartItemsContainer) return;

    const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.innerText = totalItemsCount;
    cartTotalItems.innerText = `${totalItemsCount} pcs`;

    const totalPriceVal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotalPrice.innerText = `$${totalPriceVal.toFixed(2)}`;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-12 text-slate-500 text-xs">
                <i class="fa-solid fa-basket-shopping text-3xl mb-2 opacity-40"></i>
                <p>Keranjang belanja Anda masih kosong.</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
            <img src="${item.image}" alt="${escapeHtml(item.title)}" class="w-14 h-14 object-contain bg-white/5 rounded-xl p-1 flex-shrink-0" onerror="this.src='https://placehold.co/100x100/1e293b/cbd5e1?text=Item'">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-xs text-slate-200 truncate">${escapeHtml(item.title)}</h4>
                <p class="text-xs font-bold text-emerald-400 mt-0.5">$${item.price.toFixed(2)}</p>
                
                <div class="flex items-center gap-2 mt-2">
                    <button data-dec-id="${item.id}" class="dec-btn w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer">-</button>
                    <span class="text-xs font-semibold text-slate-200">${item.quantity}</span>
                    <button data-inc-id="${item.id}" class="inc-btn w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer">+</button>
                </div>
            </div>
            <button data-del-id="${item.id}" class="del-btn text-slate-500 hover:text-red-400 p-2 transition-colors cursor-pointer" title="Hapus item">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        </div>
    `).join('');

    // Attach cart action listeners
    cartItemsContainer.querySelectorAll('.dec-btn').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(Number(btn.getAttribute('data-dec-id')), -1));
    });
    cartItemsContainer.querySelectorAll('.inc-btn').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(Number(btn.getAttribute('data-inc-id')), 1));
    });
    cartItemsContainer.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(Number(btn.getAttribute('data-del-id'))));
    });
}

window.toggleCartModal = function() {
    if (cartModal) {
        cartModal.classList.toggle('hidden');
    }
};

function checkoutCart() {
    if (cart.length === 0) {
        showToast('Keranjang Anda kosong!', 'error');
        return;
    }

    showToast('Checkout berhasil! Pesanan Anda sedang diproses. 🎉');
    cart = [];
    saveCart();
    updateCartUI();
    window.toggleCartModal();
}

function showToast(message) {
    if (!toastMessage || !toastNotification) return;
    toastMessage.innerText = message;
    toastNotification.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toastNotification.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
}