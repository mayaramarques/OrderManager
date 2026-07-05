var OrderManager = OrderManager || {};

OrderManager.App = (function () {
    var toastContainer = null;

    function initToasts() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }

    function formatBRL(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function showToast(message, type) {
        initToasts();
        var toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' ' + type : '');
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(function () { toast.remove(); }, 4000);
    }

    function statusLabel(status) {
        var labels = {
            Received: 'Recebido',
            Preparing: 'Em preparo',
            OnTheWay: 'A caminho',
            Delivered: 'Entregue'
        };
        return labels[status] || status;
    }

    function statusBadgeClass(status) {
        var map = {
            Received: 'badge-received',
            Preparing: 'badge-preparing',
            OnTheWay: 'badge-ontheway',
            Delivered: 'badge-delivered'
        };
        return 'badge ' + (map[status] || 'badge-received');
    }

    function nextStatusLabel(status) {
        var map = {
            Received: 'Iniciar preparo',
            Preparing: 'Saiu para entrega',
            OnTheWay: 'Marcar entregue'
        };
        return map[status] || null;
    }

    function avatarColor(name) {
        var colors = ['#EA1D2C', '#f97316', '#2563eb', '#16a34a', '#9333ea', '#0891b2'];
        var hash = 0;
        for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    function initials(name) {
        return name.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
    }

    function debounce(fn, delay) {
        var timer;
        return function () {
            var args = arguments;
            var ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
        };
    }

    return {
        formatBRL: formatBRL,
        formatDate: formatDate,
        showToast: showToast,
        statusLabel: statusLabel,
        statusBadgeClass: statusBadgeClass,
        nextStatusLabel: nextStatusLabel,
        avatarColor: avatarColor,
        initials: initials,
        debounce: debounce
    };
})();
