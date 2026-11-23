-- =========================================================
-- SKEMA DATABASE SIPROMIN - UMKM NGEJERUK MINUMAN SEGAR
-- =========================================================

-- 1. Tabel Bahan Baku & Kemasan
create table if not exists public.bahan_baku (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  satuan text not null check (satuan in ('gram', 'pcs')),
  stok_saat_ini numeric not null default 0,
  batas_minimum numeric not null default 0,
  persen_limbah numeric not null default 0 check (persen_limbah >= 0 and persen_limbah <= 100),
  created_at timestamptz not null default now()
);

-- 2. Tabel Pengadaan / Pembelian Bahan (Proses 1.0)
create table if not exists public.pengadaan (
  id uuid primary key default gen_random_uuid(),
  bahan_id uuid not null references public.bahan_baku(id) on delete cascade,
  jumlah_masuk numeric not null check (jumlah_masuk > 0),
  total_harga numeric not null default 0,
  catatan text,
  created_at timestamptz not null default now()
);

-- 3. Tabel Produk / Katalog Menu
create table if not exists public.produk (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  harga numeric not null check (harga >= 0),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Tabel Resep per Cup
create table if not exists public.resep (
  id uuid primary key default gen_random_uuid(),
  produk_id uuid not null references public.produk(id) on delete cascade,
  bahan_id uuid not null references public.bahan_baku(id) on delete restrict,
  takaran numeric not null check (takaran > 0),
  unique (produk_id, bahan_id)
);

-- 5. Tabel Transaksi Penjualan (Proses 2.0)
create table if not exists public.transaksi (
  id uuid primary key default gen_random_uuid(),
  produk_id uuid not null references public.produk(id) on delete restrict,
  nama_produk text not null,
  qty integer not null check (qty > 0),
  harga_satuan numeric not null,
  total_harga numeric not null,
  metode_bayar text not null check (metode_bayar in ('Tunai', 'QRIS')),
  created_at timestamptz not null default now()
);

-- 6. Tabel Monitoring Limbah SDG 12 (Proses 3.0)
create table if not exists public.limbah (
  id uuid primary key default gen_random_uuid(),
  transaksi_id uuid references public.transaksi(id) on delete set null,
  sumber text not null,
  berat_gram numeric not null check (berat_gram > 0),
  tindak_lanjut text not null default 'Belum Diproses'
    check (tindak_lanjut in ('Belum Diproses', 'Pupuk Organik', 'Diserahkan ke Panitia Bazar', 'Diserahkan ke Karyawan', 'Dibuang')),
  created_at timestamptz not null default now()
);

-- Aktifkan Row Level Security (Hanya Admin Login yang Bisa Akses)
alter table public.bahan_baku enable row level security;
alter table public.pengadaan enable row level security;
alter table public.produk enable row level security;
alter table public.resep enable row level security;
alter table public.transaksi enable row level security;
alter table public.limbah enable row level security;

create policy "Admin full access bahan_baku" on public.bahan_baku for all to authenticated using (true) with check (true);
create policy "Admin full access pengadaan" on public.pengadaan for all to authenticated using (true) with check (true);
create policy "Admin full access produk" on public.produk for all to authenticated using (true) with check (true);
create policy "Admin full access resep" on public.resep for all to authenticated using (true) with check (true);
create policy "Admin full access transaksi" on public.transaksi for all to authenticated using (true) with check (true);
create policy "Admin full access limbah" on public.limbah for all to authenticated using (true) with check (true);

-- =========================================================
-- DATA AWAL SIMULASI UMKM NGEJERUK
-- =========================================================
insert into public.bahan_baku (nama, satuan, stok_saat_ini, batas_minimum, persen_limbah) values
  ('Jeruk Lokal', 'gram', 15000, 3000, 45),
  ('Jeruk Sunkist', 'gram', 10000, 2000, 40),
  ('Markisa', 'gram', 5000, 1000, 50),
  ('Kelapa Muda', 'gram', 7000, 2000, 60),
  ('Gula Pasir', 'gram', 5000, 1000, 0),
  ('Gelas Plastik (Cup)', 'pcs', 200, 50, 0),
  ('Sedotan', 'pcs', 200, 50, 0)
on conflict (nama) do nothing;

insert into public.produk (nama, harga) values
  ('Es Jeruk Lokal', 5000),
  ('Es Jeruk Sunkist', 8000),
  ('Es Markisa Segar', 7000),
  ('Es Jeruk Kelapa', 10000),
  ('Es Sunkist Markisa Special', 15000)
on conflict (nama) do nothing;

-- Seed Resep
insert into public.resep (produk_id, bahan_id, takaran)
select p.id, b.id, v.takaran
from (values
  ('Es Jeruk Lokal', 'Jeruk Lokal', 150),
  ('Es Jeruk Lokal', 'Gula Pasir', 25),
  ('Es Jeruk Lokal', 'Gelas Plastik (Cup)', 1),
  ('Es Jeruk Lokal', 'Sedotan', 1),

  ('Es Jeruk Sunkist', 'Jeruk Sunkist', 180),
  ('Es Jeruk Sunkist', 'Gula Pasir', 20),
  ('Es Jeruk Sunkist', 'Gelas Plastik (Cup)', 1),
  ('Es Jeruk Sunkist', 'Sedotan', 1),

  ('Es Markisa Segar', 'Markisa', 100),
  ('Es Markisa Segar', 'Gula Pasir', 30),
  ('Es Markisa Segar', 'Gelas Plastik (Cup)', 1),
  ('Es Markisa Segar', 'Sedotan', 1),

  ('Es Jeruk Kelapa', 'Jeruk Lokal', 100),
  ('Es Jeruk Kelapa', 'Kelapa Muda', 80),
  ('Es Jeruk Kelapa', 'Gula Pasir', 25),
  ('Es Jeruk Kelapa', 'Gelas Plastik (Cup)', 1),
  ('Es Jeruk Kelapa', 'Sedotan', 1),

  ('Es Sunkist Markisa Special', 'Jeruk Sunkist', 120),
  ('Es Sunkist Markisa Special', 'Markisa', 60),
  ('Es Sunkist Markisa Special', 'Gula Pasir', 25),
  ('Es Sunkist Markisa Special', 'Gelas Plastik (Cup)', 1),
  ('Es Sunkist Markisa Special', 'Sedotan', 1)
) as v(produk_nama, bahan_nama, takaran)
join public.produk p on p.nama = v.produk_nama
join public.bahan_baku b on b.nama = v.bahan_nama
on conflict (produk_id, bahan_id) do nothing;
