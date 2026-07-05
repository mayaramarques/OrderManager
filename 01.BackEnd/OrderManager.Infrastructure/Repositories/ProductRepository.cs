using Library.Contracts;
using Library.Entities;
using Microsoft.EntityFrameworkCore;

namespace OrderManager.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly OrderManagerDbContext _context;

        public ProductRepository(OrderManagerDbContext context)
        {
            _context = context;
        }

        public async Task<List<Product>> GetAllAsync(int? restaurantId = null)
        {
            var query = _context.Products
                .Include(p => p.Restaurant)
                .AsQueryable();

            if (restaurantId.HasValue)
                query = query.Where(p => p.RestaurantId == restaurantId.Value);

            return await query.ToListAsync();
        }

        public async Task<Product?> GetByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Restaurant)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task AddAsync(Product product)
        {
            await _context.Products.AddAsync(product);
        }

        public void Update(Product product)
        {
            _context.Products.Update(product);
        }

        public void Remove(Product product)
        {
            _context.Products.Remove(product);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
