namespace Library.DTOs.Customer
{
    public class CustomerCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
    }
}