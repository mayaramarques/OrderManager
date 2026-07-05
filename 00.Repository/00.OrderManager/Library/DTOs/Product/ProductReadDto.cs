namespace Library.DTOs.Product
{
    public class ProductReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int RestaurantId { get; set; }
        public string? RestaurantName { get; set; }
    }
}
