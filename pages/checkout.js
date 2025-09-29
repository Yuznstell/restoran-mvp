import { useEffect, useState } from "react";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      setCart(parsed);
      setTotal(parsed.reduce((sum, item) => sum + item.price, 0));
    }

    // Inject Midtrans Snap.js sekali saja
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // cleanup biar gak double
    };
  }, []);

  const handlePayment = async () => {
    try {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "ORDER-" + Date.now(),
          grossAmount: total,
          customerName: "Customer Demo",
          email: "demo@example.com",
          phone: "08123456789",
        }),
      });

      const data = await res.json();
      console.log("🔎 Response API:", data);

      if (res.ok && data.token) {
        window.snap.pay(data.token, {
          onSuccess: (result) => {
            console.log("✅ Sukses:", result);
            alert("Pembayaran berhasil!");
          },
          onPending: (result) => {
            console.log("⏳ Pending:", result);
            alert("Pembayaran pending, cek status nanti.");
          },
          onError: (result) => {
            console.error("❌ Error:", result);
            alert("Terjadi kesalahan pembayaran.");
          },
          onClose: () => {
            console.warn("⚠️ Popup ditutup sebelum selesai.");
          },
        });
      } else {
        alert("❌ Gagal ambil token");
      }
    } catch (err) {
      console.error("🔥 Fatal:", err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>💳 Checkout</h1>
      {cart.length > 0 ? (
        <div>
          <ul>
            {cart.map((item, idx) => (
              <li key={idx}>
                {item.name} - Rp {item.price.toLocaleString("id-ID")}
              </li>
            ))}
          </ul>
          <h2>Total: Rp {total.toLocaleString("id-ID")}</h2>
          <button
            onClick={handlePayment}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 5,
              background: "blue",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Bayar Sekarang
          </button>
        </div>
      ) : (
        <p>Keranjang kosong</p>
      )}
    </div>
  );
}
