import logger from "./logger";

import { documentsApi } from "../api/client";

const api = {
  /**
   * Upload a single document for processing
   * @param {File} file - The file to upload
   * @param {string} profileId - The profile ID to use
   * @returns {Promise<Object>} - The response data
   */
  uploadDocument: async (file, profileId = "default_gost") => {
    try {
      return await documentsApi.upload(file, profileId);
    } catch (error) {
      logger.error("Error uploading document:", error);
      throw error;
    }
  },

  /**
   * Upload multiple documents for batch processing
   * @param {File[]} files - Array of files to upload
   * @param {string} profileId - The profile ID to use
   * @returns {Promise<Object>} - The response data
   */
  uploadBatch: async (files, profileId = "default_gost") => {
    try {
      return await documentsApi.uploadBatch(files, profileId);
    } catch (error) {
      logger.error("Error uploading batch:", error);
      throw error;
    }
  },
};

export default api;
