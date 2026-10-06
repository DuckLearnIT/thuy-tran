import daiBanDoanh from '../assets/dai-ban-doanh.webp'

// Temporary shared artwork; replace entries as the other 23 cards arrive.
export const locations = Array.from({ length: 24 }, (_, index) => ({
  number: String(index + 1).padStart(2, '0'),
  name: 'Đại Bản Doanh',
  image: daiBanDoanh,
}))
