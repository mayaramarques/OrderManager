var OrderManager = OrderManager || {};

OrderManager.Home = (function () {
    var restaurants = [];
    var allProducts = [];
    var selectedRestaurantId = null;
    var activeCategory = null;

    var CATEGORIES = [
        { label: 'Lanches', keyword: 'burger', icon: '🍔', color: 'chip-yellow' },
        { label: 'Pizza', keyword: 'pizza', icon: '🍕', color: 'chip-pink' },
        { label: 'Japonesa', keyword: 'sushi', icon: '🍣', color: 'chip-green' },
        { label: 'Saladas', keyword: 'salada', icon: '🥗', color: 'chip-orange' },
        { label: 'Bebidas', keyword: 'bebida', icon: '🥤', color: 'chip-blue' },
        { label: 'Sobremesas', keyword: 'doce', icon: '🍰', color: 'chip-purple' }
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
        document.getElementById('searchInput').addEventListener('input', OrderManager.App.debounce(function (e) {
            filterBySearch(e.target.value);
        }, 300));
    }

    async function loadData() {
        showLoading(true);
        try {
            restaurants = await OrderManager.Api.getRestaurants();
            allProducts = await OrderManager.Api.getProducts();
            renderRestaurants();
            renderCategories();
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
        var grid = document.getElementById('categoryGrid');
        grid.innerHTML = CATEGORIES.map(function (cat, i) {
            return '<div class="category-chip' + (activeCategory === cat.keyword ? ' active' : '') + '" data-keyword="' + cat.keyword + '">' +
                '<div class="chip-bg ' + cat.color + '">' + cat.icon + '</div>' +
                '<div class="chip-label">' + cat.label + '</div></div>';
        }).join('');

        grid.querySelectorAll('.category-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                var kw = chip.dataset.keyword;
                activeCategory = activeCategory === kw ? null : kw;
                renderCategories();
                renderMenu();
            });
        });
    }

    async function selectRestaurant(id) {
        selectedRestaurantId = id;
        renderRestaurants();
        document.getElementById('menuPanel').classList.remove('hidden');
        var restaurant = restaurants.find(function (r) { return r.id === id; });
        document.getElementById('menuTitle').textContent = restaurant ? restaurant.name : 'Cardápio';
        renderMenu();
    }

    function renderMenu() {
        var container = document.getElementById('menuProducts');
        var products = allProducts.filter(function (p) { return p.restaurantId === selectedRestaurantId; });

        if (activeCategory) {
            products = products.filter(function (p) {
                return p.name.toLowerCase().indexOf(activeCategory) !== -1;
            });
        }

        var search = document.getElementById('searchInput').value.toLowerCase();
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

    function filterBySearch() {
        renderMenu();
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
            var order = await OrderManager.Api.createOrder({
                customerId: customerId,
                restaurantId: OrderManager.Cart.getRestaurantId(),
                items: OrderManager.Cart.toOrderItems()
            });
            OrderManager.Cart.clear();
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
