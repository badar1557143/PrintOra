# Printora mock checkout

Run the local backend with Node.js:

```bash
PORT=4173 node mock-server.js
```

Then open `http://127.0.0.1:4173/index.html`. Add an item to the cart and choose **Proceed to Mock Checkout**.

The `POST /api/checkout` endpoint validates customer details and cart items, creates an in-memory order, and returns a simulated payment status. Card and wallet methods return `authorized_mock`; cash on delivery returns `pending_cash_on_delivery`. Orders can be retrieved during the server session with `GET /api/orders/:id`.

Open `http://127.0.0.1:4173/admin.html` to use the admin dashboard. It lists orders, shows summary statistics, filters by status or customer details, updates order status, and deletes demo orders. The admin API includes `GET /api/orders`, `PATCH /api/orders/:id` with a status such as `processing`, `shipped`, `completed`, or `cancelled`, and `DELETE /api/orders/:id`.

Authentication is available at `account.html`. The seeded demo customer is `customer@example.com` with password `customer123`; the seeded demo admin is `admin@printora.local` with password `admin123`. Customers can view their own history through `GET /api/orders/mine`; only admins can list, update, or delete all orders. Sessions use an HTTP-only cookie for this local mock.

This integration is for local demonstration only. It does not process real payments, persist data across server restarts, provide production-grade password hashing or CSRF protection, or accept real card credentials.
