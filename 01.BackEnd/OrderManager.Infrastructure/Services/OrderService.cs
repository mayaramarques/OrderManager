using Library.Contracts;
using Library.DTOs.Order;
using Library.Entities;
using Library.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace OrderManager.Infrastructure.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IRestaurantRepository _restaurantRepository;
        private readonly IProductRepository _productRepository;

        public OrderService(
            IOrderRepository orderRepository,
            ICustomerRepository customerRepository,
            IRestaurantRepository restaurantRepository,
            IProductRepository productRepository)
        {
            _orderRepository = orderRepository;
            _customerRepository = customerRepository;
            _restaurantRepository = restaurantRepository;
            _productRepository = productRepository;
        }

        public async Task<PagedResultDto<OrderReadDto>> GetAllAsync(OrderFilterDto filter)
        {
            const int maxPageSize = 100;
            if (filter.Page < 1) filter.Page = 1;
            if (filter.PageSize < 1) filter.PageSize = 10;
            if (filter.PageSize > maxPageSize) filter.PageSize = maxPageSize;

            var query = _orderRepository.GetFilteredQuery(filter);
            var totalCount = await query.CountAsync();

            var orders = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResultDto<OrderReadDto>
            {
                Items = orders.Select(MapToReadDto).ToList(),
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public async Task<List<OrderSummaryItemDto>> GetSummaryAsync(string groupBy)
        {
            var filter = new OrderFilterDto { Page = 1, PageSize = int.MaxValue };
            var query = _orderRepository.GetFilteredQuery(filter);

            if (groupBy.Equals("restaurant", StringComparison.OrdinalIgnoreCase))
            {
                return await query
                    .GroupBy(o => new { o.RestaurantId, o.Restaurant!.Name })
                    .Select(g => new OrderSummaryItemDto
                    {
                        Key = g.Key.RestaurantId.ToString(),
                        Label = g.Key.Name,
                        Count = g.Count(),
                        TotalAmount = g.Sum(o => o.Total)
                    })
                    .ToListAsync();
            }

            // default: group by status
            return await query
                .GroupBy(o => o.Status)
                .Select(g => new OrderSummaryItemDto
                {
                    Key = g.Key.ToString(),
                    Label = g.Key.ToString(),
                    Count = g.Count(),
                    TotalAmount = g.Sum(o => o.Total)
                })
                .ToListAsync();
        }

        public async Task<(OrderReadDto? Result, string? Error, int StatusCode)> CreateAsync(OrderCreateDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
                return (null, "O pedido deve conter ao menos um item.", 400);

            var customer = await _customerRepository.GetByIdAsync(dto.CustomerId);
            if (customer == null)
                return (null, $"Cliente {dto.CustomerId} não encontrado.", 404);

            var restaurant = await _restaurantRepository.GetByIdAsync(dto.RestaurantId);
            if (restaurant == null)
                return (null, $"Restaurante {dto.RestaurantId} não encontrado.", 404);

            var order = new Order
            {
                CustomerId = dto.CustomerId,
                RestaurantId = dto.RestaurantId,
                Status = OrderStatusEnum.Received,
                CreatedAt = DateTime.UtcNow,
                Customer = customer,
                Restaurant = restaurant
            };

            decimal total = 0;

            foreach (var itemDto in dto.Items)
            {
                if (itemDto.Quantity <= 0)
                    return (null, "Quantidade deve ser maior que zero.", 400);

                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null)
                    return (null, $"Produto {itemDto.ProductId} não encontrado.", 404);

                if (product.RestaurantId != dto.RestaurantId)
                    return (null, $"Produto {itemDto.ProductId} não pertence ao restaurante {dto.RestaurantId}.", 400);

                var unitPrice = product.Price;
                total += itemDto.Quantity * unitPrice;

                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    Product = product,
                    Quantity = itemDto.Quantity,
                    UnitPrice = unitPrice
                });
            }

            order.Total = total;

            await _orderRepository.AddAsync(order);
            await _orderRepository.SaveChangesAsync();

            return (MapToReadDto(order), null, 201);
        }

        public async Task<OrderReadDto?> GetByIdAsync(int id)
        {
            var order = await _orderRepository.GetByIdWithDetailsAsync(id);
            return order == null ? null : MapToReadDto(order);
        }

        public async Task<(OrderReadDto? Result, string? Error, int StatusCode)> AdvanceStatusAsync(int id)
        {
            var order = await _orderRepository.GetByIdWithDetailsAsync(id);
            if (order == null)
                return (null, $"Pedido {id} não encontrado.", 404);

            var nextStatus = GetNextStatus(order.Status);
            if (nextStatus == null)
                return (null, "Pedido já foi entregue e não pode avançar de status.", 400);

            order.Status = nextStatus.Value;
            _orderRepository.Update(order);
            await _orderRepository.SaveChangesAsync();

            return (MapToReadDto(order), null, 200);
        }

        internal static OrderReadDto MapToReadDto(Order order)
        {
            return new OrderReadDto
            {
                Id = order.Id,
                CreatedAt = order.CreatedAt,
                Status = order.Status,
                Total = order.Total,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer?.Name ?? string.Empty,
                RestaurantId = order.RestaurantId,
                RestaurantName = order.Restaurant?.Name ?? string.Empty,
                Items = order.Items.Select(i => new OrderItemReadDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.Product?.Name ?? string.Empty,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Subtotal = i.Quantity * i.UnitPrice
                }).ToList()
            };
        }

        private static OrderStatusEnum? GetNextStatus(OrderStatusEnum current) => current switch
        {
            OrderStatusEnum.Received => OrderStatusEnum.Preparing,
            OrderStatusEnum.Preparing => OrderStatusEnum.OnTheWay,
            OrderStatusEnum.OnTheWay => OrderStatusEnum.Delivered,
            _ => null
        };
    }
}
