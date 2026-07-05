using Library.Entities.Enums;

namespace Library.DTOs.Order
{
    public class OrderReadDto
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public OrderStatusEnum Status { get; set; }
        public decimal Total { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<OrderItemReadDto> Items { get; set; } = new();
    }
}
