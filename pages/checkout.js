import { useEffect, useState } from "react";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      setCart(parsed);
      setTotal(parsed.reduce((sum, item) => sum + item.price, 0));
    }
const handlePay = async () => {
  setLoading(true);

  const res = await fetch("/api/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: "ORDER-" + Date.now(),
      grossAmount: 10000,
      customerName: "Budi",
      email: "budi@example.com",
      phone: "08123456789",
    }),
  });

  const data = await res.json();
  setLoading(false);

  if (data.token && window.snap) {
    window.snap.pay(data.token, {
      onSuccess: (result) => console.log("success", result),
      onPending: (result) => console.log("pending", result),
      onError: (result) => console.log("error", result),
      onClose: () => alert("Popup ditutup sebelum selesai"),
    });
  } else {
    alert("Token gagal diambil atau Snap.js belum siap");
  }
};

    // Inject Snap.js
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    );
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePay = async () => {
    setLoading(true);

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
    setLoading(false);

    if (data.token && window.snap) {
      window.snap.pay(data.token, {
        onSuccess: (result) => {
          console.log("✅ Success:", result);
        },
        onPending: (result) => {
          console.log("⏳ Pending:", result);
        },
        onError: (result) => {
          console.log("❌ Error:", result);
        },
        onClose: () => {
          alert("❌ Popup ditutup tanpa pembayaran");
        },
      });
    } else {
      alert("Token gagal diambil atau Snap.js belum siap");
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
                {item.name} - Rp {item.price}
              </li>
            ))}
          </ul>
          <h2>Total: Rp {total.toLocaleString("id-ID")}</h2>

          <button
            onClick={handlePay}
            disabled={loading}
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
            {loading ? "Processing..." : "Bayar Sekarang"}
          </button>
        </div>
      ) : (
        <p>Keranjang kosong</p>
      )}
    </div>
  );
}
