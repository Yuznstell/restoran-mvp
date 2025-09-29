import midtransClient from "midtrans-client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const notification = req.body;
    console.log("📩 Notifikasi dari Midtrans:", notification);

    // Buat instance Midtrans Notification
    let apiClient = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const statusResponse = await apiClient.transaction.notification(notification);

    console.log("🔎 Status Transaksi:", statusResponse);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    // 👉 TODO: Simpan ke database (contoh: Supabase/Mongo/Postgres)
    // misalnya update status transaksi berdasarkan orderId
    // await db.transactions.update({ orderId }, { status: transactionStatus });

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

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const body = req.body;

    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

    // Validasi signature (supaya yakin ini dari Midtrans, bukan orang iseng)
    const expected = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (signature_key !== expected) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Update status di Supabase
    await supabase.from("transactions").upsert({
      order_id: order_id,
      amount: parseInt(gross_amount, 10),
      status: transaction_status,
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

