// ==========================================
// ESTADO GLOBAL Y PERSISTENCIA
// ==========================================
let cart = JSON.parse(localStorage.getItem('urban_wear_cart')) || [];
let currentSlideIndex = 0;
let slideInterval = null;
let selectedSize = 'M'; // Talla por defecto para la tienda

// Inicialización única al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    startAutoSlide();
    initCartDelegation();
    initModalSizeSelection();
});

function saveCartToStorage() {
    localStorage.setItem('urban_wear_cart', JSON.stringify(cart));
}

// Escuchador dinámico para los botones de tallas dentro del modal
function initModalSizeSelection() {
    const sizeContainer = document.getElementById('modalSizeOptions');
    if (!sizeContainer) return;

    sizeContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.size-btn');
        if (!btn) return;

        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.innerText.trim();
    });
}

// ==========================================
// FILTRADO DE PRODUCTOS
// ==========================================
function filterProducts(category, event) {
    const cards = document.querySelectorAll('.product-card');
    const buttons = document.querySelectorAll('.filter-btn');

    // Cambiar estado activo en botones
    buttons.forEach(btn => btn.classList.remove('active'));
    if (event?.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // Filtrar tarjetas
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const isMatch = category === 'all' || cardCategory === category;
        
        card.style.display = isMatch ? 'block' : 'none';
        if (isMatch) card.style.animation = 'fadeIn 0.4s ease';
    });
}

// ==========================================
// LÓGICA DEL CARRITO DE COMPRAS (TALLA + TÍTULO)
// ==========================================
function addToCart(title, price, size = 'M') {
    // Identificar si existe el mismo título Y la misma talla
    const existingItem = cart.find(item => item.title === title && item.size === size);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ title, price, size, quantity: 1 });
    }

    saveCartToStorage();
    updateCartUI();
    toggleCart(true);
}

function removeFromCart(title, size) {
    cart = cart.filter(item => !(item.title === title && item.size === size));
    saveCartToStorage();
    updateCartUI();
}

function changeQuantity(title, size, change) {
    const item = cart.find(item => item.title === title && item.size === size);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(title, size);
    } else {
        saveCartToStorage();
        updateCartUI();
    }
}

// Delegación de eventos para las acciones dentro del Carrito
function initCartDelegation() {
    const list = document.getElementById('cartItemsList');
    if (!list) return;

    list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const title = decodeURIComponent(btn.dataset.title);
        const size = decodeURIComponent(btn.dataset.size);

        if (action === 'increase') changeQuantity(title, size, 1);
        if (action === 'decrease') changeQuantity(title, size, -1);
        if (action === 'remove') removeFromCart(title, size);
    });
}

