import {
  getBusinessProfileForUser,
  saveBusinessProfileForUser,
} from "../services/businessProfileService.js";

export const getMyBusiness = async (req, res) => {
  const business = await getBusinessProfileForUser(req.userRecord._id);

  if (!business) {
    return res.json({ business: null, exists: false });
  }

  return res.json({ business, exists: true });
};

export const saveBusinessDetails = async (req, res) => {
  const result = await saveBusinessProfileForUser(req.userRecord._id, req.body, {
    requireExisting: false,
  });

  if (!result.ok) {
    return res.status(result.status).json({ msg: result.msg });
  }

  return res.json({
    message: "Business profile saved securely.",
    business: result.business,
  });
};

export const updateBusinessDetails = async (req, res) => {
  const result = await saveBusinessProfileForUser(req.userRecord._id, req.body, {
    requireExisting: true,
  });

  if (!result.ok) {
    return res.status(result.status).json({ msg: result.msg });
  }

  return res.json({
    message: "Business profile updated securely.",
    business: result.business,
  });
};

// Backward-compatible endpoint.
export const upsertMyBusiness = saveBusinessDetails;
