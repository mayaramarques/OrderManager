using Library.Contracts;
using Library.DTOs.Product;
using Library.DTOs.Restaurant;
using Library.Entities;

namespace OrderManager.Infrastructure.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly IRestaurantRepository _repository;

        public RestaurantService(IRestaurantRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<RestaurantReadDto>> GetAllAsync()
        {
            var restaurants = await _repository.GetAllAsync();
            return restaurants.Select(r => MapToReadDto(r)).ToList();
        }

        public async Task<RestaurantReadDto?> GetByIdAsync(int id, bool includeProducts = false)
        {
            var restaurant = includeProducts
                ? await _repository.GetByIdWithProductsAsync(id)
                : await _repository.GetByIdAsync(id);

            return restaurant == null ? null : MapToReadDto(restaurant, includeProducts);
        }

        public async Task<RestaurantReadDto> CreateAsync(RestaurantCreateDto dto)
        {
            var restaurant = new Restaurant { Name = dto.Name };

            await _repository.AddAsync(restaurant);
            await _repository.SaveChangesAsync();

            return MapToReadDto(restaurant);
        }

        public async Task<bool> UpdateAsync(int id, RestaurantCreateDto dto)
        {
            var restaurant = await _repository.GetByIdAsync(id);
            if (restaurant == null)
                return false;

            restaurant.Name = dto.Name;
            _repository.Update(restaurant);
            await _repository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var restaurant = await _repository.GetByIdAsync(id);
            if (restaurant == null)
                return false;

            _repository.Remove(restaurant);
            await _repository.SaveChangesAsync();
            return true;
        }

        private static RestaurantReadDto MapToReadDto(Restaurant restaurant, bool includeProducts = false)
        {
            var dto = new RestaurantReadDto
            {
                Id = restaurant.Id,
                Name = restaurant.Name
            };

            if (includeProducts && restaurant.Products != null)
            {
                dto.Products = restaurant.Products.Select(p => new ProductReadDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    RestaurantId = p.RestaurantId
                }).ToList();
            }

            return dto;
        }
    }
}
