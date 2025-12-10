import axios from 'axios';
import logger from './logger';

// Determine API base URL
// In development (localhost), we use an empty string to leverage the CRA proxy (see package.json "proxy")
// In production, we use the environment variable or a default fallback
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocal ? '/api' : (process.env.REACT_APP_API_BASE || 'https://cursa.onrender.com') + '/api';

const api = {
  /**
   * Upload a single document for processing
   * @param {File} file - The file to upload
   * @param {string} profileId - The profile ID to use
   * @returns {Promise<Object>} - The response data
   */
  uploadDocument: async (file, profileId = 'default_gost') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', profileId);

    try {
      const response = await axios.post(`${API_BASE_URL}/document/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Upload multiple documents for batch processing
   * @param {File[]} files - Array of files to upload
   * @param {string} profileId - The profile ID to use
   * @returns {Promise<Object>} - The response data
   */
  uploadBatch: async (files, profileId = 'default_gost') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('profile_id', profileId);

    try {
      const response = await axios.post(`${API_BASE_URL}/document/upload-batch`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      logger.error('Error uploading batch:', error);
      throw error;
    }
  },
};

export default api;
