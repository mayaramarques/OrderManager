using Library.Entities;

namespace Library.Contracts
{
    public interface IRestaurantRepository
    {
        Task<List<Restaurant>> GetAllAsync();
        Task<Restaurant?> GetByIdAsync(int id);
        Task<Restaurant?> GetByIdWithProductsAsync(int id);
        Task AddAsync(Restaurant restaurant);
        void Update(Restaurant restaurant);
        void Remove(Restaurant restaurant);
        Task SaveChangesAsync();
    }
}
