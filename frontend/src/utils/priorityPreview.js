const HIGH_KEYWORDS = [
  "urgent",
  "immediately",
  "danger",
  "fire",
  "electric",
  "leak",
  "accident",
  "emergency",
];

export function predictPriority(description, category) {
  let priority = "Medium";
  const text = (description || "").toLowerCase();
  if (HIGH_KEYWORDS.some((word) => text.includes(word))) {
    priority = "High";
  }
  if (category === "Infrastructure") {
    priority = "High";
  }
  return priority;
}

export function matchedHighKeywords(description) {
  const text = (description || "").toLowerCase();
  return HIGH_KEYWORDS.filter((word) => text.includes(word));
}
