import api from "./api";

const listDrafts = async () => {
  const response = await api.get("/drafts");
  return response.data;
};

const getDraft = async (draftId) => {
  const response = await api.get(`/drafts/${draftId}`);
  return response.data;
};

const createDraft = async (draft) => {
  const response = await api.post("/drafts", draft);
  return response.data;
};

const updateDraft = async (draftId, draft) => {
  const response = await api.patch(`/drafts/${draftId}`, draft);
  return response.data;
};

const deleteDraft = async (draftId) => {
  const response = await api.delete(`/drafts/${draftId}`);
  return response.data;
};

const draftService = {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
};

export default draftService;
