namespace Library.DTOs.Order
{
    public class OrderCreateDto
    {
        public int CustomerId { get; set; }
        public int RestaurantId { get; set; }
        public string? Notes { get; set; }
        public List<OrderItemCreateDto> Items { get; set; } = new();
    }
}
