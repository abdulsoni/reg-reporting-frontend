"use client";

import {
  useRef,
  useState,
} from "react";

import {
  FileUp,
  CheckCircle2,
} from "lucide-react";
import { useReportUpload } from "../hooks/useReportUpload";
import { useReports } from "../context/ReportContext";
import { mapApiResponseToReport } from "../utils/reportMapper";
import { UploadedReportResponse } from "../types/report";


export function RegulatoryReportPanel() {

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );


  const [
    selectedFile,
    setSelectedFile
  ] = useState<File | null>(
    null
  );


  const [
    uploaded,
    setUploaded
  ] = useState(false);


  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );


  const {
    upload,
    uploading,
  } = useReportUpload();


  const {
    selectedReport,
    addReport,
  } = useReports();


  const handleChooseFile = () => {

    fileInputRef.current?.click();

  };


  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    setSelectedFile(file);

    setUploaded(false);

    setError(null);


    try {

      /*
       * IMPORTANT:
       *
       * upload(file) is expected to return
       * the parsed API JSON.
       */

      const response =
        await upload(file);


      if (!response) {

        throw new Error(
          "Upload failed. No response received."
        );

      }


      /*
       * Convert API response into
       * our local RegulatoryReport object.
       */

      const report =
        mapApiResponseToReport(
          file,
          response as UploadedReportResponse
        );


      /*
       * Save into localStorage
       * and automatically select
       * the new report.
       */

      addReport(report);


      setUploaded(true);

    } catch (err) {

      setUploaded(false);

      if (
        err instanceof Error
      ) {

        setError(
          err.message
        );

      } else {

        setError(
          "Failed to upload the report."
        );

      }

    } finally {

      /*
       * Allows selecting
       * the same file again.
       */

      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          "";

      }

    }
  };


  /*
   * Use selectedReport rather than
   * hardcoded COREP metadata.
   */

  const report =
    selectedReport;


  return (

    <section className="panel flex flex-col p-5">

      <h2 className="text-xs font-bold text-ink">

        <span className="mr-2 text-slate-400">
          1.
        </span>

        Regulatory report

      </h2>


      {/* Hidden file input */}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".xbrl,.xml,.pdf,.xlsx,.xls,.csv"
        onChange={
          handleFileChange
        }
      />


      {/* Upload dropzone */}

      <div className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">

        <FileUp
          size={20}
          className="text-slate-400"
        />


        <p className="mt-2 text-[11px] text-slate-500">

          XBRL instance, PDF or template

        </p>


        <button
          type="button"
          onClick={
            handleChooseFile
          }
          disabled={uploading}
          className="btn-secondary mt-3 h-9 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
        >

          {uploading
            ? "Uploading..."
            : "Choose file"}

        </button>


        {error && (

          <p className="mt-3 max-w-full text-[10px] font-medium text-red-600">

            {error}

          </p>

        )}

      </div>


      {/* Loaded file */}

      {selectedFile && (

        <div
          className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 ${uploaded
              ? "bg-emerald-50"
              : "bg-slate-100"
            }`}
        >

          {uploaded ? (

            <CheckCircle2
              size={15}
              className="shrink-0 text-emerald-600"
            />

          ) : (

            <FileUp
              size={15}
              className="shrink-0 text-slate-500"
            />

          )}


          <span
            className={`truncate font-mono text-[11px] font-semibold ${uploaded
                ? "text-emerald-800"
                : "text-slate-700"
              }`}
          >

            {selectedFile.name}

          </span>


          {uploaded && (

            <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">

              Loaded

            </span>

          )}


          {uploading && (

            <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">

              Uploading

            </span>

          )}

        </div>

      )}


      {/* Dynamic report metadata */}

      {report && (

        <dl className="mt-4 space-y-2.5 text-[11px]">

          <div className="flex justify-between gap-3">

            <dt className="text-slate-500">
              Regulatory return
            </dt>

            <dd className="text-right font-semibold text-ink">

              {report.regulatoryReturn}

            </dd>

          </div>


          <div className="flex justify-between gap-3">

            <dt className="text-slate-500">
              Reporting entity
            </dt>

            <dd className="text-right font-semibold text-ink">

              {report.reportingEntity}

            </dd>

          </div>


          <div className="flex justify-between gap-3">

            <dt className="text-slate-500">
              Reporting reference date
            </dt>

            <dd className="font-semibold text-ink">

              {report.reportingReferenceDate}

            </dd>

          </div>


          <div className="flex justify-between gap-3">

            <dt className="text-slate-500">
              Submission version
            </dt>

            <dd className="font-semibold text-ink">

              {report.submissionVersion}

            </dd>

          </div>

        </dl>

      )}


      {!report && (

        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-[11px] text-slate-500">

          Upload a regulatory report to view
          report information.

        </div>

      )}

    </section>

  );
}