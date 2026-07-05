var OrderManager = OrderManager || {};

OrderManager.Cart = (function () {
    var STORAGE_KEY = 'orderManager_cart';
    var listeners = [];

    function load() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || { restaurantId: null, items: [] };
        } catch (e) {
            return { restaurantId: null, items: [] };
        }
    }

    function save(cart) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        listeners.forEach(function (fn) { fn(cart); });
    }

    function getItems() { return load().items; }
    function getRestaurantId() { return load().restaurantId; }

    function getTotal() {
        return getItems().reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);
    }

    function getCount() {
        return getItems().reduce(function (sum, item) { return sum + item.quantity; }, 0);
    }

    function addItem(product, restaurantId) {
        var cart = load();
        if (cart.restaurantId && cart.restaurantId !== restaurantId) {
            cart = { restaurantId: restaurantId, items: [] };
        }
        cart.restaurantId = restaurantId;
        var existing = cart.items.find(function (i) { return i.productId === product.id; });
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                restaurantId: restaurantId
            });
        }
        save(cart);
    }

    function clear() {
        save({ restaurantId: null, items: [] });
    }

    function onChange(fn) {
        listeners.push(fn);
    }

    function toOrderItems() {
        return getItems().map(function (i) {
            return { productId: i.productId, quantity: i.quantity };
        });
    }

    return {
        getItems: getItems,
        getRestaurantId: getRestaurantId,
        getTotal: getTotal,
        getCount: getCount,
        addItem: addItem,
        clear: clear,
        onChange: onChange,
        toOrderItems: toOrderItems
    };
})();
