using Library.DTOs.Order;

namespace Library.Contracts
{
    public interface IOrderService
    {
        Task<PagedResultDto<OrderReadDto>> GetAllAsync(OrderFilterDto filter);
        Task<List<OrderSummaryItemDto>> GetSummaryAsync(string groupBy);
        Task<(OrderReadDto? Result, string? Error, int StatusCode)> CreateAsync(OrderCreateDto dto);
        Task<OrderReadDto?> GetByIdAsync(int id);
        Task<(OrderReadDto? Result, string? Error, int StatusCode)> AdvanceStatusAsync(int id);
    }
}
