namespace Library.DTOs.Product
{
    public class ProductCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int RestaurantId { get; set; }
    }
}
