export const Config = {
  Beginner: {
    rows: 9,
    columns: 9,
    ceils: 81,
    mines: 10,
  },
  Intermediate: {
    rows: 16,
    columns: 16,
    ceils: 256,
    mines: 40,
  },
  Expert: {
    rows: 16,
    columns: 30,
    ceils: 480,
    mines: 99,
  },
};

export const mobileGameQuery =
  '(max-width: 767px), (pointer: coarse) and (max-height: 767px)';

export function getGameConfig(difficulty, mobile = false) {
  const config = Config[difficulty];
  if (!mobile || difficulty === 'Beginner') return config;
  return {
    ...config,
    rows: difficulty === 'Intermediate' ? 32 : 40,
    columns: difficulty === 'Intermediate' ? 8 : 12,
  };
}
