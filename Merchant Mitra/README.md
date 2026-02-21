# Merchant Mitra 🤝

A smart digital ledger and business assistant for Indian merchants.

## 🚀 Features
-   **Digital Ledger**: Track Sales, Expenses, and Udhaar (Credit).
-   **Voice Entry**: Add transactions by speaking (e.g., "500 rs from Rahul").
-   **Receipt Scanner**: Auto-fill transactions by taking a photo of a bill.
-   **AI Insights**: Get business tips from your transaction patterns.
-   **UPI QR Code**: Collect payments easily.

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Keys (Important!)
This project uses **Google Gemini AI** for the Receipt Scanner and Insights.
1.  Get a free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Create a file named `.env` in the root folder.
3.  Add your key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_starting_with_AIza...
    ```
4.  **Restart the server** after adding the key.

### 3. Run the App
```bash
npm run dev
```

## 📖 How to Use

### 🎙️ Voice Entry
1.  Click **"Add Transaction"**.
2.  Tap the **"Voice Entry"** button.
3.  Say something like: *"Received 200 rupees from Amit for Sugar"*.
4.  The form will auto-fill. Click Save.

### 📸 Receipt Scanner
1.  Click **"Add Transaction"**.
2.  Click **"Scan Receipt"**.
3.  Upload an image of a bill or handwritten note.
4.  Wait for the AI to analyze and fill the details.

### 🧠 AI Insights
1.  Go to the **Dashboard**.
2.  Look for the purple **"Mitra AI Insights"** card at the top.
3.  It will give you a tip based on your recent business activity.
