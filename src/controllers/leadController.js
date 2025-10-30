import prisma from "../../prisma/prisma.js";
import { parseCSV } from "../helper/leadHelper.js";

export const uploadLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        hint: 'Send CSV file with field name "file"',
      });
    }

    const leads = await parseCSV(req.file.buffer);

    if (leads.length === 0) {
      return res.status(400).json({
        error: "CSV file is empty or invalid",
      });
    }

    res.status(200).json({
      message: "Leads uploaded successfully",
      count: leads.length,
      sample: leads,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
