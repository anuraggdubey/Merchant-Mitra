# Merchant Mitra 🏪

**Merchant Mitra** is a digital business management platform built for small and medium merchants in India. It helps shop owners manage payments, track credit, maintain customer ledgers, and get AI-powered insights — all from their phone or browser.

---

Live at: https://merchant-mitra-9kcikjmru-anurag-dubeys-projects-bd482947.vercel.app/

## What is Merchant Mitra?

Most small merchants in India still rely on paper notebooks to track who owes them money, how much they collected today, and which customer hasn't paid yet. Merchant Mitra replaces that notebook with a fast, smart, and mobile-friendly digital platform — designed specifically for the way Indian merchants work.

---

## Features

### 💰 Payment Collection
Accept and record UPI payments from customers. Generate a payment collection request and track whether it has been received. Every payment is logged with the customer's name, amount, and timestamp.

### 📒 Khata Book (Customer Ledger)
Maintain a personal digital khata (account book) for every customer. Each khata tracks all credit given and payments received, with a running balance that updates in real time.

- **Daily Khata** — for daily supplies like milk, bread, newspaper
- **Weekly Khata** — for weekly deliveries or services
- **Monthly Khata** — for regular credit customers with month-end settlement

Each customer has their own profile with name, phone number, tags (Regular, VIP, Wholesale, etc.), credit limit, and avatar. From any customer's khata, you can:

- Add a **credit entry** (goods given on credit)
- Add a **payment entry** (cash or UPI received)
- Add a **note** (non-monetary memo)
- View entries grouped by **day, week, or month**
- Send a **WhatsApp reminder** with the outstanding balance pre-filled
- **Export** the full ledger as a CSV file

### 📝 Udhaar Manager
A consolidated view of all outstanding udhaar (credit) across all customers. Shows who owes the most, filters by balance, and links directly to their khata.

### 📊 Transaction History
Full log of every payment and transaction with search, filters, and export. Includes detailed transaction modals with status, amount, date, and customer info.

### 📈 Dashboard
At-a-glance summary of the business:
- Today's collection
- This week's revenue
- This month's revenue
- Recent transactions
- Quick action buttons for all key flows

### 🤖 AI Insights
AI-powered widget that analyzes transaction patterns and gives actionable business insights — like peak collection hours, top customers by volume, and payment trends.

### 👤 Merchant Profile
Merchants set up their shop profile with name, category, UPI ID, address, and shop photo. Profile data is used across payment requests and WhatsApp reminders.

### 🌐 Multi-language Support
The interface supports multiple languages so merchants from different regions can use it comfortably in their native language.

---

## How it Works

1. **Register** with your email and set up your shop profile
2. **Add customers** to your Khata Book, each with their own ledger
3. **Record entries** whenever you give goods on credit or receive a payment
4. **Monitor** your dashboard to see daily/weekly/monthly income
5. **Send reminders** via WhatsApp to customers with outstanding balances
6. **Export** any customer's ledger as a CSV for record keeping

All data is stored securely in Firebase Firestore, tied to the merchant's account. No one else can access your data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Backend | Node.js + Express |
| SMS / Webhook | Custom SMS parsing service |

---

## Project Structure

```
Merchant Mitra/
├── Merchant Mitra/     # React frontend
│   └── src/
│       ├── pages/      # All page components
│       ├── components/ # Reusable UI components
│       ├── services/   # Firebase service layers
│       └── context/    # Auth & Language context
└── backend/            # Node.js Express backend
    ├── server.js       # Main server + payment routes
    └── firebaseAdmin.js
```
