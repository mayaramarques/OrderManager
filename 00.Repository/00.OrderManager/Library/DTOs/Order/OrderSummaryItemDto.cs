namespace Library.DTOs.Order
{
    public class OrderSummaryItemDto
    {
        public string Key { get; set; } = string.Empty;
        public string? Label { get; set; }
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
    }
}
