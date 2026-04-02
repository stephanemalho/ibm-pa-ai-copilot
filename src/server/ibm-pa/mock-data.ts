import "server-only";

import type {
  CubeDimension,
  CubeSampleMemberSet,
  CubeSummary,
  MdxQueryResult,
  Tm1ServerSummary,
} from "@/server/ibm-pa/types";

const MOCK_SERVER_ID = "mock-finance";
const MOCK_CUBE_NAME = "Plan_Budget";

const mockTm1Servers: Tm1ServerSummary[] = [
  {
    description:
      "Mock Planning Analytics server used when IBM credentials are not configured.",
    displayName: "Planning Sample",
    id: MOCK_SERVER_ID,
    isDefault: true,
    name: "Planning Sample",
  },
];

const mockCubes: CubeSummary[] = [
  {
    attributes: {
      Caption: "Budget Plan",
    },
    caption: "Budget Plan",
    lastDataUpdate: "2026-03-31T09:15:00Z",
    lastSchemaUpdate: "2026-03-30T14:00:00Z",
    localizedAttributes: [],
    name: MOCK_CUBE_NAME,
    serverName: MOCK_SERVER_ID,
    uniqueName: `[${MOCK_CUBE_NAME}]`,
  },
  {
    attributes: {
      Caption: "Forecast Plan",
    },
    caption: "Forecast Plan",
    lastDataUpdate: "2026-03-29T11:40:00Z",
    lastSchemaUpdate: "2026-03-25T08:10:00Z",
    localizedAttributes: [],
    name: "Plan_Forecast",
    serverName: MOCK_SERVER_ID,
    uniqueName: "[Plan_Forecast]",
  },
];

const mockCubeDimensions: CubeDimension[] = [
  {
    allLeavesHierarchyName: "Version",
    attributes: {
      Caption: "Plan Version",
    },
    caption: "Plan Version",
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Version",
    hierarchy: {
      attributes: {
        Caption: "Plan Version",
      },
      caption: "Plan Version",
      cardinality: 3,
      levelNames: ["Version"],
      localizedAttributes: [],
      name: "Version",
      structure: "Balanced",
      uniqueName: "[Version]",
      visible: true,
    },
    hierarchyName: "Version",
    localizedAttributes: [],
    name: "Version",
    serverName: MOCK_SERVER_ID,
    uniqueName: "[Version]",
  },
  {
    allLeavesHierarchyName: "Account",
    attributes: {
      Caption: "Account",
    },
    caption: "Account",
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Account",
    hierarchy: {
      attributes: {
        Caption: "Account",
      },
      caption: "Account",
      cardinality: 3,
      levelNames: ["Category", "Account"],
      localizedAttributes: [],
      name: "Account",
      structure: "Balanced",
      uniqueName: "[Account]",
      visible: true,
    },
    hierarchyName: "Account",
    localizedAttributes: [],
    name: "Account",
    serverName: MOCK_SERVER_ID,
    uniqueName: "[Account]",
  },
  {
    allLeavesHierarchyName: "Month",
    attributes: {
      Caption: "Month",
    },
    caption: "Month",
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Month",
    hierarchy: {
      attributes: {
        Caption: "Month",
      },
      caption: "Month",
      cardinality: 12,
      levelNames: ["Month"],
      localizedAttributes: [],
      name: "Month",
      structure: "Balanced",
      uniqueName: "[Month]",
      visible: true,
    },
    hierarchyName: "Month",
    localizedAttributes: [],
    name: "Month",
    serverName: MOCK_SERVER_ID,
    uniqueName: "[Month]",
  },
];

const mockCubeSampleMembers: CubeSampleMemberSet[] = [
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Version",
    hierarchyName: "Version",
    members: [
      {
        attributes: {
          Caption: "Actual",
        },
        caption: "Actual",
        localizedAttributes: [],
        name: "Actual",
        ordinal: 0,
        type: "Numeric",
        uniqueName: "[Version].[Version].[Actual]",
      },
      {
        attributes: {
          Caption: "Budget",
        },
        caption: "Budget",
        localizedAttributes: [],
        name: "Budget",
        ordinal: 1,
        type: "Numeric",
        uniqueName: "[Version].[Version].[Budget]",
      },
      {
        attributes: {
          Caption: "Forecast",
        },
        caption: "Forecast",
        localizedAttributes: [],
        name: "Forecast",
        ordinal: 2,
        type: "Numeric",
        uniqueName: "[Version].[Version].[Forecast]",
      },
    ],
    serverName: MOCK_SERVER_ID,
  },
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Account",
    hierarchyName: "Account",
    members: [
      {
        attributes: {
          Caption: "Revenue",
        },
        caption: "Revenue",
        localizedAttributes: [],
        name: "Revenue",
        ordinal: 0,
        type: "Numeric",
        uniqueName: "[Account].[Account].[Revenue]",
      },
      {
        attributes: {
          Caption: "Cost of Goods Sold",
        },
        caption: "Cost of Goods Sold",
        localizedAttributes: [],
        name: "COGS",
        ordinal: 1,
        type: "Numeric",
        uniqueName: "[Account].[Account].[COGS]",
      },
      {
        attributes: {
          Caption: "Gross Margin",
        },
        caption: "Gross Margin",
        localizedAttributes: [],
        name: "Gross Margin",
        ordinal: 2,
        type: "Numeric",
        uniqueName: "[Account].[Account].[Gross Margin]",
      },
    ],
    serverName: MOCK_SERVER_ID,
  },
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Month",
    hierarchyName: "Month",
    members: [
      {
        attributes: {
          Caption: "January",
        },
        caption: "January",
        localizedAttributes: [],
        name: "Jan",
        ordinal: 0,
        type: "String",
        uniqueName: "[Month].[Month].[Jan]",
      },
      {
        attributes: {
          Caption: "February",
        },
        caption: "February",
        localizedAttributes: [],
        name: "Feb",
        ordinal: 1,
        type: "String",
        uniqueName: "[Month].[Month].[Feb]",
      },
      {
        attributes: {
          Caption: "March",
        },
        caption: "March",
        localizedAttributes: [],
        name: "Mar",
        ordinal: 2,
        type: "String",
        uniqueName: "[Month].[Month].[Mar]",
      },
    ],
    serverName: MOCK_SERVER_ID,
  },
];

const mockMdxResult: MdxQueryResult = {
  axes: [
    {
      ordinal: 0,
      tuples: [
        {
          members: [
            {
              elementName: "Revenue",
              name: "Revenue",
              uniqueName: "[Account].[Account].[Revenue]",
            },
          ],
          ordinal: 0,
        },
      ],
    },
  ],
  cells: [
    {
      formattedValue: "125000",
      ordinal: 0,
      value: 125000,
    },
  ],
  cubeName: MOCK_CUBE_NAME,
  mdx: `SELECT {[Account].[Account].[Revenue]} ON 0 FROM [${MOCK_CUBE_NAME}]`,
  serverName: MOCK_SERVER_ID,
};

export {
  MOCK_CUBE_NAME,
  MOCK_SERVER_ID,
  mockCubeDimensions,
  mockCubeSampleMembers,
  mockCubes,
  mockMdxResult,
  mockTm1Servers,
};
