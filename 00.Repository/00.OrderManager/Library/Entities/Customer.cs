namespace Library.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }

        // Um cliente tem vários pedidos (1:N)
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}