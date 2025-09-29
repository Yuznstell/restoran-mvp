// pages/api/notification.js
import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ✅ Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body;
    console.log("📩 Notifikasi dari Midtrans:", body);

    // --- Validasi Signature ---
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("❌ Signature tidak valid!");
      return res.status(400).json({ message: "Invalid signature" });
    }

    // --- Dapatkan detail status transaksi dari Midtrans ---
    const apiClient = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const statusResponse = await apiClient.transaction.notification(body);
    console.log("🔎 Status Transaksi:", statusResponse);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // --- Simpan/Update ke Supabase ---
    await supabase.from("transactions").upsert({
      order_id: orderId,
      amount: parseInt(gross_amount, 10),
      status: transactionStatus,
    });

    // --- Logging status ---
    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        console.log(`⚠️ Order ${orderId} butuh verifikasi manual`);
      } else if (fraudStatus === "accept") {
        console.log(`✅ Order ${orderId} berhasil dibayar`);
      }
    } else if (transactionStatus === "settlement") {
      console.log(`✅ Order ${orderId} sudah settle`);
    } else if (transactionStatus === "pending") {
      console.log(`⏳ Order ${orderId} masih pending`);
    } else if (transactionStatus === "deny") {
      console.log(`❌ Order ${orderId} ditolak`);
    } else if (transactionStatus === "expire") {
      console.log(`⌛ Order ${orderId} expired`);
    } else if (transactionStatus === "cancel") {
      console.log(`🛑 Order ${orderId} dibatalkan`);
    }

    return res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("🔥 Error Notification:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
