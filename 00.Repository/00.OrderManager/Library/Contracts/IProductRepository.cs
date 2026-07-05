using Library.Entities;

namespace Library.Contracts
{
    public interface IProductRepository
    {
        Task<List<Product>> GetAllAsync(int? restaurantId = null);
        Task<Product?> GetByIdAsync(int id);
        Task AddAsync(Product product);
        void Update(Product product);
        void Remove(Product product);
        Task SaveChangesAsync();
    }
}
