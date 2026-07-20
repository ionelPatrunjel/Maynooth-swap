export const getChatId = (a, b) => {
  if (!a || !b) return null;
  return [a, b].sort().join("_");
};
