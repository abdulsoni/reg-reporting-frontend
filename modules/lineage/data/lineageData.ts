export const lineageData = {
  database: "normalized_data.db",

  tables: [
    {
      id: "raw_sensi",
      name: "raw_sensi",
      system: "normalized_data.db",
      attributes: [
        {
          id: "trade_id",
          name: "trade_id",
          dataType: "string",
          transformation: "",
          status: "Identified",
        },
        {
          id: "original_local",
          name: "original_local",
          dataType: "number",
          transformation: "r.original_local",
          status: "Identified",
        },
        {
          id: "adjusted_local",
          name: "adjusted_local",
          dataType: "number",
          transformation:
            "r.original_local + COALESCE(a.approved_adjustment_local, 0)",
          status: "Identified",
        },
        {
          id: "normalized_usd",
          name: "normalized_usd",
          dataType: "number",
          transformation:
            "adjusted_local * f.fx_rate",
          status: "Identified",
        },
      ],
    },

    {
      id: "adj_data",
      name: "adj_data",
      system: "normalized_data.db",
      attributes: [
         {
          id: "adjustment_id",
          name: "adjustment_id",
          dataType: "number",
          transformation: "",
          status: "Identified",
        },
         {
          id: "adjustment_type",
          name: "adjustment_type",
          dataType: "string",
          transformation: "",
          status: "Identified",
        },
        {
          id: "approved_adjustment_local",
          name: "approved_adjustment_local",
          dataType: "number",
          transformation: "COALESCE(a.approved_adjustment_local, 0)",
          sourceTable: "adj_audit",
          status: "Identified",
        },
         {
          id: "approval_status",
          name: "approval_status",
          dataType: "string",
          transformation: "",
          status: "Identified",
        },
      ],
    },

    {
      id: "ref_fx_data",
      name: "ref_fx_data",
      system: "normalized_data.db",
      attributes: [
        {
          id: "fx_rate",
          name: "fx_rate",
          dataType: "number",
          transformation: "f.fx_rate",
          status: "Identified",
        },
         {
          id: "fx_rate_id",
          name: "fx_rate_id",
          dataType: "string",
          transformation: "",
          status: "Identified",
        },
      ],
    },
  ],

  edges: [
    {
      id: "e-original-adjusted",
      source: "original_local",
      target: "adjusted_local",
      sourceTable: "raw_sensi",
      targetTable: "raw_sensi",
      transformation:
        "r.original_local + COALESCE(a.approved_adjustment_local, 0)",
      description: "Original local amount contributes to adjusted amount.",
    },
    {
      id: "e-adjustment-adjusted",
      source: "approved_adjustment_local",
      target: "adjusted_local",
      sourceTable: "adj_data",
      targetTable: "raw_sensi",
      transformation: "COALESCE(a.approved_adjustment_local, 0)",
      description: "Approved adjustment is added to the original amount.",
    },
    {
      id: "e-adjusted-usd",
      source: "adjusted_local",
      target: "normalized_usd",
      sourceTable: "raw_sensi",
      targetTable: "raw_sensi",
      transformation: "adjusted_local * f.fx_rate",
      description: "Adjusted local amount is converted to USD.",
    },
    {
      id: "e-fx-usd",
      source: "fx_rate",
      target: "normalized_usd",
      sourceTable: "ref_fx_data",
      targetTable: "raw_sensi",
      transformation: "f.fx_rate",
      description: "FX rate is used to calculate normalized USD.",
    },
  ],
};
