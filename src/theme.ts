// Paleta y tokens de Caprichitos (extraídos del diseño original)
export const C = {
  bg: '#FFF8FB',
  text: '#4A3F4A',
  muted: '#A88B99',
  mutedSoft: '#9B8A95',
  pink: '#EC6F9C',
  pinkBright: '#F072A0',
  pinkDeep: '#C04F7E',
  pinkSoft: '#C77B98',
  blue: '#8FBEEC',
  card1: '#FDE7F0',
  card2: '#FCD7E6',
  sidebarTop: '#FDE7F0',
  sidebarBottom: '#EAF3FD',
  border: '#F4DEEA',
  borderSoft: '#F1DEE8',
  white: '#fff',
  green: '#5FB98E',
  amber: '#E5A33C',
  red: '#E5687B',
}

export const shadow = {
  sm: '0 2px 8px rgba(236,111,156,.06)',
  card: '0 4px 18px rgba(236,111,156,.12)',
  btn: '0 6px 16px rgba(236,111,156,.34)',
  pop: '0 12px 40px rgba(236,111,156,.22)',
}

export const font = {
  display: "'Quicksand', sans-serif",
  body: "'Nunito', sans-serif",
}

export const gradient = {
  brand: `linear-gradient(135deg, ${C.pinkBright}, ${C.pink})`,
  logo: `linear-gradient(135deg, #F58FB4, ${C.blue})`,
  sidebar: `linear-gradient(180deg, ${C.sidebarTop} 0%, ${C.sidebarBottom} 100%)`,
  card: `linear-gradient(135deg, ${C.card1}, ${C.card2})`,
}
