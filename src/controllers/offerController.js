import prisma from "../../prisma/prisma.js";

export const createOffer = async (req, res) => {
  try {
    const { name, value_props, ideal_use_cases } = req.body;

    if (!name || !value_props || !ideal_use_cases) {
      return res.status(400).json({
        error: "Missing required fields.",
        required: ["name", "value_props", "ideal_use_cases"],
      });
    }

    await prisma.offer.create({
      data: {
        name: name,
        valueProps: value_props,
        idealUseCases: ideal_use_cases,
      },
    });

    res.status(201).json({
      message: "Offer data saved successfully",
      offer: offerData,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: `The field name '${name}' already exists.`,
      });
    }
    return res.status(500).json({ error: error.message });
  }
};

