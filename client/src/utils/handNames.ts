const handNames: Record<string, string> = {
  'Royal Flush': 'Sảnh chúa',
  'Straight Flush': 'Thùng phá sảnh',
  'Four of a Kind': 'Tứ quý',
  'Full House': 'Cù lũ',
  Flush: 'Thùng',
  Straight: 'Sảnh',
  'Three of a Kind': 'Bộ ba',
  'Two Pair': 'Hai đôi',
  'One Pair': 'Một đôi',
  'High Card': 'Mậu thầu',
  Folded: 'Đã bỏ bài',
  Invalid: 'Thắng do đối thủ bỏ bài',
};
export function handName(name: string) {
  return handNames[name] || name;
}
