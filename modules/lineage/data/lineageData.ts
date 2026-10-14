export const lineageData = {
  database: "normalized_data.db",

  systems: [
    {
      id: "raw_sensi",
      label: "raw_sensi.db",
      description: "Source sub-hop",
    },
    {
      id: "adj_audit",
      label: "adj_audit.db",
      description: "Adjustment sub-hop",
    },
    {
      id: "ref_fx_data",
      label: "ref_fx_data",
      description: "FX sub-hop",
    },
    {
      id: "normalized_data",
      label: "normalized_data.db",
      description: "Normalized output database",
      target: true,
    },
  ],

  tables: [
    {
      id: "raw_sensi",
      name: "raw_sensi",
      systemId: "normalized_data",
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
          transformation: "adjusted_local * f.fx_rate",
          status: "Identified",
        },
      ],
    },

    {
      id: "adj_data",
      name: "adj_data",
      systemId: "normalized_data",
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
          sourceSystemId: "adj_audit",
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
      systemId: "normalized_data",
      attributes: [
        {
          id: "fx_rate",
          name: "fx_rate",
          dataType: "number",
          transformation: "f.fx_rate",
          sourceSystemId: "ref_fx_data",
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
      sourceSystemId: "raw_sensi",
      targetSystemId: "normalized_data",
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
      sourceSystemId: "adj_audit",
      targetSystemId: "normalized_data",
      transformation: "COALESCE(a.approved_adjustment_local, 0)",
      description: "Approved adjustment is added to the original amount.",
    },
    {
      id: "e-adjusted-usd",
      source: "adjusted_local",
      target: "normalized_usd",
      sourceTable: "raw_sensi",
      targetTable: "raw_sensi",
      sourceSystemId: "raw_sensi",
      targetSystemId: "normalized_data",
      transformation: "adjusted_local * f.fx_rate",
      description: "Adjusted local amount is converted to USD.",
    },
    {
      id: "e-fx-usd",
      source: "fx_rate",
      target: "normalized_usd",
      sourceTable: "ref_fx_data",
      targetTable: "raw_sensi",
      sourceSystemId: "ref_fx_data",
      targetSystemId: "normalized_data",
      transformation: "f.fx_rate",
      description: "FX rate is used to calculate normalized USD.",
    },
  ],
} as const;
