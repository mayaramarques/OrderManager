using Library.Entities;

namespace Library.Contracts
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdWithDetailsAsync(int id);
        Task AddAsync(Order order);
        void Update(Order order);
        Task SaveChangesAsync();
    }
}
