using Library.Contracts;
using Library.DTOs.Order;
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
