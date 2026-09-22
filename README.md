# Sri Rudra Online Store

A full-stack e-commerce website developed for **Munaga Anilkumar Traders**, Rajahmundry, Andhra Pradesh, India.

Sri Rudra allows customers to browse grocery products, select product variants, add products to cart, place Cash on Delivery orders, and track their orders.

The project also includes a separate admin dashboard for managing products, categories, inventory, and customer orders.

---

## 🌐 Live Applications

| Application | URL |
|---|---|
| 🛍️ Customer Website | https://sri-rudra-online-store.vercel.app |
| 🛠️ Admin Dashboard | https://sri-rudra-admin-phi.vercel.app |
| ⚙️ Backend API | https://sri-rudra-api.onrender.com |

---

## ✨ Features

### Customer Website

- Browse products
- Browse products by category
- Search products
- View product details
- Select different product weights and variants
- View product images
- Add products to cart
- Update cart quantities
- Customer registration and login
- Google authentication
- Forgot password
- Cash on Delivery (COD)
- Place orders
- View order history
- Track order status
- Responsive design for desktop and mobile devices

### Admin Dashboard

- Secure admin login
- Admin authorization
- Dashboard overview
- Product management
- Category management
- Product variant management
- Stock management
- Product image uploads
- Order management
- Update order status
- Manage delivery charges
- Inventory monitoring

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Admin Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Java 21
- Spring Boot
- REST APIs
- Maven

### Database

- Firebase Firestore

### Authentication

- Firebase Authentication
- Email/Password Authentication
- Google Authentication
- Firebase Custom Claims

### Image Storage

- Cloudinary

### Deployment

- Vercel – Customer Website
- Vercel – Admin Dashboard
- Render – Backend
- Firebase – Authentication and Database

---

## 📁 Project Structure

```text
Sri-Rudra-Online-Store/
│
├── frontend/
│   └── Customer Website
│
├── admin-frontend/
│   └── Admin Dashboard
│
├── backend/
│   └── Spring Boot REST API
│
└── README.md


## Application Architecture


                  ┌─────────────────────┐
                  │   Customer Website  │
                  │       Vercel        │
                  └──────────┬──────────┘
                             │
                             │ HTTPS
                             ▼
                  ┌─────────────────────┐
                  │   Spring Boot API   │
                  │       Render        │
                  └───────┬───────┬─────┘
                          │       │
                 ┌────────┘       └─────────┐
                 ▼                          ▼
        ┌─────────────────┐        ┌─────────────────┐
        │ Firebase        │        │   Cloudinary    │
        │ Authentication  │        │ Product Images  │
        │ + Firestore     │        └─────────────────┘
        └─────────────────┘

                  ┌─────────────────────┐
                  │   Admin Dashboard   │
                  │       Vercel        │
                  └──────────┬──────────┘
                             │
                             │ HTTPS
                             ▼
                    Spring Boot API


🔐 Security
Firebase Authentication is used for customer authentication.
Firebase Custom Claims are used for admin authorization.
Admin APIs require authorized admin access.
Backend CORS is restricted to approved frontend domains.
Firebase service-account credentials are not stored in the repository.
Environment files and secrets are excluded from GitHub.

📍 Business Information

Sri Rudra

Munaga Anilkumar Traders

Rajahmundry, Andhra Pradesh, India
