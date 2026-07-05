var OrderManager = OrderManager || {};

OrderManager.Home = (function () {
    var restaurants = [];
    var allProducts = [];
    var selectedRestaurantId = null;
    var activeCategory = null;

    var CATEGORIES = [
        { label: 'Lanches', keywords: ['burger', 'lanche', 'batata', 'frita'], icon: '🍔', color: 'chip-yellow' },
        { label: 'Pizza', keywords: ['pizza'], icon: '🍕', color: 'chip-pink' },
        { label: 'Japonesa', keywords: ['sushi', 'sashimi', 'roll', 'temaki'], icon: '🍣', color: 'chip-green' },
        { label: 'Saladas', keywords: ['salada'], icon: '🥗', color: 'chip-orange' },
        { label: 'Bebidas', keywords: ['bebida', 'refrigerante', 'suco', 'água', 'agua', 'chá', 'cha', 'coca'], icon: '🥤', color: 'chip-blue' },
        { label: 'Sobremesas', keywords: ['doce', 'sobremesa', 'brownie'], icon: '🍰', color: 'chip-purple' }
    ];

    function init() {
        bindEvents();
        OrderManager.Cart.onChange(updateCartDisplay);
        updateCartDisplay();
        loadData();
    }

    function bindEvents() {
        document.getElementById('cartBtn').addEventListener('click', openCheckout);
        document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
        document.getElementById('checkoutOverlay').addEventListener('click', function (e) {
            if (e.target === e.currentTarget) closeCheckout();
        });
        document.getElementById('checkoutConfirm').addEventListener('click', confirmCheckout);
        document.getElementById('carouselPrev').addEventListener('click', function () {
            document.getElementById('restaurantCarousel').scrollBy({ left: -200, behavior: 'smooth' });
        });
        document.getElementById('carouselNext').addEventListener('click', function () {
            document.getElementById('restaurantCarousel').scrollBy({ left: 200, behavior: 'smooth' });
        });
        document.getElementById('featuredRestaurants').addEventListener('click', function () {
            document.getElementById('restaurantsSection').scrollIntoView({ behavior: 'smooth' });
        });
        document.getElementById('searchInput').addEventListener('input', OrderManager.App.debounce(function () {
            renderMenu();
        }, 300));
    }

    function getRestaurantProducts() {
        return allProducts.filter(function (p) { return p.restaurantId === selectedRestaurantId; });
    }

    function productMatchesCategory(product, category) {
        var name = product.name.toLowerCase();
        return category.keywords.some(function (kw) { return name.indexOf(kw) !== -1; });
    }

    function getAvailableCategories() {
        var products = getRestaurantProducts();
        return CATEGORIES.filter(function (cat) {
            return products.some(function (p) { return productMatchesCategory(p, cat); });
        });
    }

    async function loadData() {
        showLoading(true);
        try {
            restaurants = await OrderManager.Api.getRestaurants();
            allProducts = await OrderManager.Api.getProducts();
            renderRestaurants();
            if (restaurants.length > 0) selectRestaurant(restaurants[0].id);
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    function showLoading(loading) {
        document.getElementById('restaurantSkeleton').classList.toggle('hidden', !loading);
        document.getElementById('restaurantCarousel').classList.toggle('hidden', loading);
    }

    function renderRestaurants() {
        var carousel = document.getElementById('restaurantCarousel');
        carousel.innerHTML = restaurants.map(function (r) {
            var color = OrderManager.App.avatarColor(r.name);
            var init = OrderManager.App.initials(r.name);
            return '<div class="restaurant-card' + (r.id === selectedRestaurantId ? ' selected' : '') + '" data-id="' + r.id + '">' +
                '<div class="restaurant-avatar" style="background:' + color + '">' + init + '</div>' +
                '<div class="name">' + escapeHtml(r.name) + '</div></div>';
        }).join('');

        carousel.querySelectorAll('.restaurant-card').forEach(function (card) {
            card.addEventListener('click', function () {
                selectRestaurant(parseInt(card.dataset.id, 10));
            });
        });
    }

    function renderCategories() {
        var available = getAvailableCategories();
        var section = document.getElementById('categoriesSection');
        var grid = document.getElementById('categoryGrid');

        section.classList.toggle('hidden', available.length === 0);

        if (activeCategory && !available.some(function (c) { return c.label === activeCategory; })) {
            activeCategory = null;
        }

        grid.innerHTML = available.map(function (cat) {
            return '<div class="category-chip' + (activeCategory === cat.label ? ' active' : '') + '" data-label="' + cat.label + '">' +
                '<div class="chip-bg ' + cat.color + '">' + cat.icon + '</div>' +
                '<div class="chip-label">' + cat.label + '</div></div>';
        }).join('');

        grid.querySelectorAll('.category-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                var label = chip.dataset.label;
                activeCategory = activeCategory === label ? null : label;
                renderCategories();
                renderMenu();
            });
        });
    }

    function selectRestaurant(id) {
        selectedRestaurantId = id;
        activeCategory = null;
        renderRestaurants();
        document.getElementById('menuPanel').classList.remove('hidden');
        var restaurant = restaurants.find(function (r) { return r.id === id; });
        document.getElementById('menuTitle').textContent = restaurant ? restaurant.name : 'Cardápio';
        renderCategories();
        renderMenu();
    }

    function renderMenu() {
        var container = document.getElementById('menuProducts');
        var products = getRestaurantProducts();

        if (activeCategory) {
            var category = CATEGORIES.find(function (c) { return c.label === activeCategory; });
            if (category) {
                products = products.filter(function (p) { return productMatchesCategory(p, category); });
            }
        }

        var search = document.getElementById('searchInput').value.toLowerCase().trim();
        if (search) {
            products = products.filter(function (p) {
                return p.name.toLowerCase().indexOf(search) !== -1;
            });
        }

        if (products.length === 0) {
            container.innerHTML = '<p style="color:var(--color-text-muted)">Nenhum produto encontrado.</p>';
            return;
        }

        container.innerHTML = products.map(function (p) {
            return '<div class="product-card">' +
                '<div class="product-info"><div class="product-name">' + escapeHtml(p.name) + '</div>' +
                '<div class="product-price">' + OrderManager.App.formatBRL(p.price) + '</div></div>' +
                '<button class="btn-add" data-product-id="' + p.id + '" title="Adicionar">+</button></div>';
        }).join('');

        container.querySelectorAll('.btn-add').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var product = products.find(function (p) { return p.id === parseInt(btn.dataset.productId, 10); });
                if (product) {
                    OrderManager.Cart.addItem(product, selectedRestaurantId);
                    OrderManager.App.showToast(product.name + ' adicionado ao carrinho', 'success');
                }
            });
        });
    }

    function updateCartDisplay() {
        document.getElementById('cartCount').textContent = OrderManager.Cart.getCount() + ' itens';
        document.getElementById('cartTotal').textContent = OrderManager.App.formatBRL(OrderManager.Cart.getTotal());
    }

    async function openCheckout() {
        var items = OrderManager.Cart.getItems();
        if (items.length === 0) {
            OrderManager.App.showToast('Carrinho vazio', 'error');
            return;
        }

        var list = document.getElementById('checkoutItems');
        list.innerHTML = items.map(function (i) {
            return '<div class="cart-item"><span>' + i.quantity + 'x ' + escapeHtml(i.name) + '</span>' +
                '<span>' + OrderManager.App.formatBRL(i.price * i.quantity) + '</span></div>';
        }).join('');
        document.getElementById('checkoutTotal').textContent = OrderManager.App.formatBRL(OrderManager.Cart.getTotal());

        var select = document.getElementById('customerSelect');
        select.innerHTML = '<option value="">Selecione o cliente</option>';
        try {
            var customers = await OrderManager.Api.getCustomers();
            customers.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        }

        document.getElementById('checkoutOverlay').classList.remove('hidden');
    }

    function closeCheckout() {
        document.getElementById('checkoutOverlay').classList.add('hidden');
    }

    async function confirmCheckout() {
        var customerId = parseInt(document.getElementById('customerSelect').value, 10);
        if (!customerId) {
            OrderManager.App.showToast('Selecione um cliente', 'error');
            return;
        }

        var btn = document.getElementById('checkoutConfirm');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        try {
            var notes = document.getElementById('checkoutNotes').value.trim();
            var order = await OrderManager.Api.createOrder({
                customerId: customerId,
                restaurantId: OrderManager.Cart.getRestaurantId(),
                items: OrderManager.Cart.toOrderItems(),
                notes: notes || null
            });
            OrderManager.Cart.clear();
            document.getElementById('checkoutNotes').value = '';
            closeCheckout();
            OrderManager.App.showToast('Pedido #' + order.id + ' criado! Acompanhe em Pedidos.', 'success');
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirmar pedido';
        }
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return { init: init };
})();

document.addEventListener('DOMContentLoaded', function () {
    OrderManager.Home.init();
});
