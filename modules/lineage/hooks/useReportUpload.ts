"use client";

import { useState } from "react";
import { uploadReport } from "../api/reportApi";
import type { UploadProgress } from "../types/report";

export function useReportUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setUploadProgress({
      step: "uploading",
      message: "Uploading file...",
      progress: 10,
    });

    try {
      setUploadProgress({
        step: "processing",
        message: "Extracting metadata...",
        progress: 40,
      });

      const result = await uploadReport(file);

      setUploadProgress({
        step: "processing",
        message: "Identifying templates...",
        progress: 70,
      });

      setUploadProgress({
        step: "processing",
        message: "Extracting datapoints...",
        progress: 90,
      });

      setUploadProgress({
        step: "completed",
        message: "Processing completed",
        progress: 100,
      });

      return result;
    } catch (error) {
      setUploadProgress({
        step: "error",
        message: error instanceof Error ? error.message : "Upload failed",
        progress: 0,
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploadProgress(null);
    setUploading(false);
  };

  return { upload, uploading, uploadProgress, reset };
}