using Library.Entities.Enums;

namespace Library.DTOs.Order
{
    public class OrderFilterDto
    {
        public OrderStatusEnum? Status { get; set; }
        public int? CustomerId { get; set; }
        public int? RestaurantId { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
