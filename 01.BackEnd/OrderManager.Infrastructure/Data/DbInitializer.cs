using Library.Entities;
using Library.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace OrderManager.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(OrderManagerDbContext context)
        {
            if (!await context.Restaurants.AnyAsync())
            {
            var restaurants = new[]
            {
                new Restaurant { Name = "Burger House" },
                new Restaurant { Name = "Pizza Napoli" },
                new Restaurant { Name = "Sushi Zen" }
            };
            await context.Restaurants.AddRangeAsync(restaurants);
            await context.SaveChangesAsync();

            var products = new[]
            {
                new Product { Name = "X-Burger", Price = 28.90m, RestaurantId = restaurants[0].Id },
                new Product { Name = "X-Salada", Price = 32.50m, RestaurantId = restaurants[0].Id },
                new Product { Name = "Batata Frita", Price = 15.00m, RestaurantId = restaurants[0].Id },
                new Product { Name = "Refrigerante Lata", Price = 6.90m, RestaurantId = restaurants[0].Id },
                new Product { Name = "Suco Natural", Price = 9.90m, RestaurantId = restaurants[0].Id },
                new Product { Name = "Pizza Margherita", Price = 45.00m, RestaurantId = restaurants[1].Id },
                new Product { Name = "Pizza Calabresa", Price = 48.00m, RestaurantId = restaurants[1].Id },
                new Product { Name = "Pizza Portuguesa", Price = 52.00m, RestaurantId = restaurants[1].Id },
                new Product { Name = "Refrigerante 2L", Price = 12.00m, RestaurantId = restaurants[1].Id },
                new Product { Name = "Água Mineral", Price = 5.00m, RestaurantId = restaurants[1].Id },
                new Product { Name = "Combo Sashimi", Price = 65.00m, RestaurantId = restaurants[2].Id },
                new Product { Name = "Hot Roll", Price = 38.00m, RestaurantId = restaurants[2].Id },
                new Product { Name = "Temaki Salmão", Price = 22.00m, RestaurantId = restaurants[2].Id },
                new Product { Name = "Chá Verde", Price = 8.00m, RestaurantId = restaurants[2].Id },
                new Product { Name = "Suco de Uva", Price = 10.00m, RestaurantId = restaurants[2].Id }
            };
            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();

            var customers = new[]
            {
                new Customer { Name = "Ana Silva", Phone = "11999990001", Address = "Rua das Flores, 100" },
                new Customer { Name = "Bruno Costa", Phone = "11999990002", Address = "Av. Paulista, 500" },
                new Customer { Name = "Carla Mendes", Phone = "11999990003", Address = "Rua Augusta, 200" }
            };
            await context.Customers.AddRangeAsync(customers);
            await context.SaveChangesAsync();

            var order = new Order
            {
                CustomerId = customers[0].Id,
                RestaurantId = restaurants[0].Id,
                Status = OrderStatusEnum.Preparing,
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                Total = 43.90m,
                Items = new List<OrderItem>
                {
                    new OrderItem { ProductId = products[0].Id, Quantity = 1, UnitPrice = 28.90m },
                    new OrderItem { ProductId = products[2].Id, Quantity = 1, UnitPrice = 15.00m }
                }
            };
            await context.Orders.AddAsync(order);
            await context.SaveChangesAsync();
            }

            await EnsureDrinksAsync(context);
        }

    // Garante bebidas em todos os restaurantes (útil se o banco já foi seedado antes)
    private static async Task EnsureDrinksAsync(OrderManagerDbContext context)
    {
        var drinkKeywords = new[] { "refrigerante", "suco", "água", "agua", "chá", "cha", "bebida" };
        var restaurants = await context.Restaurants.ToListAsync();
        var added = false;

        foreach (var restaurant in restaurants)
        {
            var products = await context.Products
                .Where(p => p.RestaurantId == restaurant.Id)
                .ToListAsync();

            var hasDrink = products.Exists(p =>
                drinkKeywords.Any(k => p.Name.Contains(k, StringComparison.OrdinalIgnoreCase)));

            if (hasDrink)
                continue;

            foreach (var drink in GetDefaultDrinks(restaurant.Name))
            {
                await context.Products.AddAsync(new Product
                {
                    Name = drink.Name,
                    Price = drink.Price,
                    RestaurantId = restaurant.Id
                });
                added = true;
            }
        }

        if (added)
            await context.SaveChangesAsync();
    }

    private static List<(string Name, decimal Price)> GetDefaultDrinks(string restaurantName) =>
        restaurantName switch
        {
            "Burger House" => [("Refrigerante Lata", 6.90m), ("Suco Natural", 9.90m)],
            "Pizza Napoli" => [("Refrigerante 2L", 12.00m), ("Água Mineral", 5.00m)],
            "Sushi Zen" => [("Chá Verde", 8.00m), ("Suco de Uva", 10.00m)],
            _ => [("Refrigerante Lata", 6.90m), ("Suco Natural", 9.90m)]
        };
    }
}
