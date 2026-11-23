import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const WASTE_CATEGORY_META = [
  {
    key: 'Pupuk Organik',
    label: 'Pupuk Organik',
    group: 'Terselamatkan',
    color: '#15803d',
    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-400',
  },
  {
    key: 'Diserahkan ke Panitia Bazar',
    label: 'Diserahkan ke Panitia Bazar',
    group: 'Terselamatkan',
    color: '#0f766e',
    badgeClass: 'bg-teal-100 text-teal-950 border border-teal-400',
  },
  {
    key: 'Diserahkan ke Karyawan',
    label: 'Diserahkan ke Karyawan',
    group: 'Terselamatkan',
    color: '#4d7c0f',
    badgeClass: 'bg-lime-100 text-lime-950 border border-lime-400',
  },
  {
    key: 'Belum Diproses',
    label: 'Belum Diproses',
    group: 'Menunggu',
    color: '#b45309',
    badgeClass: 'bg-amber-100 text-amber-950 border border-amber-400',
  },
  {
    key: 'Dibuang',
    label: 'Dibuang ke TPA',
    group: 'Residu',
    color: '#b91c1c',
    badgeClass: 'bg-red-100 text-red-950 border border-red-400',
  },
];

const INPUT_CLASS =
  'mt-1 block min-h-[44px] w-full rounded-lg border border-stone-500 bg-paper px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf';

const SELECT_CLASS =
  'mt-1 block min-h-[44px] w-full cursor-pointer rounded-lg border border-stone-500 bg-paper px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf';

function AdminLogo() {
  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf text-white ring-4 ring-emerald-200"
    >
      <svg viewBox="0 0 48 48" className="h-11 w-11" fill="none">
        <circle cx="24" cy="26" r="14" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M24 12V40M10 26H38M14.1 16.1L33.9 35.9M33.9 16.1L14.1 35.9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M24 11C24 6.5 29.5 4.5 33.5 6.5C32.5 10.5 28.5 12 24 11Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function GuestAvatar() {
  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-20 items-end justify-center overflow-hidden rounded-full bg-stone-300 text-stone-700 ring-4 ring-stone-300"
    >
      <svg viewBox="0 0 48 48" className="h-16 w-16" fill="currentColor">
        <circle cx="24" cy="17" r="8.5" />
        <path d="M9 44c0-8.3 6.7-14 15-14s15 5.7 15 14" />
      </svg>
    </div>
  );
}

function Sdg12Badge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-amber-600 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950">
      <span className="rounded bg-amber-800 px-1.5 py-0.5 text-[11px] font-extrabold text-white">
        SDG 12
      </span>
      <span>Konsumsi &amp; Produksi Bertanggung Jawab</span>
    </div>
  );
}

function UmkmProfileBanner() {
  return (
    <div className="rounded-xl border border-stone-400 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-leaf">
            Profil UMKM • Bandar Lampung (Operasional Harian &amp; Bazar)
          </p>
          <h3 className="mt-1 text-base font-bold text-ink">
            Ngejeruk Minuman Segar
          </h3>
          <p className="mt-1 text-sm text-stone-700">
            Bahan dasar jeruk lokal, Sunkist, markisa, dan gula • Rentang harga Rp 5.000 – Rp 15.000
          </p>
        </div>
        <Sdg12Badge />
      </div>
    </div>
  );
}

