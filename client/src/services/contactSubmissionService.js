import api from "./api";

const createContactSubmission = async (submission) => {
  const response = await api.post("/contact-submissions", submission);
  return response.data;
};

const getContactSubmissions = async () => {
  const response = await api.get("/contact-submissions");
  return response.data;
};

const getContactSubmissionById = async (submissionId) => {
  const response = await api.get(`/contact-submissions/${submissionId}`);
  return response.data;
};

const updateContactSubmissionStatus = async (submissionId, status) => {
  const response = await api.patch(
    `/contact-submissions/${submissionId}/status`,
    { status },
  );
  return response.data;
};

const deleteContactSubmission = async (submissionId) => {
  const response = await api.delete(`/contact-submissions/${submissionId}`);
  return response.data;
};

const contactSubmissionService = {
  createContactSubmission,
  getContactSubmissions,
  getContactSubmissionById,
  updateContactSubmissionStatus,
  deleteContactSubmission,
};

export default contactSubmissionService;
