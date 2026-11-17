export function estimateTrekBudget(route, { groupSize = 1, hours = route.durationHours, overnight = false } = {}) {
  const costs = {
    Travel: Math.round((450 + route.distanceKm * 110) / 50) * 50,
    Food: Math.max(250, Math.ceil(Number(hours) / 3) * 180),
    Accommodation: overnight ? 1200 : 0,
    "Entry & parking": 300,
    "Local / basic gear": 200 + Math.ceil(route.elevationGainM / 300) * 100,
  };
  const total = Object.values(costs).reduce((sum, amount) => sum + amount, 0);
  return { costs, total, perPerson: total / Math.max(1, Number(groupSize) || 1) };
}
