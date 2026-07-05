using Library.Contracts;
using Library.DTOs.Order;
using Library.Entities.Enums;
using Microsoft.AspNetCore.Mvc;

namespace OrderManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _service;

        public OrdersController(IOrderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] OrderStatusEnum? status,
            [FromQuery] int? customerId,
            [FromQuery] int? restaurantId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var filter = new OrderFilterDto
            {
                Status = status,
                CustomerId = customerId,
                RestaurantId = restaurantId,
                From = from,
                To = to,
                Page = page,
                PageSize = pageSize
            };

            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string groupBy = "status")
        {
            if (!groupBy.Equals("status", StringComparison.OrdinalIgnoreCase) &&
                !groupBy.Equals("restaurant", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "groupBy deve ser 'status' ou 'restaurant'." });
            }

            var summary = await _service.GetSummaryAsync(groupBy);
            return Ok(summary);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
        {
            var (result, error, statusCode) = await _service.CreateAsync(dto);
            if (result == null)
            {
                return statusCode switch
                {
                    400 => BadRequest(new { message = error }),
                    404 => NotFound(new { message = error }),
                    _ => BadRequest(new { message = error })
                };
            }

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _service.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { message = $"Pedido {id} não encontrado." });

            return Ok(order);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> AdvanceStatus(int id)
        {
            var (result, error, statusCode) = await _service.AdvanceStatusAsync(id);
            if (result == null)
            {
                return statusCode switch
                {
                    404 => NotFound(new { message = error }),
                    400 => BadRequest(new { message = error }),
                    _ => BadRequest(new { message = error })
                };
            }

            return Ok(result);
        }
    }
}
