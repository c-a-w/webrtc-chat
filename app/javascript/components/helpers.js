export const snakeToCamel = snake => {
  const words = snake.split('_');
  return words.map((word, index) => {
    if (index === 0) { return word.toLowerCase(); }
    return word
      .split('')
      .map((letter, innerIndex) => (
        innerIndex === 0
          ? letter.toUpperCase()
          : letter.toLowerCase()))
      .join('');
  }).join('');
};
