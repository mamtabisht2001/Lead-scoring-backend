import csv from "csv-parser";
import { Readable } from "stream";
import { createObjectCsvStringifier } from "csv-writer";
import {openai} from "../config/openAi.js";

export const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

export const convertToCSV = (data) => {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: "name", title: "Name" },
      { id: "role", title: "Role" },
      { id: "company", title: "Company" },
      { id: "industry", title: "Industry" },
      { id: "location", title: "Location" },
      { id: "intent", title: "Intent" },
      { id: "score", title: "Score" },
      { id: "reasoning", title: "Reasoning" },
    ],
  });

  return (
    csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(data)
  );
};

export const calculateRuleScore = (lead, offer) => {
  let score = 0;
  const breakdown = {};

  // Role Relevance (max 20 points)
  const decisionMakerRoles = [
    "ceo",
    "cto",
    "cfo",
    "coo",
    "chief",
    "president",
    "vp",
    "vice president",
    "head of",
    "director",
    "founder",
    "owner",
    "partner",
  ];
  const influencerRoles = [
    "manager",
    "lead",
    "senior",
    "principal",
    "architect",
    "specialist",
  ];

  const roleLower = (lead.role || "").toLowerCase();

  if (decisionMakerRoles.some((role) => roleLower.includes(role))) {
    score += 20;
    breakdown.role = { points: 20, reason: "Decision maker role" };
  } else if (influencerRoles.some((role) => roleLower.includes(role))) {
    score += 10;
    breakdown.role = { points: 10, reason: "Influencer role" };
  } else {
    breakdown.role = { points: 0, reason: "Non-decision maker role" };
  }

  // Industry Match (max 20 points)
  if (offer && offer.ideal_use_cases) {
    const industryLower = (lead.industry || "").toLowerCase();
    const useCases = offer.ideal_use_cases.map((uc) => uc.toLowerCase());

    // Check for exact match
    const exactMatch = useCases.some(
      (uc) => industryLower.includes(uc) || uc.includes(industryLower)
    );

    // Adjacent industries (simplified logic - can be enhanced)
    const adjacentIndustries = [
      "technology",
      "software",
      "saas",
      "b2b",
      "enterprise",
    ];
    const adjacentMatch =
      !exactMatch &&
      adjacentIndustries.some((adj) => industryLower.includes(adj));

    if (exactMatch) {
      score += 20;
      breakdown.industry = { points: 20, reason: "Exact ICP match" };
    } else if (adjacentMatch) {
      score += 10;
      breakdown.industry = { points: 10, reason: "Adjacent industry" };
    } else {
      breakdown.industry = { points: 0, reason: "Industry mismatch" };
    }
  } else {
    breakdown.industry = { points: 0, reason: "No offer data available" };
  }

  // Data Completeness (max 10 points)
  const requiredFields = [
    "name",
    "role",
    "company",
    "industry",
    "location",
    "linkedin_bio",
  ];
  const completedFields = requiredFields.filter(
    (field) => lead[field] && lead[field].trim() !== ""
  );

  if (completedFields.length === requiredFields.length) {
    score += 10;
    breakdown.completeness = { points: 10, reason: "All fields present" };
  } else {
    breakdown.completeness = {
      points: 0,
      reason: `Missing fields: ${requiredFields
        .filter((f) => !lead[f] || lead[f].trim() === "")
        .join(", ")}`,
    };
  }

  return { score, breakdown };
};

export const getAIScore = async (lead, offer) => {
  try {
    const prompt = `You are a B2B sales qualification expert. Analyze this prospect against our product offering.

PRODUCT/OFFER:
Name: ${offer.name}
Value Propositions: ${offer.value_props.join(", ")}
Ideal Use Cases: ${offer.ideal_use_cases.join(", ")}

PROSPECT:
Name: ${lead.name}
Role: ${lead.role}
Company: ${lead.company}
Industry: ${lead.industry}
Location: ${lead.location}
LinkedIn Bio: ${lead.linkedin_bio || "Not available"}

TASK:
1. Classify the prospect's buying intent as High, Medium, or Low
2. Provide 1-2 sentences explaining your classification

Consider:
- Does their role indicate decision-making authority?
- Does their industry align with our ideal use cases?
- Does their LinkedIn bio suggest pain points our product solves?
- Would they benefit from our value propositions?

Respond in this exact format:
Intent: [High/Medium/Low]
Reasoning: [Your 1-2 sentence explanation]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a B2B sales qualification expert. Provide concise, actionable lead scoring insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content.trim();

    // Parse the AI response
    const intentMatch = response.match(/Intent:\s*(High|Medium|Low)/i);
    const reasoningMatch = response.match(/Reasoning:\s*(.+)/i);

    const intent = intentMatch ? intentMatch[1] : "Low";
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : response;

    // Map intent to points
    const intentPoints = {
      High: 50,
      Medium: 30,
      Low: 10,
    };

    const aiPoints = intentPoints[intent] || 10;

    return { aiPoints, intent, reasoning };
  } catch (error) {
    console.error("AI scoring error:", error.message);
    // Fallback to low intent if AI fails
    return {
      aiPoints: 10,
      intent: "Low",
      reasoning: "AI classification unavailable - defaulted to low intent",
    };
  }
};

export const scoreLead = async (lead, offer) => {
  // Calculate rule-based score
  const { score: ruleScore, breakdown } = calculateRuleScore(lead, offer);

  // Get AI-based score
  const { aiPoints, intent, reasoning } = await getAIScore(lead, offer);

  // Calculate final score
  const finalScore = ruleScore + aiPoints;

  // Determine final intent based on score
  let finalIntent = intent;
  if (finalScore >= 70) finalIntent = "High";
  else if (finalScore >= 40) finalIntent = "Medium";
  else finalIntent = "Low";

  return {
    name: lead.name,
    role: lead.role,
    company: lead.company,
    industry: lead.industry,
    location: lead.location,
    intent: finalIntent,
    score: finalScore,
    reasoning: reasoning,
    ruleScore,
    aiPoints,
    breakdown: breakdown,
    leadId: lead.id,
    offerId: offer.id,
  };
};
