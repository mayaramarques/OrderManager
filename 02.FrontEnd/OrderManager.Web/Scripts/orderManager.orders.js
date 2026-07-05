var OrderManager = OrderManager || {};

OrderManager.Orders = (function () {
    var currentPage = 1;
    var totalPages = 1;
    var customers = [];
    var restaurants = [];
    var filters = { status: '', restaurantId: '', search: '' };

    function init() {
        bindEvents();
        toggleAddressMode();
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
        document.getElementById('filterSearch').addEventListener('input', OrderManager.App.debounce(function (e) {
            filters.search = e.target.value.trim().toLowerCase();
            currentPage = 1;
            loadOrders();
        }, 300));
        document.getElementById('loadMoreBtn').addEventListener('click', function () {
            currentPage++;
            loadOrders(true);
        });

        var panelToggle = document.getElementById('customerPanelToggle');
        var panelBody = document.getElementById('customerPanelBody');
        panelToggle.addEventListener('click', function () {
            var expanded = panelToggle.getAttribute('aria-expanded') === 'true';
            panelToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            panelBody.classList.toggle('hidden', expanded);
        });

        document.getElementById('customerForm').addEventListener('submit', submitCustomer);

        document.querySelectorAll('input[name="addressMode"]').forEach(function (radio) {
            radio.addEventListener('change', toggleAddressMode);
        });
        document.getElementById('customerCepSearch').addEventListener('click', searchCep);
        document.getElementById('customerCep').addEventListener('blur', function () {
            var cep = document.getElementById('customerCep').value;
            if (cep.replace(/\D/g, '').length === 8) searchCep();
        });
        document.getElementById('customerCep').addEventListener('input', formatCepInput);
    }

    function toggleAddressMode() {
        var mode = document.querySelector('input[name="addressMode"]:checked').value;
        document.getElementById('addressByCep').classList.toggle('hidden', mode !== 'cep');
        document.getElementById('addressManual').classList.toggle('hidden', mode !== 'manual');
    }

    function formatCepInput(e) {
        var digits = e.target.value.replace(/\D/g, '').substring(0, 8);
        if (digits.length > 5) {
            e.target.value = digits.substring(0, 5) + '-' + digits.substring(5);
        } else {
            e.target.value = digits;
        }
    }

    async function searchCep() {
        var cepInput = document.getElementById('customerCep');
        var btn = document.getElementById('customerCepSearch');
        var cep = cepInput.value.trim();
        if (!cep) {
            OrderManager.App.showToast('Informe o CEP', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Buscando...';

        try {
            var data = await OrderManager.Api.lookupCep(cep);
            document.getElementById('customerStreet').value = data.logradouro || '';
            document.getElementById('customerNeighborhood').value = data.bairro || '';
            document.getElementById('customerCity').value = data.localidade || '';
            document.getElementById('customerState').value = data.uf || '';
            if (data.complemento) {
                document.getElementById('customerComplement').value = data.complemento;
            }
            document.getElementById('customerNumber').focus();
            OrderManager.App.showToast('Endereço encontrado', 'success');
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Buscar';
        }
    }

    function buildAddressFromCep() {
        var street = document.getElementById('customerStreet').value.trim();
        var number = document.getElementById('customerNumber').value.trim();
        var complement = document.getElementById('customerComplement').value.trim();
        var neighborhood = document.getElementById('customerNeighborhood').value.trim();
        var city = document.getElementById('customerCity').value.trim();
        var state = document.getElementById('customerState').value.trim();
        var cep = document.getElementById('customerCep').value.trim();

        if (!street && !number) return '';

        var parts = [];
        var line1 = street;
        if (number) line1 += (line1 ? ', ' : '') + number;
        if (complement) line1 += ' - ' + complement;
        if (line1) parts.push(line1);
        if (neighborhood) parts.push(neighborhood);
        if (city || state) parts.push(city + (city && state ? '/' : '') + state);
        if (cep) parts.push('CEP ' + cep);
        return parts.join(' - ');
    }

    async function submitCustomer(e) {
        e.preventDefault();
        var btn = document.getElementById('customerSubmit');
        var name = document.getElementById('customerName').value.trim();
        var phone = document.getElementById('customerPhone').value.trim();
        var mode = document.querySelector('input[name="addressMode"]:checked').value;
        var address = '';

        if (mode === 'cep') {
            if (!document.getElementById('customerStreet').value.trim()) {
                OrderManager.App.showToast('Busque um CEP válido antes de cadastrar', 'error');
                return;
            }
            if (!document.getElementById('customerNumber').value.trim()) {
                OrderManager.App.showToast('Informe o número do endereço', 'error');
                return;
            }
            address = buildAddressFromCep();
        } else {
            address = document.getElementById('customerAddress').value.trim();
        }

        if (!name) {
            OrderManager.App.showToast('Informe o nome do cliente', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Cadastrando...';

        try {
            var created = await OrderManager.Api.createCustomer({
                name: name,
                phone: phone || null,
                address: address || null
            });
            customers.push(created);
            document.getElementById('customerForm').reset();
            toggleAddressMode();
            document.querySelector('input[name="addressMode"][value="cep"]').checked = true;
            OrderManager.App.showToast('Cliente "' + created.name + '" cadastrado com sucesso', 'success');
        } catch (err) {
            OrderManager.App.showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Cadastrar cliente';
        }
    }

    function matchesSearch(order, term) {
        if (!term) return true;
        var idMatch = String(order.id).indexOf(term) !== -1;
        var customerMatch = (order.customerName || '').toLowerCase().indexOf(term) !== -1;
        var restaurantMatch = (order.restaurantName || '').toLowerCase().indexOf(term) !== -1;
        var itemsMatch = order.items.some(function (i) {
            return (i.productName || '').toLowerCase().indexOf(term) !== -1;
        });
        var notesMatch = (order.notes || '').toLowerCase().indexOf(term) !== -1;
        return idMatch || customerMatch || restaurantMatch || itemsMatch || notesMatch;
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

            var today = new Date().toISOString().split('T')[0];
            var orders = await OrderManager.Api.getOrders({ from: today + 'T00:00:00', pageSize: 100 });
            var todayCount = orders.totalCount;
            var todayRevenue = orders.items.reduce(function (s, o) { return s + o.total; }, 0);

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

        var params = {
            page: filters.search ? 1 : currentPage,
            pageSize: filters.search ? 100 : 10
        };
        if (filters.status) params.status = filters.status;
        if (filters.restaurantId) params.restaurantId = filters.restaurantId;

        try {
            var result = await OrderManager.Api.getOrders(params);
            var items = result.items;

            if (filters.search) {
                items = items.filter(function (o) { return matchesSearch(o, filters.search); });
                totalPages = 1;
            } else {
                totalPages = result.totalPages;
            }

            if (!append) list.innerHTML = '';

            if (items.length === 0 && currentPage === 1) {
                list.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:2rem">Nenhum pedido encontrado.</p>';
            } else {
                items.forEach(function (order) {
                    list.appendChild(createOrderCard(order));
                });
            }

            document.getElementById('loadMoreBtn').classList.toggle('hidden', filters.search || currentPage >= totalPages);
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

        var notesHtml = order.notes
            ? '<div class="order-card-notes"><strong>Obs.:</strong> ' + escapeHtml(order.notes) + '</div>'
            : '';

        var status = OrderManager.App.normalizeStatus(order.status);
        var nextLabel = OrderManager.App.nextStatusLabel(status);
        var btnHtml = status === 'Delivered'
            ? '<button class="btn btn-secondary" disabled>Entregue</button>'
            : '<button class="btn btn-primary btn-advance" data-id="' + order.id + '">' + (nextLabel || 'Avançar') + '</button>';

        card.innerHTML =
            '<div class="order-card-header">' +
            '<span class="order-card-id">Pedido #' + order.id + '</span>' +
            '<span class="' + OrderManager.App.statusBadgeClass(status) + '">' + OrderManager.App.statusLabel(status) + '</span></div>' +
            '<div class="order-card-meta">' + escapeHtml(order.customerName) + ' · ' + escapeHtml(order.restaurantName) + ' · ' + OrderManager.App.formatDate(order.createdAt) + '</div>' +
            notesHtml +
            '<div class="order-card-items">' + escapeHtml(itemsText) + '</div>' +
            '<div class="order-card-footer"><span class="order-card-total">' + OrderManager.App.formatBRL(order.total) + '</span>' + btnHtml + '</div>';

        var btn = card.querySelector('.btn-advance');
        if (btn) {
            btn.addEventListener('click', function () { advanceOrder(order.id, status, btn); });
        }

        return card;
    }

    async function advanceOrder(id, status, btn) {
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
            btn.disabled = OrderManager.App.normalizeStatus(status) === 'Delivered';
            btn.textContent = OrderManager.App.nextStatusLabel(status) || 'Avançar';
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
