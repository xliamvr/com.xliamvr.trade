/*!
 * Liamvtrade — USD Economic Calendar & XAUUSD Impact Explainer (v2.0)
 * Copyright (c) 2026 Ilham Maulana Nur Al Rasyid (@xliamvr)
 * Package ID: com.xliamvr.trade — All Rights Reserved.
 */

const LIAMV_NEWS = [
  {
    id: 'news-cpi',
    impact: 'HIGH',
    time: '20:30 WIB',
    currency: 'USD',
    category: 'Inflasi AS',
    title: 'Core CPI m/m & Consumer Price Index y/y',
    actual: '0.3%',
    forecast: '0.3%',
    previous: '0.2%',
    smcWarning: 'Wajib tutup/amankan posisi & batalkan Pending Order 15 menit sebelum rilis.',
    explanation:
      'Mengukur perubahan harga barang dan jasa konsumen di AS. Jika Actual > Forecast, inflasi dianggap masih panas sehingga ekspektasi suku bunga tinggi menguatkan USD dan menekan XAUUSD turun tajam (sering memicu Judas Swing dua arah).'
  },
  {
    id: 'news-nfp',
    impact: 'HIGH',
    time: '20:30 WIB',
    currency: 'USD',
    category: 'Tenaga Kerja AS',
    title: 'Non-Farm Payrolls (NFP) & Unemployment Rate',
    actual: '185K',
    forecast: '170K',
    previous: '164K',
    smcWarning: 'Spread XAUUSD sering melebar ekstrem saat rilis NFP. Tunggu 15–30 menit hingga struktur M5 stabil.',
    explanation:
      'Menunjukkan jumlah penambahan tenaga kerja di luar sektor pertanian AS. Data NFP yang jauh lebih kuat dari prediksi (Actual > Forecast) mendorong penguatan Dolar AS dan memicu gelombang bearish pada XAUUSD.'
  },
  {
    id: 'news-claims',
    impact: 'HIGH',
    time: '20:30 WIB',
    currency: 'USD',
    category: 'Klaim Mingguan',
    title: 'Initial Jobless Claims (Klaim Pengangguran)',
    actual: '218K',
    forecast: '225K',
    previous: '221K',
    smcWarning: 'Rutin rilis setiap Kamis malam — sering menyapu Asia High/Low sebelum arah asli terbentuk.',
    explanation:
      'Menghitung jumlah warga AS yang mengajukan tunjangan pengangguran pertama kali. Jika jumlah klaim lebih sedikit dari perkiraan (Actual < Forecast), pasar tenaga kerja dinilai solid → cenderung Bearish jangka pendek untuk Emas.'
  },
  {
    id: 'news-ism',
    impact: 'MED',
    time: '22:00 WIB',
    currency: 'USD',
    category: 'Aktivitas Bisnis',
    title: 'ISM Services PMI',
    actual: '52.4',
    forecast: '51.8',
    previous: '51.5',
    smcWarning: 'Dapat memicu ekspansi lanjutan di pertengahan sesi New York.',
    explanation:
      'Survei manajer pembelian sektor jasa AS. Angka di atas 50.0 menandakan ekspansi ekonomi. Hasil lebih tinggi dari prediksi memberi dorongan positif bagi USD dan menahan kenaikan XAUUSD.'
  },
  {
    id: 'news-fomc',
    impact: 'HIGH',
    time: '02:00 WIB',
    currency: 'USD',
    category: 'Kebijakan Suku Bunga',
    title: 'FOMC Statement & Federal Funds Rate',
    actual: '4.75%',
    forecast: '4.75%',
    previous: '5.00%',
    smcWarning: 'Masuk jam dini hari (Dilarang Entry). Volatilitas ekstrem dan slippage tinggi.',
    explanation:
      'Keputusan suku bunga acuan bank sentral AS (The Fed). Suku bunga yang dipangkas atau nada pernyataan yang dovish melemahkan USD dan menjadi katalis bullish kuat bagi Emas.'
  }
];
