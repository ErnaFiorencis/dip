// utils/elo.js
const K_FACTOR = 32;

function calculateElo(playerRating, questionRating, isCorrect) {
  const expected = 1 / (1 + Math.pow(10, (questionRating - playerRating) / 400));
  const actual = isCorrect ? 1 : 0;
  
  const newPlayerRating = Math.round(playerRating + K_FACTOR * (actual - expected));
  const newQuestionRating = Math.round(questionRating + K_FACTOR * ((1 - actual) - (1 - expected)));
  
  return { newPlayerRating, newQuestionRating };
}

export default calculateElo;