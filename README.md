# Mavine Households - Full-Stack E-Commerce Platform

Mavine Households is a modern e-commerce storefront and operations back-office for home essentials, kitchenware, appliances, bedding, carpets, storage, travel bags, bicycles & furniture.

---

## 1. Prerequisites

- **Python 3.11+ / 3.12+ / 3.13**
- **Node.js 18+ / 20+**
- **PostgreSQL** running locally (default port: `5432`)

---

## 2. PostgreSQL Setup

Ensure you have a PostgreSQL database and user created:

```sql
CREATE DATABASE "MVE";
CREATE USER nickson_nyagaka WITH PASSWORD 'JoanJuma@254';
GRANT ALL PRIVILEGES ON DATABASE "MVE" TO nickson_nyagaka;
```

*(Optional)* You can customize credentials via environment variables:
- `DB_NAME` (default: `MVE`)
- `DB_USER` (default: `nickson_nyagaka`)
- `DB_PASSWORD` (default: `JoanJuma@254`)
- `DB_HOST` (default: `127.0.0.1`)
- `DB_PORT` (default: `5432`)
- `DB_SSLMODE` (default: `disable`)

---

## 3. Backend Setup (Django)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Navigate to `Config` and apply database migrations:
   ```bash
   cd Config
   python manage.py migrate
   ```

4. Start the Django development server:
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```

Backend API will be live at: `http://127.0.0.1:8000/api/docs`

---

## 4. Frontend Setup (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

Storefront will be available at: `http://localhost:3000`

---

## 5. Bulk Product Import (CSV)

To bulk-import products with category attribute schema validation:

```bash
cd backend\Config
python manage.py import_products --csv path/to/products.csv
```

The CSV must contain headers:
`name, category, price, stock, image_urls, attributes_json, is_heavy_item, description`

---

## 6. Environment Variables Summary

### Backend (`backend/Config/Config/settings.py`)
| Variable | Default | Purpose |
|---|---|---|
| `DB_NAME` | `MVE` | PostgreSQL database name |
| `DB_USER` | `nickson_nyagaka` | PostgreSQL user |
| `DB_PASSWORD` | `JoanJuma@254` | PostgreSQL password |
| `DB_HOST` | `127.0.0.1` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_SSLMODE` | `disable` | SSL mode |
| `REDIS_URL` | `None` | Optional Redis URL for cart cache (falls back to local memory cache) |
| `PAYMENT_GATEWAY_MODE` | `mock` | `mock` for local development or `daraja` for live M-Pesa |

### Frontend (`frontend`)
| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_URL` | `http://127.0.0.1:8000` | Target Django backend server |
