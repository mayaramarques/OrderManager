using Library.Contracts;
using Library.Entities;
using Microsoft.EntityFrameworkCore;

namespace OrderManager.Infrastructure.Repositories
{
    public class RestaurantRepository : IRestaurantRepository
    {
        private readonly OrderManagerDbContext _context;

        public RestaurantRepository(OrderManagerDbContext context)
        {
            _context = context;
        }

        public async Task<List<Restaurant>> GetAllAsync()
        {
            return await _context.Restaurants.ToListAsync();
        }

        public async Task<Restaurant?> GetByIdAsync(int id)
        {
            return await _context.Restaurants.FindAsync(id);
        }

        public async Task<Restaurant?> GetByIdWithProductsAsync(int id)
        {
            return await _context.Restaurants
                .Include(r => r.Products)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task AddAsync(Restaurant restaurant)
        {
            await _context.Restaurants.AddAsync(restaurant);
        }

        public void Update(Restaurant restaurant)
        {
            _context.Restaurants.Update(restaurant);
        }

        public void Remove(Restaurant restaurant)
        {
            _context.Restaurants.Remove(restaurant);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
