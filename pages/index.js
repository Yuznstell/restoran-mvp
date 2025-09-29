import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Ambil data produk dari Supabase
export async function getServerSideProps() {
  const { data: products, error } = await supabase.from('products').select('*')
  if (error) {
    console.error(error)
  }
  return {
    props: {
      products: products || []
    }
  }
}

export default function Home({ products }) {
  const [cart, setCart] = useState([])

  // Ambil keranjang dari localStorage saat reload
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  // Tambah produk ke keranjang
  const addToCart = (product) => {
    const newCart = [...cart, product]
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🍽️ Menu Restoran</h1>

      {/* Daftar Produk */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {products.length > 0 ? (
          products.map((p) => (
            <div
              key={p.id}
              style={{
                border: '1px solid #ddd',
                padding: 15,
                borderRadius: 10,
                width: 200,
              }}
            >
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  width="200"
                  style={{ borderRadius: 8 }}
                />
              )}
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <strong>Rp {p.price}</strong>
              <br />
              <button
                onClick={() => addToCart(p)}
                style={{
                  marginTop: 10,
                  padding: '5px 10px',
                  borderRadius: 5,
                  background: '#0070f3',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                + Add to Cart
              </button>
            </div>
          ))
        ) : (
          <p>Belum ada produk.</p>
        )}
      </div>

      {/* Keranjang */}
      <div style={{ marginTop: 40 }}>
        <h2>🛒 Keranjang Belanja</h2>
        {cart.length > 0 ? (
          <>
            <ul>
              {cart.map((item, idx) => (
                <li key={idx}>
                  {item.name} - Rp {item.price}
                </li>
              ))}
            </ul>

            {/* Tombol Checkout */}
            <button
              onClick={() => (window.location.href = '/checkout')}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                borderRadius: 5,
                background: 'green',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Lanjut ke Checkout
            </button>
          </>
        ) : (
          <p>Keranjang masih kosong.</p>
        )}
      </div>
    </div>
  )
}
