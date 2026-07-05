using Library.Contracts;
using Library.DTOs.Order;
using Library.Entities;
using Microsoft.EntityFrameworkCore;

namespace OrderManager.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly OrderManagerDbContext _context;

        public OrderRepository(OrderManagerDbContext context)
        {
            _context = context;
        }

        public IQueryable<Order> GetFilteredQuery(OrderFilterDto filter)
        {
            var query = _context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Customer)
                .Include(o => o.Restaurant)
                .AsQueryable();

            if (filter.Status.HasValue)
                query = query.Where(o => o.Status == filter.Status.Value);

            if (filter.CustomerId.HasValue)
                query = query.Where(o => o.CustomerId == filter.CustomerId.Value);

            if (filter.RestaurantId.HasValue)
                query = query.Where(o => o.RestaurantId == filter.RestaurantId.Value);

            if (filter.From.HasValue)
                query = query.Where(o => o.CreatedAt >= filter.From.Value);

            if (filter.To.HasValue)
                query = query.Where(o => o.CreatedAt <= filter.To.Value);

            return query.OrderByDescending(o => o.CreatedAt);
        }

        public async Task<Order?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Include(o => o.Customer)
                .Include(o => o.Restaurant)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task AddAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
        }

        public void Update(Order order)
        {
            _context.Orders.Update(order);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
