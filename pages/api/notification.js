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

    const { order_id, status_code, gross_amount, signature_key } = body;

    // --- Normalisasi gross_amount ---
    const cleanAmount = String(gross_amount).replace(/[,\.]/g, "");

    // --- Validasi Signature ---
    const expectedSignature = crypto
      .createHash("sha512")
      .update(order_id + status_code + cleanAmount + process.env.MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("❌ Signature tidak valid!");
      return res.status(401).json({ message: "Invalid signature" });
    }

    // --- Core API untuk ambil status transaksi ---
    const coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    });

    const statusResponse = await coreApi.transaction.status(order_id);
    console.log("🔎 Status Transaksi:", statusResponse);

    const { transaction_status, fraud_status } = statusResponse;

    // --- Simpan/Update ke Supabase ---
    await supabase.from("transactions").upsert({
      order_id,
      amount: parseInt(cleanAmount, 10),
      status: transaction_status,
    });

    // --- Logging status ---
    if (transaction_status === "capture") {
      if (fraud_status === "challenge") {
        console.log(`⚠️ Order ${order_id} butuh verifikasi manual`);
      } else if (fraud_status === "accept") {
        console.log(`✅ Order ${order_id} berhasil dibayar`);
      }
    } else if (transaction_status === "settlement") {
      console.log(`✅ Order ${order_id} sudah settle`);
    } else if (transaction_status === "pending") {
      console.log(`⏳ Order ${order_id} masih pending`);
    } else if (transaction_status === "deny") {
      console.log(`❌ Order ${order_id} ditolak`);
    } else if (transaction_status === "expire") {
      console.log(`⌛ Order ${order_id} expired`);
    } else if (transaction_status === "cancel") {
      console.log(`🛑 Order ${order_id} dibatalkan`);
    }

    return res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("🔥 Error Notification:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}
