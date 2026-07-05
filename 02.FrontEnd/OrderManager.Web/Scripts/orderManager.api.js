var OrderManager = OrderManager || {};

OrderManager.Api = (function () {
    var baseUrl = OrderManager.Config.API_BASE_URL;

    async function request(path, options) {
        var response = await fetch(baseUrl + path, options);
        if (!response.ok) {
            var body = {};
            try { body = await response.json(); } catch (e) { /* ignore */ }
            var err = new Error(body.message || 'Erro na requisição (' + response.status + ')');
            err.status = response.status;
            throw err;
        }
        if (response.status === 204) return null;
        return response.json();
    }

    function getCustomers() {
        return request('/api/customers');
    }

    function getRestaurants() {
        return request('/api/restaurants');
    }

    function getProducts(restaurantId) {
        var qs = restaurantId ? '?restaurantId=' + restaurantId : '';
        return request('/api/products' + qs);
    }

    function getOrders(params) {
        var query = new URLSearchParams();
        if (params) {
            Object.keys(params).forEach(function (key) {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    query.set(key, params[key]);
                }
            });
        }
        var qs = query.toString();
        return request('/api/orders' + (qs ? '?' + qs : ''));
    }

    function getOrder(id) {
        return request('/api/orders/' + id);
    }

    function createOrder(data) {
        return request('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    function advanceStatus(id) {
        return request('/api/orders/' + id + '/status', { method: 'PATCH' });
    }

    function getSummary(groupBy) {
        return request('/api/orders/summary?groupBy=' + (groupBy || 'status'));
    }

    function createCustomer(data) {
        return request('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    // ViaCEP — API pública brasileira de consulta de CEP
    async function lookupCep(cep) {
        var digits = cep.replace(/\D/g, '');
        if (digits.length !== 8) {
            throw new Error('CEP deve ter 8 dígitos.');
        }
        var response = await fetch('https://viacep.com.br/ws/' + digits + '/json/');
        if (!response.ok) {
            throw new Error('Não foi possível consultar o CEP.');
        }
        var data = await response.json();
        if (data.erro) {
            throw new Error('CEP não encontrado.');
        }
        return data;
    }

    return {
        getCustomers: getCustomers,
        getRestaurants: getRestaurants,
        getProducts: getProducts,
        getOrders: getOrders,
        getOrder: getOrder,
        createOrder: createOrder,
        createCustomer: createCustomer,
        lookupCep: lookupCep,
        advanceStatus: advanceStatus,
        getSummary: getSummary
    };
})();
