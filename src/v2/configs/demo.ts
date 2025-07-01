import { GameTimestamps } from '../typings/Timestamps';

export const DEMO_USER_RESET = {
  name: "tester",
  email: "tester@test.ca",
  city: "Conception Bay South",
  country: "Canada",
  region: "Newfoundland and Labrador",
  education: "Grade 12",
  school: "Learning Center"
} as const;

export function generateDemo(): { coins: number, timestamps: GameTimestamps } {
  const now = new Date(),
    base = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now.

  const isEvenDay = now.getDate() % 2 === 0;
  // Fluctuates between pre_game (true) and game_start (false).
  return {
    coins: isEvenDay ? 0 : 10,
    timestamps: {
      pre_game: addDays(base, isEvenDay ? -1 : - 2).toISOString(),
      game_start: isEvenDay ? base.toISOString() : addDays(base, -1).toISOString(),
      review_start: isEvenDay ? addDays(base, 30).toISOString() : base.toISOString(),
      review_end: addDays(base, isEvenDay ? 60 : 30).toISOString(),
      game_end: addDays(base, isEvenDay ? 90 : 60).toISOString()
    }
  };
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
