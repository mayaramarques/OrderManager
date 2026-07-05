using Library.Contracts;
using Library.DTOs.Restaurant;
using Microsoft.AspNetCore.Mvc;

namespace OrderManager.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RestaurantsController : ControllerBase
    {
        private readonly IRestaurantService _service;

        public RestaurantsController(IRestaurantService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var restaurants = await _service.GetAllAsync();
            return Ok(restaurants);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] bool includeProducts = false)
        {
            var restaurant = await _service.GetByIdAsync(id, includeProducts);
            if (restaurant == null)
                return NotFound(new { message = $"Restaurante {id} não encontrado." });

            return Ok(restaurant);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] RestaurantCreateDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] RestaurantCreateDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (!updated)
                return NotFound(new { message = $"Restaurante {id} não encontrado." });

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Restaurante {id} não encontrado." });

            return NoContent();
        }
    }
}
