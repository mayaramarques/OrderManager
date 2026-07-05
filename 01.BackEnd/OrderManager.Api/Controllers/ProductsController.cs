using Library.Contracts;
using Library.DTOs.Product;
using Microsoft.AspNetCore.Mvc;

namespace OrderManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _service;

        public ProductsController(IProductService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? restaurantId)
        {
            var products = await _service.GetAllAsync(restaurantId);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _service.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = $"Produto {id} não encontrado." });

            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var (result, error) = await _service.CreateAsync(dto);
            if (result == null)
                return NotFound(new { message = error });

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductCreateDto dto)
        {
            var (success, error) = await _service.UpdateAsync(id, dto);
            if (!success)
            {
                if (error != null)
                    return NotFound(new { message = error });

                return NotFound(new { message = $"Produto {id} não encontrado." });
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Produto {id} não encontrado." });

            return NoContent();
        }
    }
}
