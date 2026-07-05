using Library.Contracts;
using Library.DTOs.Product;
using Library.Entities;

namespace OrderManager.Infrastructure.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly IRestaurantRepository _restaurantRepository;

        public ProductService(IProductRepository productRepository, IRestaurantRepository restaurantRepository)
        {
            _productRepository = productRepository;
            _restaurantRepository = restaurantRepository;
        }

        public async Task<List<ProductReadDto>> GetAllAsync(int? restaurantId = null)
        {
            var products = await _productRepository.GetAllAsync(restaurantId);
            return products.Select(MapToReadDto).ToList();
        }

        public async Task<ProductReadDto?> GetByIdAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            return product == null ? null : MapToReadDto(product);
        }

        public async Task<(ProductReadDto? Result, string? Error)> CreateAsync(ProductCreateDto dto)
        {
            var restaurant = await _restaurantRepository.GetByIdAsync(dto.RestaurantId);
            if (restaurant == null)
                return (null, $"Restaurante {dto.RestaurantId} não encontrado.");

            var product = new Product
            {
                Name = dto.Name,
                Price = dto.Price,
                RestaurantId = dto.RestaurantId
            };

            await _productRepository.AddAsync(product);
            await _productRepository.SaveChangesAsync();

            product.Restaurant = restaurant;
            return (MapToReadDto(product), null);
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(int id, ProductCreateDto dto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return (false, null);

            var restaurant = await _restaurantRepository.GetByIdAsync(dto.RestaurantId);
            if (restaurant == null)
                return (false, $"Restaurante {dto.RestaurantId} não encontrado.");

            product.Name = dto.Name;
            product.Price = dto.Price;
            product.RestaurantId = dto.RestaurantId;

            _productRepository.Update(product);
            await _productRepository.SaveChangesAsync();
            return (true, null);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return false;

            _productRepository.Remove(product);
            await _productRepository.SaveChangesAsync();
            return true;
        }

        private static ProductReadDto MapToReadDto(Product product)
        {
            return new ProductReadDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                RestaurantId = product.RestaurantId,
                RestaurantName = product.Restaurant?.Name
            };
        }
    }
}
