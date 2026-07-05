using Library.DTOs.Product;

namespace Library.DTOs.Restaurant
{
    public class RestaurantReadDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<ProductReadDto>? Products { get; set; }
    }
}
