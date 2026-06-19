using Library.Entities;

namespace Library.Contracts
{
    public interface ICustomerRepository
    {
        Task<List<Customer>> GetAllAsync();
        Task<Customer?> GetByIdAsync(int id);
        Task AddAsync(Customer customer);
        void Update(Customer customer);
        void Remove(Customer customer);
        Task SaveChangesAsync();
    }
}