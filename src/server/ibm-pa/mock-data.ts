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
    name: MOCK_CUBE_NAME,
    serverName: MOCK_SERVER_ID,
  },
  {
    name: "Plan_Forecast",
    serverName: MOCK_SERVER_ID,
  },
];

const mockCubeDimensions: CubeDimension[] = [
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Version",
    hierarchyName: "Version",
    serverName: MOCK_SERVER_ID,
  },
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Account",
    hierarchyName: "Account",
    serverName: MOCK_SERVER_ID,
  },
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Month",
    hierarchyName: "Month",
    serverName: MOCK_SERVER_ID,
  },
];

const mockCubeSampleMembers: CubeSampleMemberSet[] = [
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Version",
    hierarchyName: "Version",
    members: ["Actual", "Budget", "Forecast"],
    serverName: MOCK_SERVER_ID,
  },
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Account",
    hierarchyName: "Account",
    members: ["Revenue", "COGS", "Gross Margin"],
    serverName: MOCK_SERVER_ID,
  },
  {
    cubeName: MOCK_CUBE_NAME,
    dimensionName: "Month",
    hierarchyName: "Month",
    members: ["Jan", "Feb", "Mar"],
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
