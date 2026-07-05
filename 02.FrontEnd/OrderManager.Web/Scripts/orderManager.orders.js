var OrderManager = OrderManager || {};

OrderManager.Orders = (function () {
    var currentPage = 1;
    var totalPages = 1;
    var customers = [];
    var restaurants = [];
    var filters = { status: '', restaurantId: '', customerId: '' };

    function init() {
        bindEvents();
        loadFilters();
        loadSummary();
        loadOrders();
    }

    function bindEvents() {
        document.getElementById('filterStatus').addEventListener('change', function (e) {
            filters.status = e.target.value;
            currentPage = 1;
            loadOrders();
        });
        document.getElementById('filterRestaurant').addEventListener('change', function (e) {
            filters.restaurantId = e.target.value;
            currentPage = 1;
            loadOrders();
        });
        document.getElementById('filterCustomer').addEventListener('input', OrderManager.App.debounce(function (e) {
            var term = e.target.value.toLowerCase();
            if (!term) {
                filters.customerId = '';
            } else {
                var match = customers.find(function (c) {
                    return c.name.toLowerCase().indexOf(term) !== -1;
                });
                filters.customerId = match ? match.id : -1;
            }
            currentPage = 1;
            loadOrders();
        }, 400));
        document.getElementById('loadMoreBtn').addEventListener('click', function () {
            currentPage++;
            loadOrders(true);
        });
    }

    async function loadFilters() {
        try {
            customers = await OrderManager.Api.getCustomers();
            restaurants = await OrderManager.Api.getRestaurants();
            var select = document.getElementById('filterRestaurant');
            restaurants.forEach(function (r) {
                var opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.name;
                select.appendChild(opt);
            });
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        }
    }

    async function loadSummary() {
        try {
            var summary = await OrderManager.Api.getSummary('status');
            var grid = document.getElementById('summaryGrid');
            var todayCount = 0;
            var todayRevenue = 0;

            var today = new Date().toISOString().split('T')[0];
            var orders = await OrderManager.Api.getOrders({ from: today + 'T00:00:00', pageSize: 100 });
            todayCount = orders.totalCount;
            todayRevenue = orders.items.reduce(function (s, o) { return s + o.total; }, 0);

            var preparing = summary.find(function (s) { return s.key === 'Preparing'; });
            var onTheWay = summary.find(function (s) { return s.key === 'OnTheWay'; });

            grid.innerHTML =
                '<div class="summary-card"><div class="summary-value">' + todayCount + '</div><div class="summary-label">Pedidos hoje</div></div>' +
                '<div class="summary-card"><div class="summary-value">' + (preparing ? preparing.count : 0) + '</div><div class="summary-label">Em preparo</div></div>' +
                '<div class="summary-card"><div class="summary-value">' + (onTheWay ? onTheWay.count : 0) + '</div><div class="summary-label">A caminho</div></div>' +
                '<div class="summary-card"><div class="summary-value">' + OrderManager.App.formatBRL(todayRevenue) + '</div><div class="summary-label">Faturamento hoje</div></div>';
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        }
    }

    async function loadOrders(append) {
        var list = document.getElementById('ordersList');
        if (!append) {
            list.innerHTML = '<div class="loading-overlay">Carregando pedidos...</div>';
        }

        var params = { page: currentPage, pageSize: 10 };
        if (filters.status) params.status = filters.status;
        if (filters.restaurantId) params.restaurantId = filters.restaurantId;
        if (filters.customerId) params.customerId = filters.customerId;

        try {
            var result = await OrderManager.Api.getOrders(params);
            totalPages = result.totalPages;

            if (!append) list.innerHTML = '';

            if (result.items.length === 0 && currentPage === 1) {
                list.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:2rem">Nenhum pedido encontrado.</p>';
            } else {
                result.items.forEach(function (order) {
                    list.appendChild(createOrderCard(order));
                });
            }

            document.getElementById('loadMoreBtn').classList.toggle('hidden', currentPage >= totalPages);
        } catch (err) {
            if (!append) list.innerHTML = '';
            OrderManager.App.showToast(err.message, 'error');
        }
    }

    function createOrderCard(order) {
        var card = document.createElement('div');
        card.className = 'order-card';

        var itemsText = order.items.map(function (i) {
            return i.quantity + 'x ' + i.productName;
        }).join(', ');

        var nextLabel = OrderManager.App.nextStatusLabel(order.status);
        var btnHtml = order.status === 'Delivered'
            ? '<button class="btn btn-secondary" disabled>Entregue</button>'
            : '<button class="btn btn-primary btn-advance" data-id="' + order.id + '">' + nextLabel + '</button>';

        card.innerHTML =
            '<div class="order-card-header">' +
            '<span class="order-card-id">Pedido #' + order.id + '</span>' +
            '<span class="' + OrderManager.App.statusBadgeClass(order.status) + '">' + OrderManager.App.statusLabel(order.status) + '</span></div>' +
            '<div class="order-card-meta">' + escapeHtml(order.customerName) + ' · ' + escapeHtml(order.restaurantName) + ' · ' + OrderManager.App.formatDate(order.createdAt) + '</div>' +
            '<div class="order-card-items">' + escapeHtml(itemsText) + '</div>' +
            '<div class="order-card-footer"><span class="order-card-total">' + OrderManager.App.formatBRL(order.total) + '</span>' + btnHtml + '</div>';

        var btn = card.querySelector('.btn-advance');
        if (btn) {
            btn.addEventListener('click', function () { advanceOrder(order.id, btn); });
        }

        return card;
    }

    async function advanceOrder(id, btn) {
        btn.disabled = true;
        btn.textContent = 'Atualizando...';
        try {
            await OrderManager.Api.advanceStatus(id);
            OrderManager.App.showToast('Status do pedido #' + id + ' atualizado', 'success');
            currentPage = 1;
            loadSummary();
            loadOrders();
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = OrderManager.App.nextStatusLabel(btn.closest('.order-card').querySelector('.badge').textContent) || 'Avançar';
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
    OrderManager.Orders.init();
});
