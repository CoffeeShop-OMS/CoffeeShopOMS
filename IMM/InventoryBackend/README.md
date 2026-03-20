# IMM Backend — Inventory Management Module
### Coffee Tea Connection POS System

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then fill in your Firebase Admin SDK credentials:
- Go to **Firebase Console → Project Settings → Service Accounts**
- Click **"Generate new private key"** → download the JSON
- Copy `project_id`, `client_email`, `private_key` into your `.env`

### 3. Run the server
```bash
npm run dev       # development (auto-restart)
npm start         # production
```

---

## 🔐 Authentication Flow

Firebase handles login **client-side**. Your frontend calls `signInWithEmailAndPassword()`, gets an **ID token**, then sends it to this backend.

```
Frontend Login Flow:
  1. User submits email + password
  2. Firebase Auth returns ID token
  3. Frontend stores token (memory or httpOnly cookie)
  4. Every API request: Authorization: Bearer <ID_TOKEN>
  5. This backend verifies the token on every request
```

### Roles & Permissions
| Action                  | Staff | Manager | Admin |
|-------------------------|-------|---------|-------|
| View inventory          | ✅    | ✅      | ✅    |
| Adjust stock            | ✅    | ✅      | ✅    |
| Create / Edit items     | ❌    | ✅      | ✅    |
| Delete items            | ❌    | ❌      | ✅    |
| View audit logs         | ❌    | ✅      | ✅    |
| Create user accounts    | ❌    | ❌      | ✅    |
| Deactivate users        | ❌    | ❌      | ✅    |

---

## 📡 API Reference

### Base URL: `http://localhost:5000`

All protected routes require:
```
Authorization: Bearer <Firebase_ID_Token>
```

---

### Auth Endpoints

| Method | Endpoint                    | Auth   | Description              |
|--------|-----------------------------|--------|--------------------------|
| GET    | `/health`                   | None   | Health check             |
| POST   | `/api/auth/register`        | Admin  | Create a new user        |
| GET    | `/api/auth/me`              | Any    | Get own profile          |
| PATCH  | `/api/auth/me`              | Any    | Update own profile/pass  |
| GET    | `/api/auth/users`           | Admin  | List all users           |
| POST   | `/api/auth/deactivate/:uid` | Admin  | Deactivate a user        |

#### POST `/api/auth/register`
```json
{
  "email": "barista@cafe.com",
  "password": "Secure123",
  "name": "Juan Dela Cruz",
  "role": "staff"
}
```

---

### Inventory Endpoints

| Method | Endpoint                           | Auth           | Description           |
|--------|------------------------------------|----------------|-----------------------|
| GET    | `/api/inventory`                   | Any            | List all items        |
| POST   | `/api/inventory`                   | Manager/Admin  | Create item           |
| GET    | `/api/inventory/:id`               | Any            | Get single item       |
| PATCH  | `/api/inventory/:id`               | Manager/Admin  | Update item           |
| DELETE | `/api/inventory/:id`               | Admin          | Soft-delete item      |
| POST   | `/api/inventory/:id/adjust`        | Any            | Adjust stock quantity |
| GET    | `/api/inventory/reports/low-stock` | Any            | Low stock report      |
| GET    | `/api/inventory/:id/logs`          | Manager/Admin  | Item audit logs       |

#### GET `/api/inventory` Query Params
| Param      | Example         | Description                        |
|------------|-----------------|------------------------------------|
| category   | `?category=milk`| Filter by category                 |
| lowStock   | `?lowStock=true`| Only low-stock items               |
| search     | `?search=oat`   | Search name, SKU, supplier         |
| limit      | `?limit=20`     | Items per page (max 100)           |
| startAfter | `?startAfter=ID`| Cursor for next page               |

#### POST `/api/inventory` — Create Item
```json
{
  "name": "Oat Milk",
  "sku": "MILK001",
  "category": "milk",
  "quantity": 50,
  "unit": "liters",
  "lowStockThreshold": 10,
  "costPrice": 120.00,
  "supplier": "Oatly PH"
}
```

#### POST `/api/inventory/:id/adjust` — Adjust Stock
```json
{
  "adjustment": -5,
  "reason": "Used for morning orders"
}
```
> Use positive numbers to add stock, negative to deduct.

---

## 📁 Project Structure
```
imm-backend/
├── app.js                    # Entry point, Express setup
├── config/
│   └── firebase.js           # Firebase Admin SDK init
├── middleware/
│   ├── authMiddleware.js      # Token verification + RBAC
│   └── validators.js          # Input validation rules
├── controllers/
│   ├── authController.js      # User management logic
│   └── inventoryController.js # Inventory CRUD logic
├── routes/
│   ├── authRoutes.js          # Auth route definitions
│   └── inventoryRoutes.js     # Inventory route definitions
├── firestore.rules            # Deploy to Firebase Console
├── .env.example               # Environment template
└── package.json
```

---

## 🔒 Security Features
- **Firebase ID Token verification** on every protected request
- **Custom claims** (role) embedded in tokens — no DB lookup to check role
- **Helmet** — secure HTTP headers
- **CORS** — whitelist allowed frontend origins
- **Rate limiting** — 100 req/15min global, 20 req/15min on auth routes
- **Input validation** — express-validator on all POST/PATCH routes
- **Payload size limit** — 10kb max body
- **Soft deletes** — data is never permanently lost
- **Firestore rules** — double-layer security even if backend is bypassed
- **Audit logs** — every change is tracked with who/when/what

---

## 🗂️ Firestore Collections

| Collection       | Purpose                              |
|------------------|--------------------------------------|
| `users`          | User profiles + roles                |
| `inventory`      | Inventory items                      |
| `inventoryLogs`  | Immutable audit trail                |

---

## 📦 Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```
