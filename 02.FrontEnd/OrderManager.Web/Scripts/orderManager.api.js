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

    return {
        getCustomers: getCustomers,
        getRestaurants: getRestaurants,
        getProducts: getProducts,
        getOrders: getOrders,
        getOrder: getOrder,
        createOrder: createOrder,
        advanceStatus: advanceStatus,
        getSummary: getSummary
    };
})();
