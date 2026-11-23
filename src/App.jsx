import React, { useEffect, useMemo, useState } from 'react';
import { hasEnvConfig, supabase } from './lib/supabase';

const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

const formatTanggal = (iso) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const TINDAK_LANJUT_OPTIONS = [
  'Belum Diproses',
  'Pupuk Organik',
  'Diserahkan ke Panitia Bazar',
  'Diserahkan ke Karyawan',
  'Dibuang',
];

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState('');

  const [bahanBaku, setBahanBaku] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [resepList, setResepList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [limbahList, setLimbahList] = useState([]);
  const [pengadaanList, setPengadaanList] = useState([]);

  // Form Penjualan
  const [selectedProdukId, setSelectedProdukId] = useState('');
  const [qtyJual, setQtyJual] = useState(1);
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [submittingSale, setSubmittingSale] = useState(false);

  // Form Pengadaan
  const [selectedBahanId, setSelectedBahanId] = useState('');
  const [jumlahMasuk, setJumlahMasuk] = useState('');
  const [totalHargaBeli, setTotalHargaBeli] = useState('');
  const [catatanBeli, setCatatanBeli] = useState('');
  const [submittingStock, setSubmittingStock] = useState(false);

  // Form Tambah Bahan Baru
  const [newBahanNama, setNewBahanNama] = useState('');
  const [newBahanSatuan, setNewBahanSatuan] = useState('gram');
  const [newBahanStok, setNewBahanStok] = useState('');
  const [newBahanMin, setNewBahanMin] = useState('');
  const [newBahanLimbah, setNewBahanLimbah] = useState('0');

  // Form Kustomisasi Menu & Resep
  const [newMenuNama, setNewMenuNama] = useState('');
  const [newMenuHarga, setNewMenuHarga] = useState('');
  const [editMenuId, setEditMenuId] = useState('');
  const [editMenuHarga, setEditMenuHarga] = useState('');
  const [resepBahanId, setResepBahanId] = useState('');
  const [resepTakaran, setResepTakaran] = useState('');

  // Form Catat Limbah Manual
  const [manualLimbahSumber, setManualLimbahSumber] = useState('Sisa Buah Sortir');
  const [manualLimbahBerat, setManualLimbahBerat] = useState('');
  const [manualLimbahTindak, setManualLimbahTindak] = useState('Pupuk Organik');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = async () => {
    if (!supabase || !session) return;
    setLoadingData(true);
    setErrorMsg('');
    try {
      const [resBahan, resProduk, resResep, resTransaksi, resLimbah, resPengadaan] =
        await Promise.all([
          supabase.from('bahan_baku').select('*').order('nama', { ascending: true }),
          supabase.from('produk').select('*').order('harga', { ascending: true }),
          supabase.from('resep').select('*'),
          supabase
            .from('transaksi')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('limbah')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('pengadaan')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30),
        ]);

      const firstError =
        resBahan.error ||
        resProduk.error ||
        resResep.error ||
        resTransaksi.error ||
        resLimbah.error ||
        resPengadaan.error;

      if (firstError) throw firstError;

      setBahanBaku(resBahan.data || []);
      setProdukList(resProduk.data || []);
      setResepList(resResep.data || []);
      setTransaksiList(resTransaksi.data || []);
      setLimbahList(resLimbah.data || []);
      setPengadaanList(resPengadaan.data || []);

      if (!selectedProdukId && resProduk.data?.length) {
        setSelectedProdukId(resProduk.data[0].id);
        setEditMenuId(resProduk.data[0].id);
        setEditMenuHarga(String(resProduk.data[0].harga));
      }
      if (!selectedBahanId && resBahan.data?.length) {
        setSelectedBahanId(resBahan.data[0].id);
        setResepBahanId(resBahan.data[0].id);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data dari Supabase.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setSigningIn(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError('Login gagal: ' + error.message);
    }
    setSigningIn(false);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  // Ringkasan Dashboard
  const metrics = useMemo(() => {
    const totalGramBahan = bahanBaku
      .filter((b) => b.satuan === 'gram')
      .reduce((acc, b) => acc + Number(b.stok_saat_ini), 0);

    const totalCupTerjual = transaksiList.reduce((acc, t) => acc + Number(t.qty), 0);
    const totalOmzet = transaksiList.reduce((acc, t) => acc + Number(t.total_harga), 0);

    const totalLimbahGram = limbahList.reduce((acc, l) => acc + Number(l.berat_gram), 0);
    const dimanfaatkanGram = limbahList
      .filter((l) => l.tindak_lanjut !== 'Dibuang' && l.tindak_lanjut !== 'Belum Diproses')
      .reduce((acc, l) => acc + Number(l.berat_gram), 0);

    const rasioSdg12 =
      totalLimbahGram > 0 ? Math.round((dimanfaatkanGram / totalLimbahGram) * 100) : 0;

    const stokMenipis = bahanBaku.filter(
      (b) => Number(b.stok_saat_ini) <= Number(b.batas_minimum)
    );

    return {
      totalKgBahan: (totalGramBahan / 1000).toFixed(1),
      totalCupTerjual,
      totalOmzet,
      totalKgLimbah: (totalLimbahGram / 1000).toFixed(2),
      rasioSdg12,
      stokMenipis,
    };
  }, [bahanBaku, transaksiList, limbahList]);

  // Proses 2.0: Catat Penjualan + Potong Stok + Hitung Limbah Otomatis
  const handleRecordSale = async (e) => {
    e.preventDefault();
    const produk = produkList.find((p) => p.id === selectedProdukId);
    const qty = Number(qtyJual);
    if (!produk || qty <= 0) return;

    const resepMenu = resepList.filter((r) => r.produk_id === produk.id);
    if (resepMenu.length === 0) {
      setErrorMsg('Menu ini belum memiliki takaran resep. Atur resep di tab Menu & Resep.');
      return;
    }

    // Validasi kecukupan stok
    for (const item of resepMenu) {
      const bahan = bahanBaku.find((b) => b.id === item.bahan_id);
      const butuh = Number(item.takaran) * qty;
      if (!bahan || Number(bahan.stok_saat_ini) < butuh) {
        setErrorMsg(
          `Stok ${bahan ? bahan.nama : 'bahan'} tidak mencukupi (butuh ${butuh} ${
            bahan?.satuan || ''
          }).`
        );
        return;
      }
    }

    setSubmittingSale(true);
    setErrorMsg('');

    try {
      const totalHarga = Number(produk.harga) * qty;
      const { data: trxData, error: trxErr } = await supabase
        .from('transaksi')
        .insert({
          produk_id: produk.id,
          nama_produk: produk.nama,
          qty,
          harga_satuan: produk.harga,
          total_harga: totalHarga,
          metode_bayar: metodeBayar,
        })
        .select()
        .single();

      if (trxErr) throw trxErr;

      let totalLimbahTerbentuk = 0;

      for (const item of resepMenu) {
        const bahan = bahanBaku.find((b) => b.id === item.bahan_id);
        const terpakai = Number(item.takaran) * qty;
        const sisaStok = Number(bahan.stok_saat_ini) - terpakai;

        const { error: updErr } = await supabase
          .from('bahan_baku')
          .update({ stok_saat_ini: sisaStok })
          .eq('id', bahan.id);

        if (updErr) throw updErr;

        if (bahan.satuan === 'gram' && Number(bahan.persen_limbah) > 0) {
          totalLimbahTerbentuk += terpakai * (Number(bahan.persen_limbah) / 100);
        }
      }

      if (totalLimbahTerbentuk > 0) {
        const { error: limbErr } = await supabase.from('limbah').insert({
          transaksi_id: trxData.id,
          sumber: `Produksi ${qty}x ${produk.nama}`,
          berat_gram: Math.round(totalLimbahTerbentuk),
          tindak_lanjut: 'Belum Diproses',
        });
        if (limbErr) throw limbErr;
      }

      setQtyJual(1);
      await loadAllData();
      showToast(
        `Penjualan ${qty}x ${produk.nama} tersimpan. Stok terpotong otomatis.`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSubmittingSale(false);
    }
  };

  // Proses 1.0: Tambah Pengadaan Bahan
  const handleAddStock = async (e) => {
    e.preventDefault();
    const bahan = bahanBaku.find((b) => b.id === selectedBahanId);
    const masuk = Number(jumlahMasuk);
    if (!bahan || masuk <= 0) return;

    setSubmittingStock(true);
    setErrorMsg('');
    try {
      const { error: insErr } = await supabase.from('pengadaan').insert({
        bahan_id: bahan.id,
        jumlah_masuk: masuk,
        total_harga: Number(totalHargaBeli || 0),
        catatan: catatanBeli.trim() || null,
      });
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from('bahan_baku')
        .update({ stok_saat_ini: Number(bahan.stok_saat_ini) + masuk })
        .eq('id', bahan.id);
      if (updErr) throw updErr;

      setJumlahMasuk('');
      setTotalHargaBeli('');
      setCatatanBeli('');
      await loadAllData();
      showToast(`Stok ${bahan.nama} bertambah +${masuk} ${bahan.satuan}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mencatat pengadaan.');
    } finally {
      setSubmittingStock(false);
    }
  };

  const handleCreateBahan = async (e) => {
    e.preventDefault();
    if (!newBahanNama.trim()) return;
    setErrorMsg('');
    try {
      const { error } = await supabase.from('bahan_baku').insert({
        nama: newBahanNama.trim(),
        satuan: newBahanSatuan,
        stok_saat_ini: Number(newBahanStok || 0),
        batas_minimum: Number(newBahanMin || 0),
        persen_limbah: Number(newBahanLimbah || 0),
      });
      if (error) throw error;
      setNewBahanNama('');
      setNewBahanStok('');
      setNewBahanMin('');
      setNewBahanLimbah('0');
      await loadAllData();
      showToast('Bahan baku baru ditambahkan.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambah bahan baku.');
    }
  };

  // Kustomisasi Menu & Resep
  const handleCreateMenu = async (e) => {
    e.preventDefault();
    if (!newMenuNama.trim() || Number(newMenuHarga) <= 0) return;
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('produk')
        .insert({ nama: newMenuNama.trim(), harga: Number(newMenuHarga) })
        .select()
        .single();
      if (error) throw error;
      setNewMenuNama('');
      setNewMenuHarga('');
      setEditMenuId(data.id);
      setEditMenuHarga(String(data.harga));
      await loadAllData();
      showToast('Menu baru ditambahkan. Silakan atur takaran resepnya.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambah menu.');
    }
  };

  const handleUpdateMenuHarga = async (e) => {
    e.preventDefault();
    if (!editMenuId || Number(editMenuHarga) <= 0) return;
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('produk')
        .update({ harga: Number(editMenuHarga) })
        .eq('id', editMenuId);
      if (error) throw error;
      await loadAllData();
      showToast('Harga menu diperbarui.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui harga.');
    }
  };

  const handleUpsertResep = async (e) => {
    e.preventDefault();
    if (!editMenuId || !resepBahanId || Number(resepTakaran) <= 0) return;
    setErrorMsg('');
    try {
      const { error } = await supabase.from('resep').upsert(
        {
          produk_id: editMenuId,
          bahan_id: resepBahanId,
          takaran: Number(resepTakaran),
        },
        { onConflict: 'produk_id,bahan_id' }
      );
      if (error) throw error;
      setResepTakaran('');
      await loadAllData();
      showToast('Takaran resep disimpan.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan takaran resep.');
    }
  };

  const handleDeleteResep = async (resepId) => {
    setErrorMsg('');
    try {
      const { error } = await supabase.from('resep').delete().eq('id', resepId);
      if (error) throw error;
      await loadAllData();
      showToast('Bahan dihapus dari resep.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus bahan resep.');
    }
  };

  // Proses 3.0: Limbah SDG 12
  const handleUpdateLimbahStatus = async (limbahId, nextStatus) => {
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('limbah')
        .update({ tindak_lanjut: nextStatus })
        .eq('id', limbahId);
      if (error) throw error;
      await loadAllData();
      showToast('Status pemanfaatan limbah diperbarui.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui status limbah.');
    }
  };

  const handleAddManualLimbah = async (e) => {
    e.preventDefault();
    if (Number(manualLimbahBerat) <= 0) return;
    setErrorMsg('');
    try {
      const { error } = await supabase.from('limbah').insert({
        sumber: manualLimbahSumber.trim() || 'Sisa Buah Manual',
        berat_gram: Number(manualLimbahBerat),
        tindak_lanjut: manualLimbahTindak,
      });
      if (error) throw error;
      setManualLimbahBerat('');
      await loadAllData();
      showToast('Catatan limbah organik ditambahkan.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mencatat limbah.');
    }
  };

  if (!hasEnvConfig) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-ink">
          <h1 className="text-xl font-bold">Konfigurasi Supabase Belum Terpasang</h1>
          <p className="mt-2 text-sm text-muted">
            Tambahkan variabel <code>VITE_SUPABASE_URL</code> dan{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> pada Environment Variables di Vercel atau file{' '}
            <code>.env</code> lokal.
          </p>
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-base font-medium text-muted">Memuat sesi SIPROMIN...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-leaf">
            UMKM Ngejeruk Minuman Segar
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Masuk Admin SIPROMIN</h1>
          <p className="mt-2 text-sm text-muted">
            Kelola stok bahan baku, pencatatan penjualan, dan monitoring limbah organik SDG 12.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-ink">
                Email Admin
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2 text-ink"
                placeholder="admin@ngejeruk.id"
              />
            </div>

            <div>
              <label htmlFor="admin-pass" className="block text-sm font-medium text-ink">
                Kata Sandi
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2 text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={signingIn}
              className="min-h-[44px] w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover disabled:opacity-60"
            >
              {signingIn ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'penjualan', label: 'Penjualan' },
    { id: 'stok', label: 'Stok & Belanja' },
    { id: 'menu', label: 'Menu & Resep' },
    { id: 'limbah', label: 'Limbah SDG 12' },
  ];

  const activeEditResep = resepList.filter((r) => r.produk_id === editMenuId);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-leaf">
              SIPROMIN 4
            </span>
            <h1 className="text-lg font-bold text-ink">
              Halo, Admin! Ngejeruk Minuman Segar
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] rounded-lg border border-stone-300 bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-stone-100"
          >
            Keluar
          </button>
        </div>

        <nav
          aria-label="Navigasi Utama"
          className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3"
        >
          {navItems.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-leaf text-white'
                    : 'bg-paper text-ink hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {toast && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-leaf"
          >
            {toast}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          >
            {errorMsg}
          </div>
        )}

        {loadingData ? (
          <p className="py-12 text-center text-sm text-muted">
            Menyinkronkan data operasional...
          </p>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <section aria-labelledby="heading-dashboard" className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="heading-dashboard" className="text-xl font-bold">
                    Ringkasan Operasional &amp; SDG 12
                  </h2>
                  <button
                    type="button"
                    onClick={loadAllData}
                    className="min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:bg-stone-100"
                  >
                    Muat Ulang Data
                  </button>
                </div>

                {/* 4 Metrik Utama sesuai Mockup SIPROMIN */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <p className="text-sm font-medium text-muted">Stok Bahan Basah</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalKgBahan} kg
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <p className="text-sm font-medium text-muted">Produk Terjual</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalCupTerjual} cup
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <p className="text-sm font-medium text-muted">Total Omzet</p>
                    <p className="mt-2 text-2xl font-bold text-leaf">
                      {formatRupiah(metrics.totalOmzet)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <p className="text-sm font-medium text-muted">Limbah Organik</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalKgLimbah} kg
                    </p>
                    <p className="mt-1 text-xs font-medium text-leaf">
                      Dimanfaatkan kembali: {metrics.rasioSdg12}% (Target SDG 12)
                    </p>
                  </div>
                </div>

                {/* Peringatan Stok Menipis */}
                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h3 className="text-base font-bold text-ink">
                    Peringatan Persediaan Menipis
                  </h3>
                  {metrics.stokMenipis.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">
                      Semua stok bahan baku dan kemasan berada di atas batas minimum.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {metrics.stokMenipis.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                        >
                          <span className="font-semibold">{item.nama}</span>
                          <span>
                            Sisa {item.stok_saat_ini} {item.satuan} (Min:{' '}
                            {item.batas_minimum} {item.satuan})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Transaksi Terbaru */}
                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h3 className="text-base font-bold text-ink">Transaksi Terbaru</h3>
                  {transaksiList.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">
                      Belum ada transaksi tercatat. Buka tab Penjualan untuk mencatat pesanan.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 text-muted">
                          <tr>
                            <th className="py-2 pr-3">Waktu</th>
                            <th className="py-2 pr-3">Menu</th>
                            <th className="py-2 pr-3">Qty</th>
                            <th className="py-2 pr-3">Bayar</th>
                            <th className="py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {transaksiList.slice(0, 8).map((trx) => (
                            <tr key={trx.id}>
                              <td className="py-2.5 pr-3 text-muted">
                                {formatTanggal(trx.created_at)}
                              </td>
                              <td className="py-2.5 pr-3 font-medium">{trx.nama_produk}</td>
                              <td className="py-2.5 pr-3">{trx.qty} cup</td>
                              <td className="py-2.5 pr-3">{trx.metode_bayar}</td>
                              <td className="py-2.5 font-semibold">
                                {formatRupiah(trx.total_harga)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'penjualan' && (
              <section aria-labelledby="heading-penjualan" className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h2 id="heading-penjualan" className="text-lg font-bold">
                    Catat Pesanan Pelanggan
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Menyimpan transaksi otomatis memotong stok bahan baku dan menghitung limbah kulit/ampas.
                  </p>

                  {produkList.length === 0 ? (
                    <p className="mt-4 text-sm text-muted">
                      Belum ada menu tersedia. Tambahkan menu di tab Menu &amp; Resep.
                    </p>
                  ) : (
                    <form onSubmit={handleRecordSale} className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="select-produk"
                          className="block text-sm font-medium"
                        >
                          Pilih Varian Minuman
                        </label>
                        <select
                          id="select-produk"
                          value={selectedProdukId}
                          onChange={(e) => setSelectedProdukId(e.target.value)}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        >
                          {produkList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama} ({formatRupiah(p.harga)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="input-qty" className="block text-sm font-medium">
                          Jumlah Cup
                        </label>
                        <input
                          id="input-qty"
                          type="number"
                          min="1"
                          required
                          value={qtyJual}
                          onChange={(e) => setQtyJual(e.target.value)}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="select-bayar"
                          className="block text-sm font-medium"
                        >
                          Metode Pembayaran
                        </label>
                        <select
                          id="select-bayar"
                          value={metodeBayar}
                          onChange={(e) => setMetodeBayar(e.target.value)}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        >
                          <option value="Tunai">Tunai</option>
                          <option value="QRIS">QRIS</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingSale}
                        className="min-h-[44px] w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover disabled:opacity-60"
                      >
                        {submittingSale ? 'Memproses...' : 'Simpan Transaksi & Potong Stok'}
                      </button>
                    </form>
                  )}
                </div>

                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h3 className="text-lg font-bold">Riwayat Penjualan</h3>
                  {transaksiList.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">Belum ada data penjualan.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-stone-200">
                      {transaksiList.map((t) => (
                        <li key={t.id} className="py-3 text-sm">
                          <div className="flex justify-between font-semibold">
                            <span>
                              {t.qty}x {t.nama_produk}
                            </span>
                            <span>{formatRupiah(t.total_harga)}</span>
                          </div>
                          <div className="mt-0.5 flex justify-between text-xs text-muted">
                            <span>{t.metode_bayar}</span>
                            <span>{formatTanggal(t.created_at)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'stok' && (
              <section aria-labelledby="heading-stok" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <h2 id="heading-stok" className="text-lg font-bold">
                      Catat Pembelian / Stok Masuk
                    </h2>
                    <form onSubmit={handleAddStock} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="beli-bahan" className="block text-sm font-medium">
                          Bahan Baku / Kemasan
                        </label>
                        <select
                          id="beli-bahan"
                          value={selectedBahanId}
                          onChange={(e) => setSelectedBahanId(e.target.value)}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        >
                          {bahanBaku.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.nama} (Satuan: {b.satuan})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="beli-jumlah" className="block text-sm font-medium">
                          Jumlah Masuk (gram atau pcs)
                        </label>
                        <input
                          id="beli-jumlah"
                          type="number"
                          min="1"
                          required
                          value={jumlahMasuk}
                          onChange={(e) => setJumlahMasuk(e.target.value)}
                          placeholder="Contoh: 5000 untuk 5 kg"
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>

                      <div>
                        <label htmlFor="beli-harga" className="block text-sm font-medium">
                          Total Harga Beli (Rp)
                        </label>
                        <input
                          id="beli-harga"
                          type="number"
                          min="0"
                          value={totalHargaBeli}
                          onChange={(e) => setTotalHargaBeli(e.target.value)}
                          placeholder="Opsional"
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>

                      <div>
                        <label htmlFor="beli-catatan" className="block text-sm font-medium">
                          Catatan Pemasok
                        </label>
                        <input
                          id="beli-catatan"
                          type="text"
                          value={catatanBeli}
                          onChange={(e) => setCatatanBeli(e.target.value)}
                          placeholder="Pasar Tamin / Agen Kemasan"
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingStock}
                        className="min-h-[44px] w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover disabled:opacity-60"
                      >
                        {submittingStock ? 'Menyimpan...' : 'Tambah ke Stok'}
                      </button>
                    </form>
                  </div>

                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <h3 className="text-lg font-bold">Tambah Item Bahan Baru</h3>
                    <form onSubmit={handleCreateBahan} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="baru-nama" className="block text-sm font-medium">
                          Nama Bahan
                        </label>
                        <input
                          id="baru-nama"
                          type="text"
                          required
                          value={newBahanNama}
                          onChange={(e) => setNewBahanNama(e.target.value)}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="baru-satuan" className="block text-sm font-medium">
                            Satuan
                          </label>
                          <select
                            id="baru-satuan"
                            value={newBahanSatuan}
                            onChange={(e) => setNewBahanSatuan(e.target.value)}
                            className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                          >
                            <option value="gram">gram</option>
                            <option value="pcs">pcs</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="baru-limbah" className="block text-sm font-medium">
                            Estimasi Limbah (%)
                          </label>
                          <input
                            id="baru-limbah"
                            type="number"
                            min="0"
                            max="100"
                            value={newBahanLimbah}
                            onChange={(e) => setNewBahanLimbah(e.target.value)}
                            className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="baru-stok" className="block text-sm font-medium">
                            Stok Awal
                          </label>
                          <input
                            id="baru-stok"
                            type="number"
                            min="0"
                            value={newBahanStok}
                            onChange={(e) => setNewBahanStok(e.target.value)}
                            className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                          />
                        </div>
                        <div>
                          <label htmlFor="baru-min" className="block text-sm font-medium">
                            Batas Minimum
                          </label>
                          <input
                            id="baru-min"
                            type="number"
                            min="0"
                            value={newBahanMin}
                            onChange={(e) => setNewBahanMin(e.target.value)}
                            className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] w-full rounded-lg border border-leaf bg-white px-4 py-2.5 text-sm font-semibold text-leaf hover:bg-emerald-50"
                      >
                        Simpan Bahan Baru
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h3 className="text-lg font-bold">Daftar Persediaan Saat Ini</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-200 text-muted">
                        <tr>
                          <th className="py-2 pr-3">Nama Bahan</th>
                          <th className="py-2 pr-3">Stok Saat Ini</th>
                          <th className="py-2 pr-3">Batas Min</th>
                          <th className="py-2 pr-3">Rasio Limbah</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {bahanBaku.map((b) => {
                          const low = Number(b.stok_saat_ini) <= Number(b.batas_minimum);
                          return (
                            <tr key={b.id}>
                              <td className="py-2.5 pr-3 font-medium">{b.nama}</td>
                              <td className="py-2.5 pr-3">
                                {b.stok_saat_ini} {b.satuan}
                              </td>
                              <td className="py-2.5 pr-3">
                                {b.batas_minimum} {b.satuan}
                              </td>
                              <td className="py-2.5 pr-3">{b.persen_limbah}%</td>
                              <td className="py-2.5">
                                {low ? (
                                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                    Menipis
                                  </span>
                                ) : (
                                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-leaf">
                                    Aman
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'menu' && (
              <section aria-labelledby="heading-menu" className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <h2 id="heading-menu" className="text-lg font-bold">
                      Tambah Varian Menu Baru
                    </h2>
                    <form onSubmit={handleCreateMenu} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="menu-nama" className="block text-sm font-medium">
                          Nama Minuman
                        </label>
                        <input
                          id="menu-nama"
                          type="text"
                          required
                          value={newMenuNama}
                          onChange={(e) => setNewMenuNama(e.target.value)}
                          placeholder="Contoh: Es Jeruk Peras Murni"
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="menu-harga" className="block text-sm font-medium">
                          Harga Jual (Rp)
                        </label>
                        <input
                          id="menu-harga"
                          type="number"
                          min="500"
                          required
                          value={newMenuHarga}
                          onChange={(e) => setNewMenuHarga(e.target.value)}
                          placeholder="Contoh: 8000"
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover"
                      >
                        Tambah Menu
                      </button>
                    </form>
                  </div>

                  <div className="rounded-xl border border-stone-300 bg-white p-5">
                    <h3 className="text-lg font-bold">Ubah Harga Menu</h3>
                    <form onSubmit={handleUpdateMenuHarga} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="edit-menu-select" className="block text-sm font-medium">
                          Pilih Menu
                        </label>
                        <select
                          id="edit-menu-select"
                          value={editMenuId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setEditMenuId(id);
                            const found = produkList.find((p) => p.id === id);
                            if (found) setEditMenuHarga(String(found.harga));
                          }}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        >
                          {produkList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-menu-price" className="block text-sm font-medium">
                          Harga Baru (Rp)
                        </label>
                        <input
                          id="edit-menu-price"
                          type="number"
                          min="500"
                          required
                          value={editMenuHarga}
                          onChange={(e) => setEditMenuHarga(e.target.value)}
                          className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] w-full rounded-lg border border-leaf bg-white px-4 py-2.5 text-sm font-semibold text-leaf hover:bg-emerald-50"
                      >
                        Simpan Perubahan Harga
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h3 className="text-lg font-bold">Takaran Resep per Cup</h3>
                  <p className="mt-1 text-sm text-muted">
                    Atur bahan yang otomatis terpotong setiap 1 cup terjual.
                  </p>

                  <form onSubmit={handleUpsertResep} className="mt-4 space-y-3">
                    <div>
                      <label htmlFor="resep-bahan" className="block text-sm font-medium">
                        Pilih Bahan
                      </label>
                      <select
                        id="resep-bahan"
                        value={resepBahanId}
                        onChange={(e) => setResepBahanId(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                      >
                        {bahanBaku.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nama} ({b.satuan})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resep-takaran" className="block text-sm font-medium">
                        Takaran per 1 Cup
                      </label>
                      <input
                        id="resep-takaran"
                        type="number"
                        min="1"
                        required
                        value={resepTakaran}
                        onChange={(e) => setResepTakaran(e.target.value)}
                        placeholder="Contoh: 150 untuk 150 gram"
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[44px] w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover"
                    >
                      Simpan Takaran Bahan
                    </button>
                  </form>

                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-ink">Komposisi Menu Terpilih:</h4>
                    {activeEditResep.length === 0 ? (
                      <p className="mt-2 text-sm text-muted">Belum ada komposisi bahan.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-stone-200">
                        {activeEditResep.map((r) => {
                          const b = bahanBaku.find((item) => item.id === r.bahan_id);
                          return (
                            <li
                              key={r.id}
                              className="flex items-center justify-between py-2 text-sm"
                            >
                              <span>
                                {b?.nama || 'Bahan'}: <strong>{r.takaran}</strong>{' '}
                                {b?.satuan || ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteResep(r.id)}
                                className="min-h-[36px] rounded px-2 text-xs font-semibold text-red-800 hover:bg-red-50"
                              >
                                Hapus
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'limbah' && (
              <section aria-labelledby="heading-limbah" className="space-y-6">
                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h2 id="heading-limbah" className="text-lg font-bold">
                    Catat Sisa Buah / Limbah Organik Tambahan
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Limbah produksi minuman tercatat otomatis saat penjualan. Gunakan form ini untuk mencatat buah rusak atau sisa sortir manual.
                  </p>
                  <form
                    onSubmit={handleAddManualLimbah}
                    className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4"
                  >
                    <div>
                      <label htmlFor="limbah-sumber" className="block text-xs font-medium">
                        Sumber Limbah
                      </label>
                      <input
                        id="limbah-sumber"
                        type="text"
                        required
                        value={manualLimbahSumber}
                        onChange={(e) => setManualLimbahSumber(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="limbah-berat" className="block text-xs font-medium">
                        Berat (gram)
                      </label>
                      <input
                        id="limbah-berat"
                        type="number"
                        min="1"
                        required
                        value={manualLimbahBerat}
                        onChange={(e) => setManualLimbahBerat(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="limbah-tindak" className="block text-xs font-medium">
                        Tindak Lanjut SDG 12
                      </label>
                      <select
                        id="limbah-tindak"
                        value={manualLimbahTindak}
                        onChange={(e) => setManualLimbahTindak(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-300 bg-paper px-3 py-2 text-sm"
                      >
                        {TINDAK_LANJUT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="min-h-[44px] w-full rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white hover:bg-leafHover"
                      >
                        Catat Limbah
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-xl border border-stone-300 bg-white p-5">
                  <h3 className="text-lg font-bold">
                    Log Limbah Organik &amp; Pemanfaatan (SDG 12.3 &amp; 12.5)
                  </h3>
                  {limbahList.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">Belum ada catatan limbah.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-200 text-muted">
                          <tr>
                            <th className="py-2 pr-3">Waktu</th>
                            <th className="py-2 pr-3">Sumber</th>
                            <th className="py-2 pr-3">Berat</th>
                            <th className="py-2">Status Pemanfaatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {limbahList.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-3 text-muted">
                                {formatTanggal(item.created_at)}
                              </td>
                              <td className="py-2.5 pr-3 font-medium">{item.sumber}</td>
                              <td className="py-2.5 pr-3">{item.berat_gram} gram</td>
                              <td className="py-2.5">
                                <label htmlFor={`status-${item.id}`} className="sr-only">
                                  Status pemanfaatan untuk {item.sumber}
                                </label>
                                <select
                                  id={`status-${item.id}`}
                                  value={item.tindak_lanjut}
                                  onChange={(e) =>
                                    handleUpdateLimbahStatus(item.id, e.target.value)
                                  }
                                  className="min-h-[40px] rounded-lg border border-stone-300 bg-paper px-2.5 py-1 text-sm"
                                >
                                  {TINDAK_LANJUT_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
