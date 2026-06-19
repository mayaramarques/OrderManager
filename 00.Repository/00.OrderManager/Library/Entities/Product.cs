namespace Library.Entities
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }

        // Produto pertence a um restaurante (1:N)
        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }
    }
}