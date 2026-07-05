using Microsoft.Azure.Functions.Worker;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace OrderManager.Functions
{
    public class DailyOrderSummaryFunction
    {
        private readonly ILogger _logger;

        public DailyOrderSummaryFunction(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<DailyOrderSummaryFunction>();
        }

        // Executa diariamente às 6h UTC
        [Function("DailyOrderSummary")]
        public async Task Run([TimerTrigger("0 0 6 * * *")] TimerInfo timerInfo)
        {
            var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogError("ConnectionStrings__DefaultConnection não configurada.");
                return;
            }

            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            const string summarySql = """
                SELECT COUNT(*) AS TotalOrders, ISNULL(SUM(Total), 0) AS TotalRevenue
                FROM Orders
                WHERE CreatedAt >= @From AND CreatedAt < @To
                """;

            await using var cmd = new SqlCommand(summarySql, connection);
            cmd.Parameters.AddWithValue("@From", today);
            cmd.Parameters.AddWithValue("@To", tomorrow);

            await using var reader = await cmd.ExecuteReaderAsync();
            var totalOrders = 0;
            var totalRevenue = 0m;
            if (await reader.ReadAsync())
            {
                totalOrders = reader.GetInt32(0);
                totalRevenue = reader.GetDecimal(1);
            }
            await reader.CloseAsync();

            _logger.LogInformation(
                "Resumo diário {Date}: {TotalOrders} pedidos, faturamento {Revenue:C}",
                today.ToString("yyyy-MM-dd"),
                totalOrders,
                totalRevenue);

            const string statusSql = """
                SELECT Status, COUNT(*) AS Cnt
                FROM Orders
                WHERE CreatedAt >= @From AND CreatedAt < @To
                GROUP BY Status
                """;

            await using var statusCmd = new SqlCommand(statusSql, connection);
            statusCmd.Parameters.AddWithValue("@From", today);
            statusCmd.Parameters.AddWithValue("@To", tomorrow);

            await using var statusReader = await statusCmd.ExecuteReaderAsync();
            while (await statusReader.ReadAsync())
            {
                _logger.LogInformation("  {Status}: {Count}", statusReader.GetInt32(0), statusReader.GetInt32(1));
            }
        }
    }
}
