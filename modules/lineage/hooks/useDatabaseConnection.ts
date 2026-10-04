"use client";

import { useState } from "react";
import { connectDatabase } from "../api/reportApi";

type ConnectParams = {
  db_type: string;
  // host: string;
  // port: number;
  database: string;
  // username: string;
  // password: string;
  report_name:string | undefined;
};

export function useDatabaseConnection() {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (params: ConnectParams) => {
    setConnecting(true);
    setConnected(false);
    setError(null);

    try {
      const response = await connectDatabase(params);

      setConnected(true);

      return response;
    } catch (err) {
      setConnected(false);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to database.");
      }

      throw err;
    } finally {
      setConnecting(false);
    }
  };

  const reset = () => {
    setConnecting(false);
    setConnected(false);
    setError(null);
  };

  return {
    connect,
    connecting,
    connected,
    error,
    reset,
  };
}