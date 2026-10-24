const express = require("express");
const protect = require("../middleware/auth");
const {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
} = require("../controllers/draftController");

const router = express.Router();

router.use(protect, (req, res, next) => {
  if (req.user?.role !== "client") {
    return res.status(403).json({
      success: false,
      message: "Only clients can access saved drafts.",
    });
  }
  return next();
});

router.get("/", listDrafts);
router.post("/", createDraft);
router.get("/:id", getDraft);
router.patch("/:id", updateDraft);
router.delete("/:id", deleteDraft);

module.exports = router;
