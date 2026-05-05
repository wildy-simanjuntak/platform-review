export const useFilter = (items, key, fields) => {
  if (!key) return items; // Jika tidak ada keyword, kembalikan semua

  const searchKey = key.toLowerCase();

  return items.filter((obj) => {
    return fields.some((path) => {
      // 1. Ambil nilai secara dinamis (mendukung dot notation seperti 'signBy.username')
      const val = path.split('.').reduce((o, i) => (o ? o[i] : null), obj);

      // 2. Jika nilainya Array (seperti signTo), gabungkan isinya jadi string
      if (Array.isArray(val)) {
        return JSON.stringify(val).toLowerCase().includes(searchKey);
      }

      // 3. Jika nilainya String atau Angka, cek includes
      if (val !== null && val !== undefined) {
        return String(val).toLowerCase().includes(searchKey);
      }

      return false;
    });
  });
};