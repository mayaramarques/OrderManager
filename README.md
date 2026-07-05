# OrderManager

Gerenciador de pedidos estilo iFood — API REST em .NET 10 com front-end vanilla JavaScript.

## Stack

- **Back-end:** C# / .NET 10, ASP.NET Core Web API, Entity Framework Core, SQL Server (LocalDB em dev)
- **Front-end:** JavaScript vanilla (HTML/CSS)
- **Documentação:** Swagger (ambiente Development)

## Arquitetura

```
PROJ.OrderManager
├── 00.Repository/00.OrderManager/Library     (entidades, contratos, DTOs)
├── 01.BackEnd
│   ├── OrderManager.Api                        (controllers, Program.cs)
│   └── OrderManager.Infrastructure             (DbContext, repositories, services)
└── 02.FrontEnd/OrderManager.Web              (HTML, CSS, JS)
```

**Fluxo:** `Controller → IService → IRepository → DbContext → SQL Server`

## Modelo de dados

```
Customer ──1:N── Order ──1:N── OrderItem ──N:1── Product
                    └──N:1── Restaurant ──1:N── Product
```

| Entidade   | Campos principais                          |
|------------|--------------------------------------------|
| Customer   | Name, Phone, Address                       |
| Restaurant | Name                                       |
| Product    | Name, Price, RestaurantId                  |
| Order      | CreatedAt, Status, Total, CustomerId, RestaurantId |
| OrderItem  | Quantity, UnitPrice, OrderId, ProductId    |

**Status do pedido:** `Received` → `Preparing` → `OnTheWay` → `Delivered`

## Como rodar

### Pré-requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- SQL Server LocalDB (incluído no Visual Studio) ou SQL Server Express

### Banco de dados

```bash
cd PROJ.OrderManager/01.BackEnd/OrderManager.Api
dotnet ef database update --project ../OrderManager.Infrastructure
```

### API

```bash
cd PROJ.OrderManager/01.BackEnd/OrderManager.Api
dotnet run
```

- Swagger: `https://localhost:7xxx/swagger` (porta no `launchSettings.json`)
- Em Development, o seed popula restaurantes, produtos, clientes e um pedido de exemplo automaticamente.

### Front-end

Abra `02.FrontEnd/OrderManager.Web/Web/index.html` com **Live Server** (VS Code) na porta 5500.

Configure a URL da API em `Scripts/orderManager.config.js`.

## Endpoints

### Customers — `/api/customers`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/customers` | Listar todos |
| GET | `/api/customers/{id}` | Buscar por id |
| POST | `/api/customers` | Criar |
| PUT | `/api/customers/{id}` | Atualizar |
| DELETE | `/api/customers/{id}` | Excluir |

### Restaurants — `/api/restaurants`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/restaurants` | Listar todos |
| GET | `/api/restaurants/{id}?includeProducts=true` | Detalhe (opcional: produtos) |
| POST | `/api/restaurants` | Criar |
| PUT | `/api/restaurants/{id}` | Atualizar |
| DELETE | `/api/restaurants/{id}` | Excluir |

### Products — `/api/products`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products?restaurantId={id}` | Listar (filtro opcional) |
| GET | `/api/products/{id}` | Buscar por id |
| POST | `/api/products` | Criar |
| PUT | `/api/products/{id}` | Atualizar |
| DELETE | `/api/products/{id}` | Excluir |

### Orders — `/api/orders`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/orders` | Listar com filtros e paginação |
| GET | `/api/orders/summary?groupBy=status\|restaurant` | Resumo agrupado |
| GET | `/api/orders/{id}` | Detalhe completo |
| POST | `/api/orders` | Criar pedido com itens |
| PATCH | `/api/orders/{id}/status` | Avançar status |

**Query params do GET `/api/orders`:** `status`, `customerId`, `restaurantId`, `from`, `to`, `page`, `pageSize`

## Roteiro de testes (Swagger)

1. **GET** `/api/restaurants` — verificar seed (Burger House, Pizza Napoli, Sushi Zen)
2. **GET** `/api/products?restaurantId=1` — listar cardápio do restaurante
3. **GET** `/api/customers` — listar clientes
4. **POST** `/api/orders` — criar pedido:
   ```json
   {
     "customerId": 1,
     "restaurantId": 1,
     "items": [
       { "productId": 1, "quantity": 2 }
     ]
   }
   ```
5. Verificar `total` e `unitPrice` no response
6. **PATCH** `/api/orders/{id}/status` — avançar até `Delivered`
7. **GET** `/api/orders?status=Preparing` — filtrar por status
8. **GET** `/api/orders/summary?groupBy=status` — resumo por status
9. **GET** `/api/orders/summary?groupBy=restaurant` — resumo por restaurante

## Deploy (quando houver assinatura Azure)

| Etapa | Ação |
|-------|------|
| Azure SQL | Criar banco, configurar connection string em App Service |
| Migrations | `dotnet ef database update` apontando para Azure SQL |
| App Service | Publicar API .NET 10, variável `ConnectionStrings__DefaultConnection` |
| Front estático | Static Web Apps ou Blob; ajustar `API_BASE_URL` no config JS |
| Function | Timer diário para resumo de pedidos (ver `OrderManager.Functions`) |
