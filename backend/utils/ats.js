const STOPWORDS = [
  "the", "is", "and", "a", "to", "of", "in", "for", "on", "with", "at", "by"
];

const SKILLS = [
  "javascript", "react", "node", "express", "mongodb",
  "sql", "postgresql", "python", "java", "c++"
];

const cleanText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .split(/\s+/)
    .filter(word => word && !STOPWORDS.includes(word));
};

const calculateATSScore = (resumeText, jobDescription) => {
  const resumeWords = cleanText(resumeText);
  const jdWords = cleanText(jobDescription);

  // 🔹 Keyword match
  let matchCount = 0;
  jdWords.forEach(word => {
    if (resumeWords.includes(word)) {
      matchCount++;
    }
  });

  const keywordScore = (matchCount / jdWords.length) * 100;

  // 🔹 Skill match
  let matchedSkills = [];
  SKILLS.forEach(skill => {
    if (resumeWords.includes(skill) && jobDescription.toLowerCase().includes(skill)) {
      matchedSkills.push(skill);
    }
  });

  const skillScore = (matchedSkills.length / SKILLS.length) * 100;

  // 🔹 Final score (weighted)
  const finalScore = Math.round((0.7 * keywordScore) + (0.3 * skillScore));

  return {
    score: finalScore,
    matchedSkills,
    missingSkills: SKILLS.filter(skill => !matchedSkills.includes(skill))
  };
};

module.exports = calculateATSScore;