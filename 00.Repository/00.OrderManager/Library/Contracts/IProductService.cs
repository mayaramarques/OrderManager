using Library.DTOs.Product;

namespace Library.Contracts
{
    public interface IProductService
    {
        Task<List<ProductReadDto>> GetAllAsync(int? restaurantId = null);
        Task<ProductReadDto?> GetByIdAsync(int id);
        Task<(ProductReadDto? Result, string? Error)> CreateAsync(ProductCreateDto dto);
        Task<(bool Success, string? Error)> UpdateAsync(int id, ProductCreateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
