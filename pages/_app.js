import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
