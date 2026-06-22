import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

export const evaluateSubmission = async (answerSheets: FileList | null, markingScheme: File | null) => {
  if (!answerSheets || answerSheets.length === 0 || !markingScheme) {
    throw new Error('Missing files for evaluation');
  }

  const formData = new FormData();
  for (let i = 0; i < answerSheets.length; i++) {
    formData.append('answer_sheets', answerSheets[i]);
  }
  formData.append('marking_scheme', markingScheme);

  const response = await axios.post(`${API_BASE}/evaluate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data; // { job_id, status }
};

export const getJobStatus = async (jobId: string) => {
  const response = await axios.get(`${API_BASE}/jobs/${jobId}`);
  return response.data; // { job_id, status }
};

export const getJobResults = async (jobId: string) => {
  const response = await axios.get(`${API_BASE}/jobs/${jobId}/results`);
  return response.data; // The full evaluation payload
};

export const overrideJobResults = async (jobId: string, overrides: any) => {
  const response = await axios.post(`${API_BASE}/jobs/${jobId}/results/override`, overrides);
  return response.data;
};
