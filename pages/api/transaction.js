// pages/api/transaction.js
import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase Client pakai Service Role Key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { orderId, grossAmount, customerName, email, phone } = req.body;

    // Simpan transaksi awal ke database (status pending)
    await supabase.from("transactions").upsert({
      order_id: orderId,
      amount: parseInt(grossAmount, 10),
      status: "pending",
    });

    // Buat Snap API instance
    let snap = new midtransClient.Snap({
      isProduction: false, // Sandbox mode
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    // Buat parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: customerName || "Customer",
        email: email || "demo@example.com",
        phone: phone || "08123456789",
      },
    };

    // Request token ke Midtrans
    const transaction = await snap.createTransaction(parameter);

    return res.status(200).json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (err) {
    console.error("🔥 Error Midtrans:", err);
    return res.status(500).json({ message: err.message });
  }
}
