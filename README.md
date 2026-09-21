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

## Screenshots

## Customer Website

### Home Page
<img width="1848" height="895" alt="image" src="https://github.com/user-attachments/assets/03efe4ef-b678-41c4-ac53-dc16d8138496" />

### Products Page
<img width="1686" height="897" alt="image" src="https://github.com/user-attachments/assets/45043e62-07fa-4484-b8f4-1092cd3006d0" />

### Shopping Cart
<img width="1768" height="867" alt="image" src="https://github.com/user-attachments/assets/d043df1e-b73d-47e3-8978-56fd4ace25b9" />

### Checkout
<img width="1725" height="856" alt="image" src="https://github.com/user-attachments/assets/dfe09f0c-e82c-4581-b66a-7016921f9488" />

### My Orders
<img width="1783" height="857" alt="image" src="https://github.com/user-attachments/assets/999bd106-b594-4ce9-9cce-a1c93290f6f9" />

## Admin Dashboard

### Admin Overview
<img width="1906" height="885" alt="image" src="https://github.com/user-attachments/assets/f61ee83f-9a65-46a4-9638-e3d2da066b77" />

### Products Management
<img width="1870" height="872" alt="image" src="https://github.com/user-attachments/assets/c9e3b3d1-398c-402b-af22-177f2ec57f38" />

### Categories Management
<img width="1892" height="886" alt="image" src="https://github.com/user-attachments/assets/373083c9-0d3a-4b76-976b-06b05ab7f2dc" />

### Orders Management
<img width="1895" height="897" alt="image" src="https://github.com/user-attachments/assets/a3e4db53-c739-4458-9d50-4943acdae3fe" />

### Inventory
<img width="1886" height="890" alt="image" src="https://github.com/user-attachments/assets/9dbb66ac-5b26-48cd-9298-b455efe3bb15" />

📍 Business Information

Sri Rudra

Munaga Anilkumar Traders

Rajahmundry, Andhra Pradesh, India
