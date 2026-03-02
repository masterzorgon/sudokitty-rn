// Charities we donate 1% of revenue to — placeholder entries; replace with real charities

export interface Charity {
  id: string;
  name: string;
  url: string;
}

export const CHARITIES: Charity[] = [
  { id: 'example1', name: 'Example Cat Rescue', url: 'https://example.org' },
  { id: 'example2', name: 'Sample Kitten Foundation', url: 'https://example.com' },
];
