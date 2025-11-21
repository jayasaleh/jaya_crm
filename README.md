# CRM PT. Smart - Backend API

Backend API untuk sistem CRM (Customer Relationship Management) PT. Smart. Dibangun dengan Express.js, TypeScript, Prisma, dan PostgreSQL.

## 📋 Table of Contents

- [Fitur Backend](#-fitur-backend)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Variables](#-environment-variables)
- [Running the Server](#-running-the-server)
- [API Documentation](#-api-documentation)
- [Database Migration](#-database-migration)
- [Seeder](#-seeder)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## Fitur Backend

### 1. **Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Refresh token mechanism
- ✅ Role-based access control (Sales & Manager)
- ✅ Sales hanya bisa akses data sendiri
- ✅ Manager bisa akses semua data

### 2. **Lead Management**
- ✅ CRUD Leads
- ✅ Filter by status dan source
- ✅ Search dengan pagination
- ✅ Convert Lead to Customer

### 3. **Product Management**
- ✅ CRUD Products
- ✅ HPP, Margin, dan Selling Price calculation
- ✅ Soft delete (deactivate)

### 4. **Deal Pipeline**
- ✅ Create Deal dari Lead atau Customer
- ✅ Multiple products per deal
- ✅ Price negotiation
- ✅ Approval workflow
- ✅ Submit Deal untuk approval
- ✅ Activate Deal menjadi Service

### 5. **Customer Management**
- ✅ Get active customers
- ✅ Multiple services per customer
- ✅ Search dengan pagination

### 6. **Reporting**
- ✅ Sales report (JSON & Excel)
- ✅ Dashboard statistics

---

##  Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 5.x
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Logging:** Winston
- **Excel Export:** ExcelJS
- **Deployment:** Vercel

---

##  Prerequisites

Sebelum memulai, pastikan Anda sudah menginstall:

- **Node.js** (v18 atau lebih tinggi)
- **npm** (v9 atau lebih tinggi)
- **PostgreSQL** (v14 atau lebih tinggi)

---

## 🚀 Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env`

```bash


touch .env
```

Edit file `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jaya_crm?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRE="24h"
JWT_REFRESH_EXPIRE="7d"

# Server
PORT=3000

# Frontend URL (untuk CORS)
FRONTEND_URL="http://localhost:5173"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Setup Database


## 🗄 Database Setup

### 1. Buat Database PostgreSQL

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE jaya_crm;

# Exit
\q
```

### 2. Update DATABASE_URL

Edit file `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/jaya_crm?schema=public"
```

### 3. Run Migration

#### Development (dengan migration baru)

```bash
npm run migrate:dev
```

#### Production (deploy migration yang sudah ada)

```bash
npm run migrate:deploy
```

### 4. Seed Database (Opsional)

```bash
npm run seed
```

Ini akan membuat:
- 5 Products
- 2 Managers
- 5 Sales
- 10 Leads (2 per sales)

**Default Password:** `password123` (untuk semua user)

---



## ▶️ Running the Server

### Development Mode

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000` dengan auto-reload menggunakan nodemon.

### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

Akan membuka browser di `http://localhost:5555` untuk melihat dan mengedit data database.

---

## API Documentation

### Base URL

```
Development: http://localhost:3000
Production:  https://jaya-crm-be.vercel.app
```

### Authentication

Semua endpoint (kecuali `/api/auth/*`) memerlukan JWT token di header:

```
Authorization: Bearer <token>
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

### API Endpoints

#### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |

**Request Body (Login):**
```json
{
  "email": "ahmad.sales@smart.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

#### 👥 Users (Manager Only)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/users` | Get all users | ✅ | MANAGER |
| GET | `/api/users/:id` | Get user by ID | ✅ | MANAGER |
| POST | `/api/users` | Create user | ✅ | MANAGER |

---

#### 📋 Leads

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/api/leads` | Create lead | ✅ | SALES, MANAGER |
| GET | `/api/leads` | Get all leads | ✅ | SALES, MANAGER |
| GET | `/api/leads/:id` | Get lead by ID | ✅ | SALES, MANAGER |
| PATCH | `/api/leads/:id` | Update lead | ✅ | SALES, MANAGER |
| DELETE | `/api/leads/:id` | Delete lead | ✅ | SALES, MANAGER |
| POST | `/api/leads/:id/convert` | Convert lead to customer | ✅ | MANAGER |

**Query Params untuk GET /api/leads:**
- `?status=NEW|CONTACTED|QUALIFIED|CONVERTED|LOST` - Filter by status
- `?source=WEBSITE|WALKIN|PARTNER|REFERRAL|OTHER` - Filter by source
- `?search=keyword` - Search by name/contact/email/address
- `?page=1` - Page number (default: 1)
- `?limit=10` - Items per page (default: 10)

**Request Body (Create Lead):**
```json
{
  "name": "PT. Contoh",
  "contact": "081234567890",
  "email": "info@contoh.com",
  "address": "Jl. Contoh No. 123",
  "source": "WEBSITE",
  "status": "NEW"
}
```

**Response (Get All Leads):**
```json
{
  "success": true,
  "message": "Leads fetched successfully",
  "data": {
    "leads": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

####  Products

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/products` | Get all products | ✅ | SALES, MANAGER |
| GET | `/api/products/:id` | Get product by ID | ✅ | SALES, MANAGER |
| POST | `/api/products` | Create product | ✅ | MANAGER |
| PATCH | `/api/products/:id` | Update product | ✅ | MANAGER |
| DELETE | `/api/products/:id` | Deactivate product | ✅ | MANAGER |
| DELETE | `/api/products/:id/delete` | Delete product permanently | ✅ | MANAGER |

**Request Body (Create Product):**
```json
{
  "name": "Paket 50 Mbps",
  "description": "Paket internet 50 Mbps",
  "hpp": 200000,
  "marginSales": 25,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Paket 50 Mbps",
    "hpp": 200000,
    "marginSales": 25,
    "sellingPrice": 250000,
    "isActive": true
  }
}
```

---

####  Deals

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/api/deals` | Create deal | ✅ | SALES, MANAGER |
| GET | `/api/deals` | Get all deals | ✅ | SALES, MANAGER |
| GET | `/api/deals/:id` | Get deal by ID | ✅ | SALES, MANAGER |
| PATCH | `/api/deals/:id/submit` | Submit deal for approval | ✅ | SALES, MANAGER |
| POST | `/api/deals/:id/activate` | Activate deal services | ✅ | SALES, MANAGER |
| PATCH | `/api/deals/:id/approve` | Approve deal | ✅ | MANAGER |
| PATCH | `/api/deals/:id/reject` | Reject deal | ✅ | MANAGER |

**Query Params untuk GET /api/deals:**
- `?status=DRAFT|WAITING_APPROVAL|APPROVED|REJECTED` - Filter by status
- `?page=1` - Page number (default: 1)
- `?limit=10` - Items per page (default: 10)

**Request Body (Create Deal):**
```json
{
  "leadId": 1,
  "title": "Deal Paket Internet",
  "items": [
    {
      "productId": 1,
      "agreedPrice": 500000,
      "quantity": 1
    }
  ]
}
```

**Atau dari Customer:**
```json
{
  "customerId": 1,
  "title": "Deal Paket Internet",
  "items": [
    {
      "productId": 1,
      "agreedPrice": 500000,
      "quantity": 1
    }
  ]
}
```

**Request Body (Approve/Reject):**
```json
{
  "notes": "Approved - harga sesuai"
}
```

---

####  Customers

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/customers` | Get all active customers | ✅ | SALES, MANAGER |
| GET | `/api/customers/:id` | Get customer by ID | ✅ | SALES, MANAGER |

**Query Params untuk GET /api/customers:**
- `?search=keyword` - Search by name/customerCode/email/contact
- `?page=1` - Page number (default: 1)
- `?limit=10` - Items per page (default: 10)

---

#### 📊 Reports

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/reports/sales` | Get sales report (JSON) | ✅ | SALES, MANAGER |
| GET | `/api/reports/sales.xlsx` | Download sales report (Excel) | ✅ | SALES, MANAGER |

**Query Params:**
- `?startDate=2024-01-01` - Start date (required)
- `?endDate=2024-01-31` - End date (required)

**Example:**
```
GET /api/reports/sales?startDate=2024-01-01&endDate=2024-01-31
```

---

####  Dashboard

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/dashboard/stats` | Get dashboard statistics | ✅ | SALES, MANAGER |

**Response:**
```json
{
  "success": true,
  "message": "Dashboard stats fetched successfully",
  "data": {
    "leads": {
      "total": 50,
      "byStatus": {
        "NEW": 10,
        "CONTACTED": 15,
        "QUALIFIED": 20,
        "CONVERTED": 5
      }
    },
    "deals": {
      "total": 30,
      "byStatus": {
        "DRAFT": 5,
        "WAITING_APPROVAL": 10,
        "APPROVED": 12,
        "REJECTED": 3
      }
    },
    "customers": {
      "total": 25
    },
    "revenue": {
      "total": 50000000
    },
    "pendingApprovals": 10
  }
}
```

---

## Database Migration

### Development

```bash
# Create new migration
npm run migrate:dev

# Akan prompt untuk nama migration
# Contoh: "add_user_table"
```

### Production

```bash
# Deploy migrations (tidak membuat migration baru)
npm run migrate:deploy
```

### Check Migration Status

```bash
npm run migrate:status
```

### Reset Database (⚠️ Hapus semua data!)

```bash
npm run migrate:reset
```

### Combined Commands

```bash
# Reset + migrate + seed
npm run db:reset

# Deploy migration + seed
npm run db:setup
```

---

## 🌱 Seeder

### Menjalankan Seeder

```bash
npm run seed
```

### Data yang Di-seed

#### Products (5 items)
- Paket 50 Mbps (HPP: 200k, Margin: 25%, Harga: 250k)
- Paket 100 Mbps (HPP: 350k, Margin: 30%, Harga: 455k)
- Paket 200 Mbps (HPP: 600k, Margin: 28%, Harga: 768k)
- Paket 500 Mbps (HPP: 1.2M, Margin: 25%, Harga: 1.5M)
- Paket 1 Gbps (HPP: 2M, Margin: 30%, Harga: 2.6M)

#### Users
- **2 Managers:**
  - Budi Santoso (budi.manager@smart.com)
  - Siti Nurhaliza (siti.manager@smart.com)

- **5 Sales:**
  - Ahmad Fauzi (ahmad.sales@smart.com)
  - Dewi Lestari (dewi.sales@smart.com)
  - Rizki Pratama (rizki.sales@smart.com)
  - Sari Indah (sari.sales@smart.com)
  - Bambang Wijaya (bambang.sales@smart.com)

#### Leads (10 items)
- 2 leads untuk masing-masing sales

**Default Password:** `password123` (untuk semua user)

---

## 🚀 Deployment

### Deploy ke Vercel

#### 1. Setup Vercel Project

1. Login ke [Vercel Dashboard](https://vercel.com)
2. Import project dari GitHub
3. Configure:
   - **Root Directory:** `be`
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### 2. Environment Variables

Set di Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
PORT=3000
FRONTEND_URL=https://your-frontend-url.vercel.app
```

#### 3. Database Migration

Setelah deploy, jalankan migration:

```bash
# Via Vercel CLI
vercel env pull .env.production
npm run migrate:deploy
```

Atau via Vercel Dashboard → Deployments → Run Command

#### 4. Seed Database (Opsional)

```bash
npm run seed
```

### Vercel Configuration

File `vercel.json` sudah dikonfigurasi untuk:
- Build dengan `@vercel/node`
- Include Prisma schema
- Route semua request ke `src/index.ts`

---

## 📁 Project Structure

```
be/
├── prisma/                    # Prisma schema & migrations
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Database seeder
├── src/
│   ├── config/                # Configuration files
│   │   ├── logger.ts          # Winston logger config
│   │   └── prisma.ts          # Prisma client instance
│   ├── controllers/           # Route controllers
│   │   ├── authController.ts
│   │   ├── customerController.ts
│   │   ├── dashboardController.ts
│   │   ├── dealController.ts
│   │   ├── leadController.ts
│   │   ├── productController.ts
│   │   ├── reportController.ts
│   │   └── userController.ts
│   ├── services/              # Business logic
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── dashboardService.ts
│   │   ├── dealService.ts
│   │   ├── leadService.ts
│   │   ├── productService.ts
│   │   ├── reportService.ts
│   │   └── userService.ts
│   ├── routes/                # API routes
│   │   ├── authRoute.ts
│   │   ├── customerRoute.ts
│   │   ├── dashboardRoute.ts
│   │   ├── dealRoute.ts
│   │   ├── index.ts           # Main router
│   │   ├── leadRoute.ts
│   │   ├── productRoute.ts
│   │   ├── reportRoute.ts
│   │   └── userRoute.ts
│   ├── middleware/            # Express middleware
│   │   ├── asyncHandler.ts    # Async error handler
│   │   ├── authMiddleware.ts  # JWT authentication
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── role.ts            # Role-based access control
│   │   └── validate.ts        # Request validation
│   ├── schema/                # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── deal.schema.ts
│   │   ├── lead.schema.ts
│   │   └── product.schema.ts
│   ├── utils/                 # Utilities
│   │   ├── apiError.ts        # Custom error class
│   │   ├── apiResponse.ts     # API response formatter
│   │   └── jwt.ts             # JWT helper functions
│   └── index.ts               # Entry point
├── dist/                      # Compiled JavaScript (generated)
├── logs/                      # Log files
├── .env                       # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json
└── vercel.json                # Vercel deployment config


##  Alur Aplikasi

### Alur Lead → Customer

```
1. Sales membuat Lead
   └─ Status: NEW

2. Sales menghubungi Lead
   └─ Update status: CONTACTED

3. Sales menilai Lead qualified
   └─ Update status: QUALIFIED

4. Sales membuat Deal dari Lead QUALIFIED
   └─ Auto-create Customer
   └─ Update Lead status: CONVERTED
   └─ Deal status: DRAFT atau WAITING_APPROVAL

5. Sales submit Deal (jika DRAFT)
   └─ Deal status: WAITING_APPROVAL

6. Manager approve/reject Deal
   └─ Deal status: APPROVED atau REJECTED

7. Sales/Manager activate Deal
   └─ Create Service untuk setiap DealItem
   └─ Service status: ACTIVE
   └─ Customer menjadi aktif
```

---

## Author

Developed by Jaya Saleh

---

