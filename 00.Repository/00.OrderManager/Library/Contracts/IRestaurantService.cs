using Library.DTOs.Restaurant;

namespace Library.Contracts
{
    public interface IRestaurantService
    {
        Task<List<RestaurantReadDto>> GetAllAsync();
        Task<RestaurantReadDto?> GetByIdAsync(int id, bool includeProducts = false);
        Task<RestaurantReadDto> CreateAsync(RestaurantCreateDto dto);
        Task<bool> UpdateAsync(int id, RestaurantCreateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
