# community-fund
A full-stack React and Node.js web application that allows users to seamlessly make community contributions using Stripe, Google Pay, and Apple Pay. Features robust authentication and a personal contribution dashboard.

## Prerequisites

- [Node.js](https://nodejs.org/) installed.
- A [Stripe](https://stripe.com/) account.

## Setup

1.  **Configure Backend**:
    - Navigate to `server` directory.
    - Rename `.env.example` (or create `.env`) and add your Stripe keys:
      ```
      STRIPE_SECRET_KEY=sk_test_...
      STRIPE_PUBLISHABLE_KEY=pk_test_...
      PORT=3001
      STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
      ```
    - Install dependencies: `cd server && npm install`

2.  **Configure Frontend**:
    - The frontend connects to `http://localhost:3001`. Ensure backend is running.
    - Install dependencies: `cd client && npm install`

## Running the App

1.  **Start Backend**:
    ```bash
    cd server
    node index.js
    ```

2.  **Start Frontend**:
    ```bash
    cd client
    npm run dev
    ```

3.  Open `http://localhost:5173` in your browser.

## Features

- **Professional UI**: Clean, modern interface using Tailwind CSS.
- **Stripe Integration**: Secure payment processing with support for Google Pay and secure webhooks.
- **Scalable Real-Time Updates**: Redis-backed Socket.IO integration for live dashboard updates.
- **Backend Database**: SQLite database to track contribution status.