// Renderizado del carrito con Fragment e indicación de Talla
function updateCartUI() {
    const list = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('cartTotal');
    const badgeEl = document.getElementById('cartCount');

    if (!list || !totalEl || !badgeEl) return;

    list.innerHTML = '';

    if (cart.length === 0) {
        list.innerHTML = '<p style="color: #a0a0a0; text-align: center; margin-top: 40px; font-size: 0.9rem;">Tu carrito está vacío</p>';
        totalEl.innerText = '$0.00';
        badgeEl.innerText = '0';
        return;
    }

    const fragment = document.createDocumentFragment();
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        count += item.quantity;

        const encodedTitle = encodeURIComponent(item.title);
        const encodedSize = encodeURIComponent(item.size);

        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-title">${item.title}</span>
                <span class="cart-item-price">$${item.price.toFixed(2)} | Talla: <strong>${item.size}</strong></span>
                <div class="cart-item-controls">
                    <button class="btn-qty" data-action="decrease" data-title="${encodedTitle}" data-size="${encodedSize}">-</button>
                    <span class="qty-count">${item.quantity}</span>
                    <button class="btn-qty" data-action="increase" data-title="${encodedTitle}" data-size="${encodedSize}">+</button>
                </div>
            </div>
            <div class="cart-item-subtotal">
                <span>$${itemTotal.toFixed(2)}</span>
                <button class="remove-item-btn" data-action="remove" data-title="${encodedTitle}" data-size="${encodedSize}" title="Eliminar">✕</button>
            </div>
        `;
        fragment.appendChild(li);
    });

    list.appendChild(fragment);
    totalEl.innerText = `$${total.toFixed(2)}`;
    badgeEl.innerText = count;
}

function toggleCart(forceOpen = false) {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');

    if (!drawer || !overlay) return;

    const isOpen = drawer.classList.contains('open');
    const shouldOpen = forceOpen || !isOpen;

    drawer.classList.toggle('open', shouldOpen);
    drawer.setAttribute('aria-hidden', String(!shouldOpen));
    overlay.style.display = shouldOpen ? 'block' : 'none';
}

/* MODIFICADO: Ahora checkout llama a la función de WhatsApp */
function checkout() {
    if (cart.length === 0) {
        alert('El carrito está vacío. Agrega productos antes de finalizar tu compra.');
        return;
    }

    enviarAWhatsApp(); // Envía los datos al chat
    cart = [];
    saveCartToStorage();
    updateCartUI();
    toggleCart(false);
}

// ==========================================
// BANNER SLIDER
// ==========================================
function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    if (slides.length === 0) return;

    currentSlideIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentSlideIndex);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlideIndex);
    });
}

function changeSlide(direction) {
    resetAutoSlide();
    showSlide(currentSlideIndex + direction);
}

function goToSlide(index) {
    resetAutoSlide();
    showSlide(index);
}

function startAutoSlide() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        showSlide(currentSlideIndex + 1);
    }, 5000);
}

function resetAutoSlide() {
    startAutoSlide();
}

// ==========================================
// MODAL DE PRODUCTO (GALERÍA + TALLA)
// ==========================================
function openProductModal(title, price, category, description, images = []) {
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalCategory = document.getElementById('modalCategory');
    const modalDescription = document.getElementById('modalDescription');
    const modalMainImg = document.getElementById('modalMainImg');
    const thumbnailsContainer = document.getElementById('modalThumbnails');
    const modalAddBtn = document.getElementById('btnAddToCartModal');
    const modal = document.getElementById('productModal');

    if (modalTitle) modalTitle.innerText = title;
    if (modalPrice) modalPrice.innerText = `$${price.toFixed(2)}`;
    if (modalCategory) modalCategory.innerText = category;
    if (modalDescription) modalDescription.innerText = description;

    // Renderizado de Galería de Imágenes
    if (images && images.length > 0) {
        if (modalMainImg) modalMainImg.src = images[0];

        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
            images.forEach((imgUrl, index) => {
                const thumb = document.createElement('img');
                thumb.src = imgUrl;
                thumb.className = `thumb-img ${index === 0 ? 'active' : ''}`;
                thumb.onclick = () => {
                    document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    if (modalMainImg) modalMainImg.src = imgUrl;
                };
                thumbnailsContainer.appendChild(thumb);
            });
        }
    }

    // Configuración del Botón para guardar Talla + Producto
    if (modalAddBtn) {
        modalAddBtn.onclick = () => {
            addToCart(title, price, selectedSize);
            closeProductModal();
        };
    }

    // Resetear selección de talla a 'M' al abrir
    selectedSize = 'M';
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.trim() === 'M');
    });

    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/* MODIFICADO: Corrección en formato de número y cálculo de total */
function enviarAWhatsApp() {
    const telefono = "584247834312"; // Formato internacional completo sin guiones
    let mensaje = "¡Hola! Quiero realizar el siguiente pedido:\n\n";
    let total = 0;

    // Iterar sobre los productos del carrito
    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        mensaje += `• ${item.title} (Talla: ${item.size}) x${item.quantity} - $${subtotal.toFixed(2)}\n`;
    });

    mensaje += `\n*Total a pagar:* $${total.toFixed(2)}`;

    // Abrir enlace de WhatsApp
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}
