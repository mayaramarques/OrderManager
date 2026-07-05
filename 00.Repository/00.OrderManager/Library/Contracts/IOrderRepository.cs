using Library.Entities;
using Library.DTOs.Order;

namespace Library.Contracts
{
    public interface IOrderRepository
    {
        IQueryable<Order> GetFilteredQuery(OrderFilterDto filter);
        Task<Order?> GetByIdWithDetailsAsync(int id);
        Task AddAsync(Order order);
        void Update(Order order);
        Task SaveChangesAsync();
    }
}
