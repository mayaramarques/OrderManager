var OrderManager = OrderManager || {};

OrderManager.Config = (function () {
    var isProduction = window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

    return {
        API_BASE_URL: isProduction
            ? 'https://YOUR-APP-SERVICE.azurewebsites.net'
            : 'http://localhost:5054'
    };
})();
