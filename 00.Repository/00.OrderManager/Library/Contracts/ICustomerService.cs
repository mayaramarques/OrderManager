using Library.DTOs.Customer;

namespace Library.Contracts
{
    public interface ICustomerService
    {
        Task<List<CustomerReadDto>> GetAllAsync();
        Task<CustomerReadDto?> GetByIdAsync(int id);
        Task<CustomerReadDto> CreateAsync(CustomerCreateDto dto);
        Task<bool> UpdateAsync(int id, CustomerCreateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}