using Library.Entities.Enums;

namespace Library.Entities
{
    public class Order
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public OrderStatusEnum Status { get; set; }
        public decimal Total { get; set; }

        // Pedido pertence a um cliente e a um restaurante
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }

        // Itens do pedido
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}