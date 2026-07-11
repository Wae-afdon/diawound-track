export const DATASET_SOURCES = [
  {
    id: "dfutissue",
    name: "DFUTissueSegNet / DFUTissue Dataset",
    githubUrl: "https://github.com/uwm-bigdata/DFUTissueSegNet",
    paperUrl: "https://arxiv.org/abs/2406.16012",
    mainClasses: [
      "granulation",
      "fibrin",
      "callus",
      "necrotic",
      "eschar",
      "neodermis",
      "tendon",
      "dressing",
    ],
    prototypeStatus: "mock_analysis_only",
  },
] as const;
