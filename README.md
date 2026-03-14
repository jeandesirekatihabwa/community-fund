# 🌍 Community Fund

A high-performance, full-stack application for collective community contributions. Built with a modern tech stack focused on security, scalability, and an exceptional user experience.

![Premium UI](https://img.shields.io/badge/UI-Premium-indigo)
![Stripe](https://img.shields.io/badge/Payments-Stripe-blue)
![Prisma](https://img.shields.io/badge/ORM-Prisma-darkblue)
![React](https://img.shields.io/badge/Frontend-React-blue)

## ✨ Core Features

- **Professional UI/UX**: A clean, modern interface built with Tailwind CSS and premium design patterns.
- **Secure Payments**: Integrated with **Stripe** to support Credit Cards, Google Pay, and Apple Pay.
- **Real-Time Dashboard**: Contribution statistics update instantly across the community using **Socket.IO**.
- **Robust Persistence**: Data managed via **Prisma ORM** for type-safety and seamless database migrations (PostgreSQL/SQLite).
- **Authentication**: Secure JWT-based authentication with Google OAuth integration.
- **Deployment Ready**: Fully containerized using **Docker** and pre-configured for Cloud deployment.

## 🛠️ Technology Stack

- **Frontend**: React 19, Tailwind CSS, TanStack Query (React Query)
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL (Prisma ORM)
- **Ops**: Docker, Nginx (for optimized frontend serving)
- **Security**: JWT, Bcrypt, Rate Limiting, Stripe Webhooks

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- A Stripe account (for API keys)

### 2. Backend Setup
```bash
cd server
npm install
# Create .env from .env.example
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
# Create .env from .env.example
npm run dev
```

## 🏗️ Deployment Guide

This application is ready for production. Follow the steps below:

### 1. Database
Provision a PostgreSQL database (e.g., [Neon](https://neon.tech) or Supabase) and set your `DATABASE_URL`.

### 2. Environment Variables
Ensure the following variables are set in your cloud provider:

**Server**:
- `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `FRONTEND_URL`

**Client**:
- `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`

### 3. Docker Support
The app is shipping with multi-stage Dockerfiles for both Client (Nginx optimized) and Server (Node LTS).

```bash
# Production Build
docker-compose up --build
```

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for the community.*
