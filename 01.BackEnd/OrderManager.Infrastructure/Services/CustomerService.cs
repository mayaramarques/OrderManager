using Library.Contracts;
using Library.DTOs.Customer;
using Library.Entities;

namespace OrderManager.Infrastructure.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _repository;

        public CustomerService(ICustomerRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<CustomerReadDto>> GetAllAsync()
        {
            var customers = await _repository.GetAllAsync();
            return customers.Select(MapToReadDto).ToList();
        }

        public async Task<CustomerReadDto?> GetByIdAsync(int id)
        {
            var customer = await _repository.GetByIdAsync(id);
            return customer == null ? null : MapToReadDto(customer);
        }

        public async Task<CustomerReadDto> CreateAsync(CustomerCreateDto dto)
        {
            var customer = new Customer
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Address = dto.Address
            };

            await _repository.AddAsync(customer);
            await _repository.SaveChangesAsync();

            return MapToReadDto(customer);
        }

        public async Task<bool> UpdateAsync(int id, CustomerCreateDto dto)
        {
            var customer = await _repository.GetByIdAsync(id);
            if (customer == null)
                return false;

            customer.Name = dto.Name;
            customer.Phone = dto.Phone;
            customer.Address = dto.Address;

            _repository.Update(customer);
            await _repository.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var customer = await _repository.GetByIdAsync(id);
            if (customer == null)
                return false;

            _repository.Remove(customer);
            await _repository.SaveChangesAsync();
            return true;
        }

        // Mapeamento entidade -> DTO de leitura
        private static CustomerReadDto MapToReadDto(Customer customer)
        {
            return new CustomerReadDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Phone = customer.Phone,
                Address = customer.Address
            };
        }
    }
}