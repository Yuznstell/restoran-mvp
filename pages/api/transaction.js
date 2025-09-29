import midtransClient from "midtrans-client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { orderId, grossAmount, customerName, email, phone } = req.body;

    if (!orderId || !grossAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Buat Snap API instance
    let snap = new midtransClient.Snap({
      isProduction: false, // Sandbox mode
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(grossAmount, 10), // pastikan integer
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

    const transaction = await snap.createTransaction(parameter);

    console.log("🔑 Token Midtrans:", transaction.token);

    return res.status(200).json({
      token: transaction.token,
    });
  } catch (error) {
    console.error("🔥 Error Midtrans:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { orderId, grossAmount } = req.body;

    // Simpan ke DB (status awal = pending)
    await supabase.from("transactions").upsert({
      order_id: orderId,
      amount: parseInt(grossAmount, 10),
      status: "pending",
    });

    // Buat token Midtrans
    let snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const transaction = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
    });

    res.status(200).json({ token: transaction.token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