function SystemFlowBar({ activeTab, onSelectTab }) {
  const steps = [
    {
      num: '1.0',
      title: 'Pengadaan & Persediaan',
      desc: 'Catat bahan masuk, harga, & batas stok minimum',
      tab: 'stok',
    },
    {
      num: '2.0',
      title: 'Produksi & Penjualan',
      desc: 'Potong stok otomatis per resep & transaksi cup',
      tab: 'penjualan',
    },
    {
      num: '3.0',
      title: 'Monitoring Limbah',
      desc: 'Pilah kulit & ampas jeruk sesuai target SDG 12',
      tab: 'limbah',
    },
    {
      num: '4.0',
      title: 'Dashboard & Laporan',
      desc: 'Ringkasan stok, margin, kapasitas, & audit PDF',
      tab: 'dashboard',
    },
  ];

  return (
    <div className="rounded-xl border border-stone-400 bg-white p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700">
        Alur Sistem Informasi Manajemen (DFD Level 0)
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const isCurrent = activeTab === step.tab;
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => onSelectTab(step.tab)}
              className={`min-h-[44px] cursor-pointer rounded-lg border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf motion-safe:transition-colors ${
                isCurrent
                  ? 'border-leaf bg-emerald-50/70'
                  : 'border-stone-400 bg-paper hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-leaf px-1.5 py-0.5 text-xs font-bold text-white">
                  {step.num}
                </span>
                <span className="text-sm font-bold text-ink">{step.title}</span>
              </div>
              <p className="mt-1.5 text-xs text-stone-700">{step.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WasteInteractiveChart({ limbahList }) {
  const [selectedKey, setSelectedKey] = useState(null);

  const summary = useMemo(() => {
    const totalGram = limbahList.reduce((acc, item) => acc + Number(item.berat_gram || 0), 0);

    const breakdown = WASTE_CATEGORY_META.map((cat) => {
      const gram = limbahList
        .filter((item) => item.tindak_lanjut === cat.key)
        .reduce((acc, item) => acc + Number(item.berat_gram || 0), 0);
      const pct = totalGram > 0 ? Math.round((gram / totalGram) * 100) : 0;
      return { ...cat, gram, kg: (gram / 1000).toFixed(2), pct };
    });

    const savedGram = limbahList
      .filter((l) => l.tindak_lanjut !== 'Dibuang' && l.tindak_lanjut !== 'Belum Diproses')
      .reduce((acc, l) => acc + Number(l.berat_gram || 0), 0);

    const savedPct = totalGram > 0 ? Math.round((savedGram / totalGram) * 100) : 0;

    return {
      totalGram,
      totalKg: (totalGram / 1000).toFixed(2),
      savedKg: (savedGram / 1000).toFixed(2),
      savedPct,
      breakdown,
    };
  }, [limbahList]);

  const activeCategory = summary.breakdown.find((b) => b.key === selectedKey) || null;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="rounded-xl border border-stone-400 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink">
          Proporsi Pengolahan Limbah (SDG 12.3 &amp; 12.5)
        </h3>
        {selectedKey && (
          <button
            type="button"
            onClick={() => setSelectedKey(null)}
            className="min-h-[36px] cursor-pointer rounded-md border border-stone-500 bg-paper px-3 py-1 text-xs font-semibold text-ink hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
          >
            Tampilkan Semua
          </button>
        )}
      </div>

      {summary.totalGram === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-stone-400 bg-paper p-6 text-center text-sm text-stone-700">
          Belum ada catatan limbah organik.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 items-center gap-6 md:grid-cols-12">
          <div className="flex flex-col items-center justify-center md:col-span-5">
            <div className="relative h-48 w-48">
              <svg
                viewBox="0 0 160 160"
                role="img"
                aria-label="Grafik proporsi pengolahan limbah organik"
                className="h-full w-full -rotate-90 transform"
              >
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#d6d3d1"
                  strokeWidth="22"
                />
                {summary.breakdown.map((seg) => {
                  if (seg.gram <= 0) return null;
                  const segmentLength = (seg.gram / summary.totalGram) * circumference;
                  const dashArray = `${segmentLength} ${circumference}`;
                  const dashOffset = -cumulativeOffset;
                  cumulativeOffset += segmentLength;

                  const isSelected = selectedKey === seg.key;
                  const isDimmed = selectedKey && !isSelected;
                  const toggleSegment = () =>
                    setSelectedKey((prev) => (prev === seg.key ? null : seg.key));

                  return (
                    <circle
                      key={seg.key}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isSelected ? '26' : '22'}
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`${seg.label}: ${seg.kg} kg (${seg.pct}%)`}
                      className="cursor-pointer focus-visible:outline-2 focus-visible:outline-leaf motion-safe:transition-all motion-safe:duration-300"
                      style={{ opacity: isDimmed ? 0.35 : 1 }}
                      onMouseEnter={() => setSelectedKey(seg.key)}
                      onFocus={() => setSelectedKey(seg.key)}
                      onClick={toggleSegment}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleSegment();
                        }
                      }}
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <span className="text-xs font-semibold text-stone-700">
                  {activeCategory ? activeCategory.group : 'Terselamatkan'}
                </span>
                <span className="text-2xl font-bold text-ink">
                  {activeCategory ? `${activeCategory.pct}%` : `${summary.savedPct}%`}
                </span>
                <span className="text-xs font-medium text-stone-700">
                  {activeCategory
                    ? `${activeCategory.kg} kg`
                    : `${summary.savedKg} / ${summary.totalKg} kg`}
                </span>
              </div>
            </div>
            <p className="mt-2 text-center text-xs font-medium text-stone-700">
              Total Limbah: <strong className="text-ink">{summary.totalKg} kg</strong>
            </p>
          </div>

          <div className="space-y-2.5 md:col-span-7">
            {summary.breakdown.map((item) => {
              const isSelected = selectedKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isSelected}
                  onMouseEnter={() => setSelectedKey(item.key)}
                  onClick={() =>
                    setSelectedKey((prev) => (prev === item.key ? null : item.key))
                  }
                  className={`block min-h-[44px] w-full cursor-pointer rounded-lg border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf motion-safe:transition-colors ${
                    isSelected
                      ? 'border-stone-700 bg-stone-100'
                      : 'border-stone-400 bg-paper/60 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-ink">{item.label}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${item.badgeClass}`}
                      >
                        {item.group}
                      </span>
                    </div>
                    <span className="font-bold text-ink">
                      {item.kg} kg ({item.pct}%)
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-300">
                    <div
                      className="h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
                      style={{
                        width: `${item.pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactComparisonPanel({ rasioSdg12, totalCupTerjual }) {
  return (
    <div className="rounded-xl border border-stone-400 bg-white p-5">
      <h3 className="text-base font-bold text-ink">
        Perbandingan Sistem Manual vs. SIPROMIN (Ngejeruk Bandar Lampung)
      </h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-400 text-xs uppercase text-stone-700">
            <tr>
              <th className="py-2.5 pr-4">Aspek</th>
              <th className="py-2.5 pr-4">Sistem Manual</th>
              <th className="py-2.5">SIPROMIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-300">
            <tr>
              <td className="py-3 pr-4 font-semibold text-ink">Persediaan &amp; Kemasan</td>
              <td className="py-3 pr-4 text-stone-700">Pantauan fisik manual, rawan selisih</td>
              <td className="py-3 font-medium text-leaf">
                Otomatis per resep ({totalCupTerjual} cup tercatat)
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-semibold text-ink">Perencanaan Produksi</td>
              <td className="py-3 pr-4 text-stone-700">Perkiraan kasar, risiko bahan busuk</td>
              <td className="py-3 font-medium text-leaf">
                Simulasi sisa porsi cup real-time
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-semibold text-ink">Limbah Organik (SDG 12)</td>
              <td className="py-3 pr-4 text-stone-700">0% terdata, langsung terbuang</td>
              <td className="py-3 font-medium text-leaf">
                Terukur otomatis ({rasioSdg12}% termanfaatkan)
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-semibold text-ink">Akses Audit SDG 12</td>
              <td className="py-3 pr-4 text-stone-700">Arsip kertas tertutup</td>
              <td className="py-3 font-medium text-leaf">
                Portal Guest read-only &amp; cetak laporan
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
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

  // Form Catat Limbah Manual & Batch
  const [manualLimbahSumber, setManualLimbahSumber] = useState('Sisa Buah Sortir');
  const [manualLimbahBerat, setManualLimbahBerat] = useState('');
  const [manualLimbahTindak, setManualLimbahTindak] = useState('Pupuk Organik');
  const [batchTindakLanjut, setBatchTindakLanjut] = useState('Pupuk Organik');
  const [processingBatch, setProcessingBatch] = useState(false);

  const isFetchingRef = useRef(false);

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
      if (nextSession) {
        setIsGuest(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = useCallback(
    async (silent = false) => {
      if (!supabase || (!session && !isGuest) || isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (!silent) {
        setLoadingData(true);
        setErrorMsg('');
      }
      try {
        if (isGuest && !session) {
          const [resLimbah, resTransaksi] = await Promise.all([
            supabase
              .from('limbah')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100),
            supabase
              .from('transaksi')
              .select('id, nama_produk, qty, created_at')
              .order('created_at', { ascending: false })
              .limit(100),
          ]);

          if (resLimbah.error) throw resLimbah.error;
          if (resTransaksi.error) throw resTransaksi.error;

          setLimbahList(resLimbah.data || []);
          setTransaksiList(resTransaksi.data || []);
          setBahanBaku([]);
          setProdukList([]);
          setResepList([]);
          setPengadaanList([]);
          return;
        }

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
              .limit(50),
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

        setSelectedProdukId((prev) => prev || resProduk.data?.[0]?.id || '');
        setEditMenuId((prev) => prev || resProduk.data?.[0]?.id || '');
        setEditMenuHarga(
          (prev) => prev || (resProduk.data?.[0] ? String(resProduk.data[0].harga) : '')
        );
        setSelectedBahanId((prev) => prev || resBahan.data?.[0]?.id || '');
        setResepBahanId((prev) => prev || resBahan.data?.[0]?.id || '');
      } catch (err) {
        if (!silent) {
          if (isGuest && !session) {
            setErrorMsg(
              'Akses baca publik belum aktif di Supabase. Jalankan GRANT SELECT untuk role anon di SQL Editor.'
            );
          } else {
            setErrorMsg(err.message || 'Gagal memuat data.');
          }
        }
      } finally {
        isFetchingRef.current = false;
        if (!silent) {
          setLoadingData(false);
        }
      }
    },
    [session, isGuest]
  );

  useEffect(() => {
    if (!supabase || (!session && !isGuest)) return;

    loadAllData(false);

    const channel = supabase
      .channel('sipromin-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadAllData(true);
      })
      .subscribe();

    const pollInterval = setInterval(() => {
      loadAllData(true);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [session, isGuest, loadAllData]);

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
    } else {
      setIsGuest(false);
      setActiveTab('dashboard');
    }
    setSigningIn(false);
  };

  const handleEnterGuest = () => {
    setAuthError('');
    setErrorMsg('');
    setIsGuest(true);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    setIsGuest(false);
    setErrorMsg('');
    if (supabase && session) {
      await supabase.auth.signOut();
    }
  };

  const metrics = useMemo(() => {
    const totalGramBahan = bahanBaku
      .filter((b) => b.satuan === 'gram')
      .reduce((acc, b) => acc + Number(b.stok_saat_ini), 0);

    const totalPcsKemasan = bahanBaku
      .filter((b) => b.satuan === 'pcs')
      .reduce((acc, b) => acc + Number(b.stok_saat_ini), 0);

    const totalCupTerjual = transaksiList.reduce((acc, t) => acc + Number(t.qty || 0), 0);
    const totalOmzet = transaksiList.reduce((acc, t) => acc + Number(t.total_harga || 0), 0);
    const totalBelanja = pengadaanList.reduce((acc, p) => acc + Number(p.total_harga || 0), 0);
    const marginKotor = totalOmzet - totalBelanja;

    const totalLimbahGram = limbahList.reduce((acc, l) => acc + Number(l.berat_gram || 0), 0);
    const dimanfaatkanGram = limbahList
      .filter((l) => l.tindak_lanjut !== 'Dibuang' && l.tindak_lanjut !== 'Belum Diproses')
      .reduce((acc, l) => acc + Number(l.berat_gram || 0), 0);
    const belumDiprosesList = limbahList.filter((l) => l.tindak_lanjut === 'Belum Diproses');
    const belumDiprosesGram = belumDiprosesList.reduce(
      (acc, l) => acc + Number(l.berat_gram || 0),
      0
    );

    const rasioSdg12 =
      totalLimbahGram > 0 ? Math.round((dimanfaatkanGram / totalLimbahGram) * 100) : 0;

    let statusSdg = {
      label: 'Belum Ada Data Limbah',
      colorClass: 'border-stone-400 bg-stone-100 text-stone-900',
    };

    if (totalLimbahGram > 0) {
      if (rasioSdg12 >= 70) {
        statusSdg = {
          label: 'Memenuhi Target SDG 12 (>= 70% Didaur Ulang)',
          colorClass: 'border-emerald-600 bg-emerald-50 text-emerald-950',
        };
      } else if (rasioSdg12 >= 40) {
        statusSdg = {
          label: 'Dalam Tahap Optimalisasi (40% - 69% Didaur Ulang)',
          colorClass: 'border-amber-600 bg-amber-50 text-amber-950',
        };
      } else {
        statusSdg = {
          label: 'Perlu Tindak Lanjut (< 40% Didaur Ulang)',
          colorClass: 'border-red-600 bg-red-50 text-red-950',
        };
      }
    }

    const stokMenipis = bahanBaku.filter(
      (b) => Number(b.stok_saat_ini) <= Number(b.batas_minimum)
    );

    const kapasitasMenu = produkList.map((prod) => {
      const resepMenu = resepList.filter((r) => r.produk_id === prod.id);
      if (resepMenu.length === 0) {
        return {
          id: prod.id,
          nama: prod.nama,
          harga: prod.harga,
          maxCup: null,
          pembatas: 'Resep belum diatur',
        };
      }

      let maxCup = Infinity;
      let bahanPembatas = '';

      for (const item of resepMenu) {
        const bahan = bahanBaku.find((b) => b.id === item.bahan_id);
        const takaran = Number(item.takaran || 0);
        if (!bahan || takaran <= 0) {
          maxCup = 0;
          bahanPembatas = bahan ? bahan.nama : 'Bahan tidak ditemukan';
          break;
        }
        const bisaBuat = Math.floor(Number(bahan.stok_saat_ini) / takaran);
        if (bisaBuat < maxCup) {
          maxCup = bisaBuat;
          bahanPembatas = bahan.nama;
        }
      }

      return {
        id: prod.id,
        nama: prod.nama,
        harga: prod.harga,
        maxCup: maxCup === Infinity ? 0 : maxCup,
        pembatas: bahanPembatas,
      };
    });

    return {
      totalKgBahan: (totalGramBahan / 1000).toFixed(1),
      totalPcsKemasan,
      totalCupTerjual,
      totalOmzet,
      totalBelanja,
      marginKotor,
      totalKgLimbah: (totalLimbahGram / 1000).toFixed(2),
      dimanfaatkanKg: (dimanfaatkanGram / 1000).toFixed(2),
      belumDiprosesCount: belumDiprosesList.length,
      belumDiprosesKg: (belumDiprosesGram / 1000).toFixed(2),
      rasioSdg12,
      statusSdg,
      stokMenipis,
      kapasitasMenu,
    };
  }, [bahanBaku, transaksiList, pengadaanList, limbahList, produkList, resepList]);

  const handleRecordSale = async (e) => {
    e.preventDefault();
    const produk = produkList.find((p) => p.id === selectedProdukId);
    const qty = Number(qtyJual);
    if (!produk || qty <= 0) return;

    const resepMenu = resepList.filter((r) => r.produk_id === produk.id);
    if (resepMenu.length === 0) {
      setErrorMsg('Menu belum memiliki resep. Atur di tab Menu & Resep.');
      return;
    }

    for (const item of resepMenu) {
      const bahan = bahanBaku.find((b) => b.id === item.bahan_id);
      const butuh = Number(item.takaran) * qty;
      if (!bahan || Number(bahan.stok_saat_ini) < butuh) {
        setErrorMsg(
          `Stok ${bahan ? bahan.nama : 'bahan'} kurang (butuh ${butuh} ${
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
      await loadAllData(true);
      showToast(`Tersimpan: ${qty}x ${produk.nama}. Stok bahan & kemasan terpotong.`);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSubmittingSale(false);
    }
  };

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
      await loadAllData(true);
      showToast(`Stok ${bahan.nama} +${masuk} ${bahan.satuan}.`);
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
      await loadAllData(true);
      showToast('Item bahan / kemasan ditambahkan.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambah bahan baku.');
    }
  };

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
      await loadAllData(true);
      showToast('Menu ditambahkan.');
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
      await loadAllData(true);
      showToast('Harga diperbarui.');
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
      await loadAllData(true);
      showToast('Takaran resep disimpan.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan resep.');
    }
  };

  const handleDeleteResep = async (resepId) => {
    setErrorMsg('');
    try {
      const { error } = await supabase.from('resep').delete().eq('id', resepId);
      if (error) throw error;
      await loadAllData(true);
      showToast('Bahan dihapus dari resep.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus bahan.');
    }
  };

  const handleUpdateLimbahStatus = async (limbahId, nextStatus) => {
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('limbah')
        .update({ tindak_lanjut: nextStatus })
        .eq('id', limbahId);
      if (error) throw error;
      await loadAllData(true);
      showToast('Status limbah diperbarui.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui status.');
    }
  };

  const handleBatchProcessLimbah = async () => {
    if (metrics.belumDiprosesCount === 0) return;
    setProcessingBatch(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('limbah')
        .update({ tindak_lanjut: batchTindakLanjut })
        .eq('tindak_lanjut', 'Belum Diproses');
      if (error) throw error;
      await loadAllData(true);
      showToast(
        `${metrics.belumDiprosesCount} catatan limbah diproses ke "${batchTindakLanjut}".`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses limbah secara massal.');
    } finally {
      setProcessingBatch(false);
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
      await loadAllData(true);
      showToast('Catatan limbah ditambahkan.');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mencatat limbah.');
    }
  };

  if (!hasEnvConfig) {
    return (
      <main id="main-content" className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-amber-600 bg-amber-50 p-6 text-ink">
          <h1 className="text-xl font-bold">Konfigurasi Supabase Belum Terpasang</h1>
          <p className="mt-2 text-sm text-stone-700">
            Isi variabel <code>VITE_SUPABASE_URL</code> dan{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> pada Environment Variables.
          </p>
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center p-4">
        <p role="status" className="text-base font-medium text-stone-700">
          Memuat SIPROMIN...
        </p>
      </main>
    );
  }

  // PORTAL LOGIN: ADMIN VS GUEST
  if (!session && !isGuest) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12"
      >
        <header className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            SIPROMIN Ngejeruk
          </h1>
          <p className="mt-1 text-sm text-stone-700">
            Sistem Informasi Persediaan, Produksi &amp; Monitoring Limbah • Bandar Lampung
          </p>
          <div className="mt-3">
            <Sdg12Badge />
          </div>
        </header>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Sisi Admin */}
          <section
            aria-labelledby="portal-admin-title"
            className="flex flex-col justify-between rounded-2xl border border-stone-400 bg-white p-6 sm:p-8"
          >
            <div>
              <div className="flex flex-col items-center text-center">
                <AdminLogo />
                <h2 id="portal-admin-title" className="mt-4 text-xl font-bold text-ink">
                  Admin
                </h2>
                <p className="mt-1 text-sm text-stone-700">Kelola stok, pesanan &amp; limbah</p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-red-600 bg-red-50 px-3 py-2 text-sm font-medium text-red-950"
                >
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="admin-email" className="block text-sm font-semibold text-ink">
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="admin@ngejeruk.id"
                  />
                </div>

                <div>
                  <label htmlFor="admin-pass" className="block text-sm font-semibold text-ink">
                    Kata Sandi
                  </label>
                  <input
                    id="admin-pass"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="min-h-[44px] w-full cursor-pointer rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-colors"
                >
                  {signingIn ? 'Memverifikasi...' : 'Masuk Admin'}
                </button>
              </form>
            </div>
          </section>

          {/* Sisi Guest */}
          <section
            aria-labelledby="portal-guest-title"
            className="flex flex-col justify-between rounded-2xl border border-stone-400 bg-white p-6 sm:p-8"
          >
            <div className="flex flex-col items-center text-center">
              <GuestAvatar />
              <h2 id="portal-guest-title" className="mt-4 text-xl font-bold text-ink">
                Guest
              </h2>
              <p className="mt-1 text-sm text-stone-700">Pemantauan Limbah SDG 12 (Read-Only)</p>
            </div>

            <button
              type="button"
              onClick={handleEnterGuest}
              className="mt-8 min-h-[44px] w-full cursor-pointer rounded-lg border-2 border-leaf bg-white px-4 py-2.5 text-sm font-semibold text-leaf hover:bg-leaf hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf motion-safe:transition-colors"
            >
              Masuk sebagai Guest
            </button>
          </section>
        </div>
      </main>
    );
  }

  // MODE GUEST (READ-ONLY AUDITOR SDG 12)
  if (isGuest && !session) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-leaf focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Langsung ke konten utama
        </a>

        <header className="border-b border-stone-400 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-end justify-center overflow-hidden rounded-full bg-stone-300 text-stone-700"
              >
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="currentColor">
                  <circle cx="24" cy="17" r="8.5" />
                  <path d="M9 44c0-8.3 6.7-14 15-14s15 5.7 15 14" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink">
                  Pemantauan SDG 12: Ngejeruk
                </h1>
                <p className="text-xs font-semibold text-leaf">
                  Bandar Lampung (Guest Read-Only)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[44px] cursor-pointer rounded-lg border border-stone-500 bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
              >
                Cetak PDF
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] cursor-pointer rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-5xl space-y-6 px-4 py-6">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-950"
            >
              {errorMsg}
            </div>
          )}

          {loadingData ? (
            <p role="status" className="py-12 text-center text-sm text-stone-700">
              Memuat data SDG 12...
            </p>
          ) : (
            <>
              <UmkmProfileBanner />

              <div className={`rounded-xl border p-4 ${metrics.statusSdg.colorClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">
                      Status Kepatuhan SDG 12
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold">{metrics.statusSdg.label}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadAllData(false)}
                    className="min-h-[44px] cursor-pointer rounded-lg border border-current bg-white px-3 py-1.5 text-xs font-semibold hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                  >
                    Segarkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-stone-700">
                    Limbah Didaur Ulang
                  </p>
                  <p className="mt-2 text-3xl font-bold text-leaf">{metrics.rasioSdg12}%</p>
                </div>
                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-stone-700">
                    Berat Terselamatkan
                  </p>
                  <p className="mt-2 text-3xl font-bold text-ink">{metrics.dimanfaatkanKg} kg</p>
                </div>
                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-stone-700">
                    Belum Diproses
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber-900">
                    {metrics.belumDiprosesKg} kg
                  </p>
                </div>
                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-stone-700">
                    Produk Terjual
                  </p>
                  <p className="mt-2 text-3xl font-bold text-ink">
                    {metrics.totalCupTerjual} cup
                  </p>
                </div>
              </div>

              <WasteInteractiveChart limbahList={limbahList} />

              <ImpactComparisonPanel
                rasioSdg12={metrics.rasioSdg12}
                totalCupTerjual={metrics.totalCupTerjual}
              />

              <div className="rounded-xl border border-stone-400 bg-white p-5">
                <h3 className="text-base font-bold text-ink">
                  Log Pengolahan Limbah Organik
                </h3>
                {limbahList.length === 0 ? (
                  <p className="mt-3 text-sm text-stone-700">Belum ada catatan limbah.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-400 text-stone-700">
                        <tr>
                          <th className="py-2 pr-3">Waktu</th>
                          <th className="py-2 pr-3">Sumber</th>
                          <th className="py-2 pr-3">Berat</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-300">
                        {limbahList.map((item) => {
                          const meta =
                            WASTE_CATEGORY_META.find((m) => m.key === item.tindak_lanjut) ||
                            WASTE_CATEGORY_META[3];
                          return (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-3 text-stone-700">
                                {formatTanggal(item.created_at)}
                              </td>
                              <td className="py-2.5 pr-3 font-medium">{item.sumber}</td>
                              <td className="py-2.5 pr-3">{item.berat_gram} gram</td>
                              <td className="py-2.5">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badgeClass}`}
                                >
                                  {item.tindak_lanjut}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // MODE ADMIN (FULL ACCESS)
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-leaf focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Langsung ke konten utama
      </a>

      <header className="border-b border-stone-400 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-white"
            >
              <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
                <circle cx="24" cy="26" r="14" stroke="currentColor" strokeWidth="3" />
                <path
                  d="M24 12V40M10 26H38"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink">
                SIPROMIN: Admin Ngejeruk
              </h1>
              <p className="text-xs text-stone-700">
                Operasional Harian &amp; Bazar (Bandar Lampung)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] cursor-pointer rounded-lg border border-stone-500 bg-white px-3.5 py-2 text-sm font-medium text-ink hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
              Cetak Laporan
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] cursor-pointer rounded-lg border border-stone-500 bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
            >
              Keluar
            </button>
          </div>
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
                className={`min-h-[44px] shrink-0 cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf motion-safe:transition-colors ${
                  active
                    ? 'border-leaf bg-leaf text-white'
                    : 'border-stone-400 bg-paper text-ink hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-6">
        {toast && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950"
          >
            {toast}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-950"
          >
            {errorMsg}
          </div>
        )}

        {loadingData ? (
          <p role="status" className="py-12 text-center text-sm text-stone-700">
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
                    onClick={() => loadAllData(false)}
                    className="min-h-[44px] cursor-pointer rounded-lg border border-stone-500 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                  >
                    Muat Ulang Data
                  </button>
                </div>

                <UmkmProfileBanner />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-700">Stok Bahan Basah</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalKgBahan} kg
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-700">Stok Kemasan</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalPcsKemasan} pcs
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-700">Produk Terjual</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalCupTerjual} cup
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-700">Total Omzet</p>
                    <p className="mt-2 text-2xl font-bold text-leaf">
                      {formatRupiah(metrics.totalOmzet)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-700">Estimasi Margin Kotor</p>
                    <p
                      className={`mt-2 text-2xl font-bold ${
                        metrics.marginKotor >= 0 ? 'text-leaf' : 'text-red-900'
                      }`}
                    >
                      {formatRupiah(metrics.marginKotor)}
                    </p>
                    <p className="mt-1 text-xs text-stone-700">
                      Belanja: {formatRupiah(metrics.totalBelanja)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <p className="text-sm font-semibold text-stone-700">Limbah Organik</p>
                    <p className="mt-2 text-2xl font-bold text-ink">
                      {metrics.totalKgLimbah} kg
                    </p>
                    <p className="mt-1 text-xs font-semibold text-leaf">
                      Dimanfaatkan: {metrics.rasioSdg12}%
                    </p>
                  </div>
                </div>

                <SystemFlowBar activeTab={activeTab} onSelectTab={setActiveTab} />

                {/* Simulasi Kapasitas Produksi */}
                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-ink">
                      Estimasi Kapasitas Produksi (Sisa Stok Saat Ini)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('penjualan')}
                      className="min-h-[36px] cursor-pointer rounded-md border border-leaf bg-white px-3 py-1 text-xs font-semibold text-leaf hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                    >
                      Catat Penjualan
                    </button>
                  </div>
                  {metrics.kapasitasMenu.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-700">
                      Belum ada menu terdaftar. Tambahkan di tab Menu &amp; Resep.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {metrics.kapasitasMenu.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-stone-400 bg-paper p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-ink">{item.nama}</p>
                            <span className="text-xs font-medium text-stone-700">
                              {formatRupiah(item.harga)}
                            </span>
                          </div>
                          {item.maxCup === null ? (
                            <p className="mt-2 text-xs font-semibold text-amber-950">
                              Resep belum diatur
                            </p>
                          ) : (
                            <>
                              <p className="mt-2 text-xl font-bold text-ink">
                                Maks. {item.maxCup} cup
                              </p>
                              <p className="mt-0.5 text-xs text-stone-700">
                                Pembatas: {item.pembatas}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <WasteInteractiveChart limbahList={limbahList} />

                <ImpactComparisonPanel
                  rasioSdg12={metrics.rasioSdg12}
                  totalCupTerjual={metrics.totalCupTerjual}
                />

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h3 className="text-base font-bold text-ink">
                    Peringatan Persediaan Menipis
                  </h3>
                  {metrics.stokMenipis.length === 0 ? (
                    <p className="mt-2 text-sm text-stone-700">
                      Semua stok berada di atas batas minimum.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {metrics.stokMenipis.map((item) => (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-950"
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

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h3 className="text-base font-bold text-ink">Transaksi Terbaru</h3>
                  {transaksiList.length === 0 ? (
                    <p className="mt-2 text-sm text-stone-700">Belum ada transaksi tercatat.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-400 text-stone-700">
                          <tr>
                            <th className="py-2 pr-3">Waktu</th>
                            <th className="py-2 pr-3">Menu</th>
                            <th className="py-2 pr-3">Qty</th>
                            <th className="py-2 pr-3">Bayar</th>
                            <th className="py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-300">
                          {transaksiList.slice(0, 8).map((trx) => (
                            <tr key={trx.id}>
                              <td className="py-2.5 pr-3 text-stone-700">
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
                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h2 id="heading-penjualan" className="text-lg font-bold">
                    Catat Pesanan
                  </h2>

                  {produkList.length === 0 ? (
                    <p className="mt-4 text-sm text-stone-700">
                      Belum ada menu. Tambahkan di tab Menu &amp; Resep.
                    </p>
                  ) : (
                    <form onSubmit={handleRecordSale} className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="select-produk"
                          className="block text-sm font-semibold"
                        >
                          Varian Minuman
                        </label>
                        <select
                          id="select-produk"
                          value={selectedProdukId}
                          onChange={(e) => setSelectedProdukId(e.target.value)}
                          className={SELECT_CLASS}
                        >
                          {produkList.map((p) => {
                            const kap = metrics.kapasitasMenu.find((k) => k.id === p.id);
                            const sisaLabel =
                              kap && kap.maxCup !== null ? ` - Sisa ${kap.maxCup} cup` : '';
                            return (
                              <option key={p.id} value={p.id}>
                                {p.nama} ({formatRupiah(p.harga)}
                                {sisaLabel})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="input-qty" className="block text-sm font-semibold">
                          Jumlah Cup
                        </label>
                        <input
                          id="input-qty"
                          type="number"
                          min="1"
                          required
                          value={qtyJual}
                          onChange={(e) => setQtyJual(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="select-bayar"
                          className="block text-sm font-semibold"
                        >
                          Metode Pembayaran
                        </label>
                        <select
                          id="select-bayar"
                          value={metodeBayar}
                          onChange={(e) => setMetodeBayar(e.target.value)}
                          className={SELECT_CLASS}
                        >
                          <option value="Tunai">Tunai</option>
                          <option value="QRIS">QRIS</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingSale}
                        className="min-h-[44px] w-full cursor-pointer rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingSale ? 'Memproses...' : 'Simpan Transaksi'}
                      </button>
                    </form>
                  )}
                </div>

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h3 className="text-lg font-bold">Riwayat Penjualan</h3>
                  {transaksiList.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-700">Belum ada data penjualan.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-stone-300">
                      {transaksiList.map((t) => (
                        <li key={t.id} className="py-3 text-sm">
                          <div className="flex justify-between font-semibold">
                            <span>
                              {t.qty}x {t.nama_produk}
                            </span>
                            <span>{formatRupiah(t.total_harga)}</span>
                          </div>
                          <div className="mt-0.5 flex justify-between text-xs text-stone-700">
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
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <h2 id="heading-stok" className="text-lg font-bold">
                      Catat Stok Masuk
                    </h2>
                    <form onSubmit={handleAddStock} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="beli-bahan" className="block text-sm font-semibold">
                          Bahan Baku / Kemasan
                        </label>
                        <select
                          id="beli-bahan"
                          value={selectedBahanId}
                          onChange={(e) => setSelectedBahanId(e.target.value)}
                          className={SELECT_CLASS}
                        >
                          {bahanBaku.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.nama} ({b.satuan})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="beli-jumlah" className="block text-sm font-semibold">
                          Jumlah Masuk (gram atau pcs)
                        </label>
                        <input
                          id="beli-jumlah"
                          type="number"
                          min="1"
                          required
                          value={jumlahMasuk}
                          onChange={(e) => setJumlahMasuk(e.target.value)}
                          placeholder="5000"
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label htmlFor="beli-harga" className="block text-sm font-semibold">
                          Total Harga Beli (Rp)
                        </label>
                        <input
                          id="beli-harga"
                          type="number"
                          min="0"
                          value={totalHargaBeli}
                          onChange={(e) => setTotalHargaBeli(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>

                      <div>
                        <label htmlFor="beli-catatan" className="block text-sm font-semibold">
                          Catatan Pemasok
                        </label>
                        <input
                          id="beli-catatan"
                          type="text"
                          value={catatanBeli}
                          onChange={(e) => setCatatanBeli(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingStock}
                        className="min-h-[44px] w-full cursor-pointer rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submittingStock ? 'Menyimpan...' : 'Tambah Stok'}
                      </button>
                    </form>
                  </div>

                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <h3 className="text-lg font-bold">Tambah Item Bahan / Kemasan Baru</h3>
                    <form onSubmit={handleCreateBahan} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="baru-nama" className="block text-sm font-semibold">
                          Nama Bahan atau Kemasan
                        </label>
                        <input
                          id="baru-nama"
                          type="text"
                          required
                          value={newBahanNama}
                          onChange={(e) => setNewBahanNama(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="baru-satuan" className="block text-sm font-semibold">
                            Satuan
                          </label>
                          <select
                            id="baru-satuan"
                            value={newBahanSatuan}
                            onChange={(e) => setNewBahanSatuan(e.target.value)}
                            className={SELECT_CLASS}
                          >
                            <option value="gram">gram (Bahan Basah)</option>
                            <option value="pcs">pcs (Kemasan)</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="baru-limbah" className="block text-sm font-semibold">
                            Estimasi Limbah (%)
                          </label>
                          <input
                            id="baru-limbah"
                            type="number"
                            min="0"
                            max="100"
                            value={newBahanLimbah}
                            onChange={(e) => setNewBahanLimbah(e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="baru-stok" className="block text-sm font-semibold">
                            Stok Awal
                          </label>
                          <input
                            id="baru-stok"
                            type="number"
                            min="0"
                            value={newBahanStok}
                            onChange={(e) => setNewBahanStok(e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label htmlFor="baru-min" className="block text-sm font-semibold">
                            Batas Minimum
                          </label>
                          <input
                            id="baru-min"
                            type="number"
                            min="0"
                            value={newBahanMin}
                            onChange={(e) => setNewBahanMin(e.target.value)}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] w-full cursor-pointer rounded-lg border-2 border-leaf bg-white px-4 py-2.5 text-sm font-semibold text-leaf hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      >
                        Simpan Item Baru
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h3 className="text-lg font-bold">Persediaan Saat Ini</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-stone-400 text-stone-700">
                        <tr>
                          <th className="py-2 pr-3">Nama Item</th>
                          <th className="py-2 pr-3">Kategori</th>
                          <th className="py-2 pr-3">Stok</th>
                          <th className="py-2 pr-3">Batas Min</th>
                          <th className="py-2 pr-3">Rasio Limbah</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-300">
                        {bahanBaku.map((b) => {
                          const low = Number(b.stok_saat_ini) <= Number(b.batas_minimum);
                          return (
                            <tr key={b.id}>
                              <td className="py-2.5 pr-3 font-medium">{b.nama}</td>
                              <td className="py-2.5 pr-3 text-stone-700">
                                {b.satuan === 'pcs' ? 'Kemasan' : 'Bahan Baku'}
                              </td>
                              <td className="py-2.5 pr-3">
                                {b.stok_saat_ini} {b.satuan}
                              </td>
                              <td className="py-2.5 pr-3">
                                {b.batas_minimum} {b.satuan}
                              </td>
                              <td className="py-2.5 pr-3">{b.persen_limbah}%</td>
                              <td className="py-2.5">
                                {low ? (
                                  <span className="rounded border border-amber-500 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">
                                    Menipis
                                  </span>
                                ) : (
                                  <span className="rounded border border-emerald-500 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-950">
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
                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <h2 id="heading-menu" className="text-lg font-bold">
                      Tambah Menu Baru
                    </h2>
                    <form onSubmit={handleCreateMenu} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="menu-nama" className="block text-sm font-semibold">
                          Nama Minuman
                        </label>
                        <input
                          id="menu-nama"
                          type="text"
                          required
                          value={newMenuNama}
                          onChange={(e) => setNewMenuNama(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label htmlFor="menu-harga" className="block text-sm font-semibold">
                          Harga Jual (Rp)
                        </label>
                        <input
                          id="menu-harga"
                          type="number"
                          min="500"
                          required
                          value={newMenuHarga}
                          onChange={(e) => setNewMenuHarga(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] w-full cursor-pointer rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      >
                        Tambah Menu
                      </button>
                    </form>
                  </div>

                  <div className="rounded-xl border border-stone-400 bg-white p-5">
                    <h3 className="text-lg font-bold">Ubah Harga Menu</h3>
                    <form onSubmit={handleUpdateMenuHarga} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="edit-menu-select" className="block text-sm font-semibold">
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
                          className={SELECT_CLASS}
                        >
                          {produkList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-menu-price" className="block text-sm font-semibold">
                          Harga Baru (Rp)
                        </label>
                        <input
                          id="edit-menu-price"
                          type="number"
                          min="500"
                          required
                          value={editMenuHarga}
                          onChange={(e) => setEditMenuHarga(e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <button
                        type="submit"
                        className="min-h-[44px] w-full cursor-pointer rounded-lg border-2 border-leaf bg-white px-4 py-2.5 text-sm font-semibold text-leaf hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      >
                        Simpan Harga
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h3 className="text-lg font-bold">Takaran Resep per Cup</h3>

                  <form onSubmit={handleUpsertResep} className="mt-4 space-y-3">
                    <div>
                      <label htmlFor="resep-bahan" className="block text-sm font-semibold">
                        Bahan
                      </label>
                      <select
                        id="resep-bahan"
                        value={resepBahanId}
                        onChange={(e) => setResepBahanId(e.target.value)}
                        className={SELECT_CLASS}
                      >
                        {bahanBaku.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nama} ({b.satuan})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resep-takaran" className="block text-sm font-semibold">
                        Takaran per 1 Cup
                      </label>
                      <input
                        id="resep-takaran"
                        type="number"
                        min="1"
                        required
                        value={resepTakaran}
                        onChange={(e) => setResepTakaran(e.target.value)}
                        placeholder="150"
                        className={INPUT_CLASS}
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[44px] w-full cursor-pointer rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                    >
                      Simpan Takaran
                    </button>
                  </form>

                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-ink">Komposisi Menu Terpilih:</h4>
                    {activeEditResep.length === 0 ? (
                      <p className="mt-2 text-sm text-stone-700">Belum ada komposisi bahan.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-stone-300">
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
                                className="min-h-[36px] cursor-pointer rounded px-2 text-xs font-semibold text-red-900 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
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
                <WasteInteractiveChart limbahList={limbahList} />

                {/* Tindak Lanjut Batch Harian */}
                {metrics.belumDiprosesCount > 0 && (
                  <div className="rounded-xl border border-amber-600 bg-amber-50 p-5 text-amber-950">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold">
                          Tindak Lanjut Batch ({metrics.belumDiprosesCount} catatan menunggu,{' '}
                          {metrics.belumDiprosesKg} kg)
                        </h3>
                        <p className="mt-0.5 text-xs text-amber-950">
                          Ubah seluruh sisa ampas jeruk yang belum diproses sekaligus.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="batch-status-select" className="sr-only">
                          Pilih status tindak lanjut batch
                        </label>
                        <select
                          id="batch-status-select"
                          value={batchTindakLanjut}
                          onChange={(e) => setBatchTindakLanjut(e.target.value)}
                          className="min-h-[44px] cursor-pointer rounded-lg border border-amber-700 bg-white px-3 py-2 text-sm font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                        >
                          {TINDAK_LANJUT_OPTIONS.filter((o) => o !== 'Belum Diproses').map(
                            (opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            )
                          )}
                        </select>
                        <button
                          type="button"
                          disabled={processingBatch}
                          onClick={handleBatchProcessLimbah}
                          className="min-h-[44px] cursor-pointer rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {processingBatch ? 'Memproses...' : 'Proses Semua'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h2 id="heading-limbah" className="text-lg font-bold">
                    Catat Limbah Organik Manual
                  </h2>
                  <form
                    onSubmit={handleAddManualLimbah}
                    className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4"
                  >
                    <div>
                      <label htmlFor="limbah-sumber" className="block text-xs font-semibold">
                        Sumber Limbah
                      </label>
                      <input
                        id="limbah-sumber"
                        type="text"
                        required
                        value={manualLimbahSumber}
                        onChange={(e) => setManualLimbahSumber(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-500 bg-paper px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      />
                    </div>
                    <div>
                      <label htmlFor="limbah-berat" className="block text-xs font-semibold">
                        Berat (gram)
                      </label>
                      <input
                        id="limbah-berat"
                        type="number"
                        min="1"
                        required
                        value={manualLimbahBerat}
                        onChange={(e) => setManualLimbahBerat(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full rounded-lg border border-stone-500 bg-paper px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      />
                    </div>
                    <div>
                      <label htmlFor="limbah-tindak" className="block text-xs font-semibold">
                        Tindak Lanjut
                      </label>
                      <select
                        id="limbah-tindak"
                        value={manualLimbahTindak}
                        onChange={(e) => setManualLimbahTindak(e.target.value)}
                        className="mt-1 block min-h-[44px] w-full cursor-pointer rounded-lg border border-stone-500 bg-paper px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
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
                        className="min-h-[44px] w-full cursor-pointer rounded-lg bg-leaf px-4 py-2 text-sm font-semibold text-white hover:bg-leafHover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                      >
                        Catat Limbah
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-xl border border-stone-400 bg-white p-5">
                  <h3 className="text-lg font-bold">
                    Log Limbah Organik (SDG 12.3 &amp; 12.5)
                  </h3>
                  {limbahList.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-700">Belum ada catatan limbah.</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-stone-400 text-stone-700">
                          <tr>
                            <th className="py-2 pr-3">Waktu</th>
                            <th className="py-2 pr-3">Sumber</th>
                            <th className="py-2 pr-3">Berat</th>
                            <th className="py-2">Status Pemanfaatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-300">
                          {limbahList.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-3 text-stone-700">
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
                                  className="min-h-[44px] cursor-pointer rounded-lg border border-stone-500 bg-paper px-2.5 py-1 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
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
