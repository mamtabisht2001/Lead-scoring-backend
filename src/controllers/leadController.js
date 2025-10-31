import prisma from "../../prisma/prisma.js";
import { parseCSV, convertToCSV, scoreLead } from "../helper/leadHelper.js";

export const uploadLeads = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }
    // Verify offer exists in database
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });
    console.log(offer);
    if (!offerId) {
      return res.status(400).json({
        message: "Offer not found",
      });
    }

    // Parse CSV
    const leadsData = await parseCSV(req.file.buffer);
    if (leadsData.length === 0) {
      return res.status(400).json({
        message: "CSV file is empty or invalid",
      });
    }

    // Validate CSV structure
    const requiredColumns = ["name", "role", "company", "industry", "location"];
    const firstLead = leadsData[0];
    const missingColumns = requiredColumns.filter(
      (col) => !firstLead.hasOwnProperty(col)
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: "CSV missing required columns",
      });
    }

    // Insert leads into database
    const leads = await prisma.$transaction(
      leadsData.map((leadData) =>
        prisma.lead.create({
          data: {
            name: leadData.name,
            role: leadData.role,
            company: leadData.company,
            industry: leadData.industry,
            location: leadData.location,
            linkedin_bio: leadData.linkedin_bio || null,
            offerId: offer.id,
          },
        })
      )
    );

    res.status(200).json({
      message: "Leads uploaded successfully",
      count: leads.length,
      leads,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

export const leadsScore = async (req, res) => {
  try {
    const offerId = req.body.offerId;
    if (!offerId) {
      return res.status(400).json({
        message: "No offer ID provided",
      });
    }

    // Get offer from database
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offerId) {
      return res.status(400).json({
        message: "Offer not found",
      });
    }

    // Get unscored leads for this offer
    const leads = await prisma.lead.findMany({
      where: {
        offerId,
        scoredLead: null,
      },
    });

    if (leads.length === 0) {
      return res.status(404).json({
        message: "No unscored leads available",
      });
    }

    // Score all leads (in parallel for better performance)
    const scoringPromises = leads.map((lead) => scoreLead(lead, offer));
    const scoredData = await Promise.all(scoringPromises);
    console.log({ scoredData });
    // Store scored leads in database using transaction
    const scoredLeads = await prisma.$transaction(
      scoredData.map((data) =>
        prisma.scoredLead.create({
          data: {
            name: data.name,
            role: data.role,
            company: data.company,
            industry: data.industry,
            location: data.location,
            intent: data.intent,
            score: data.score,
            reasoning: data.reasoning,
            ruleScore: data.ruleScore,
            aiPoints: data.aiPoints,
            breakdown: data.breakdown,
            leadId: data.leadId,
            offerId: data.offerId,
          },
        })
      )
    );
    console.log(scoredLeads);
    // Calculate statistics
    const highCount = scoredLeads.filter((l) => l.intent === "High").length;
    const mediumCount = scoredLeads.filter((l) => l.intent === "Medium").length;
    const lowCount = scoredLeads.filter((l) => l.intent === "Low").length;
    const avgScore =
      scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length;

    res.status(200).json({
      message: "Scoring completed successfully",
      total: scoredLeads.length,
      summary: {
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        averageScore: avgScore.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const results = async (req, res) => {
  try {
    const offerId = req.query.offerId;

    if (!offerId) {
      return res.status(400).json({
        message: "No offer ID provided",
      });
    }

    const scoredLeads = await prisma.scoredLead.findMany({
      where: { offerId },
      orderBy: { score: "desc" },
    });

    if (scoredLeads.length === 0) {
      return res.status(404).json({
        message: "No scored results available",
      });
    }

    // Return simplified results (without internal breakdown)
    const results = scoredLeads.map((lead) => ({
      name: lead.name,
      role: lead.role,
      company: lead.company,
      industry: lead.industry,
      location: lead.location,
      intent: lead.intent,
      score: lead.score,
      reasoning: lead.reasoning,
    }));

    res.status(200).json({ message: "result generated successfully", results });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const exportResults = async (req, res) => {
  try {
    const offerId = req.query.offerId;

    if (!offerId) {
      return res.status(400).json({
        message: "No offer ID provided",
      });
    }

    const scoredLeads = await prisma.scoredLead.findMany({
      where: { offerId },
      orderBy: { score: "desc" },
    });

    if (scoredLeads.length === 0) {
      return res.status(404).json({
        message: "No scored results available",
      });
    }

    const csvData = convertToCSV(scoredLeads);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=scored_leads.csv"
    );
  res.send(csvData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
