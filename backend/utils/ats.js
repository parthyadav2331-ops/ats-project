const STOPWORDS = new Set([
  "the", "is", "and", "a", "to", "of", "in", "for", "on", "with", "at", "by",
  "an", "be", "or", "as", "it", "that", "this", "we", "you", "are", "was",
  "were", "have", "has", "had", "but", "not", "from", "they", "their"
]);

const SKILLS = [
  "javascript", "typescript", "react", "node", "node.js", "express", "mongodb",
  "sql", "postgresql", "mysql", "python", "java", "c++", "c#", "go", "rust",
  "html", "css", "tailwind", "redux", "next.js", "vue", "angular",
  "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git",
  "rest", "graphql", "api", "agile", "scrum",
  "figma", "prototyping", "user research",
  "power bi", "tableau", "excel", "pandas", "numpy", "machine learning"
];

const tokenize = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^\w\s.+#/-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));

const containsSkill = (haystack, skill) => haystack.toLowerCase().includes(skill);

const calculateATSScore = (resumeText, jobDescription) => {
  const resumeTokens = new Set(tokenize(resumeText));
  const jdTokens = tokenize(jobDescription);
  const uniqueJD = [...new Set(jdTokens)];

  const matched = uniqueJD.filter((w) => resumeTokens.has(w));
  const keywordScore = uniqueJD.length
    ? (matched.length / uniqueJD.length) * 100
    : 0;

  const jdSkills = SKILLS.filter((s) => containsSkill(jobDescription, s));
  const matchedSkills = jdSkills.filter((s) => containsSkill(resumeText, s));
  const missingSkills = jdSkills.filter((s) => !matchedSkills.includes(s));

  const skillScore = jdSkills.length
    ? (matchedSkills.length / jdSkills.length) * 100
    : keywordScore;

  const finalScore = Math.round(0.6 * keywordScore + 0.4 * skillScore);

  const suggestions = [];
  if (missingSkills.length) {
    suggestions.push(
      `Add these missing skills if you have them: ${missingSkills.join(", ")}`
    );
  }
  if (finalScore < 60) {
    suggestions.push("Mirror more keywords from the job description verbatim.");
  }
  if (resumeText && resumeText.length < 500) {
    suggestions.push("Resume looks short — add measurable achievements.");
  }
  if (!suggestions.length) {
    suggestions.push("Strong match. Tailor the summary line to the role.");
  }

  return {
    score: finalScore,
    keywordScore: Math.round(keywordScore),
    skillScore: Math.round(skillScore),
    matchedSkills,
    missingSkills,
    suggestions: suggestions.join(" "),
  };
};

module.exports = calculateATSScore;
