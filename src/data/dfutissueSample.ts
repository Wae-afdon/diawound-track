import type { ClinicalPhase, DFUTissueLabel } from "../types";

export interface DFUTissueSampleItem {
  id: string;
  datasetName: "DFUTissueSegNet / DFUTissue Dataset";
  sourceUrl: string;
  paperUrl: string;
  imagePath: string;
  maskPath?: string;
  split: "train" | "validation" | "test";
  realTissueLabels: DFUTissueLabel[];
  primaryTissueLabel: DFUTissueLabel;
  derivedPrototypePhase: ClinicalPhase;
  derivedPhaseLabelTh: string;
  derivedPhaseLabelEn: string;
  derivedPhaseReasonTh: string;
  derivedPhaseReasonEn: string;
  isRealDatasetImage: true;
  isClinicalPhaseGroundTruth: false;
}

export const DFUTISSUE_DATASET_NAME = "DFUTissueSegNet / DFUTissue Dataset" as const;
export const DFUTISSUE_SOURCE_URL = "https://github.com/uwm-bigdata/DFUTissueSegNet";
export const DFUTISSUE_PAPER_URL = "https://arxiv.org/abs/2406.16012";
export const DFUTISSUE_SAMPLE_TARGET = 5;

const TEST_IMAGE_BASE =
  "https://raw.githubusercontent.com/uwm-bigdata/DFUTissueSegNet/main/DFUTissue/Labeled/Original/Images/Test";
const TEST_MASK_BASE =
  "https://raw.githubusercontent.com/uwm-bigdata/DFUTissueSegNet/main/DFUTissue/Labeled/Original/Annotations/Test";

const MASK_PENDING_REASON = {
  th: "Phase นี้เป็นการจำลองจาก label ของ dataset เพื่อทดสอบระบบ ไม่ใช่ระยะจริงที่แพทย์ยืนยัน",
  en: "This phase is derived from dataset labels for prototype testing. It is not a doctor-confirmed clinical stage.",
};

const testSample = (
  id: string,
  derivedPrototypePhase: ClinicalPhase,
  derivedPhaseLabelTh: string,
  derivedPhaseLabelEn: string,
  derivedPhaseReasonTh = MASK_PENDING_REASON.th,
  derivedPhaseReasonEn = MASK_PENDING_REASON.en,
): DFUTissueSampleItem => ({
  id: `dfu-test-${id}`,
  datasetName: DFUTISSUE_DATASET_NAME,
  sourceUrl: DFUTISSUE_SOURCE_URL,
  paperUrl: DFUTISSUE_PAPER_URL,
  imagePath: `${TEST_IMAGE_BASE}/${id}.png`,
  maskPath: `${TEST_MASK_BASE}/${id}.png`,
  split: "test",
  realTissueLabels: [],
  primaryTissueLabel: "label_pending",
  derivedPrototypePhase,
  derivedPhaseLabelTh,
  derivedPhaseLabelEn,
  derivedPhaseReasonTh,
  derivedPhaseReasonEn,
  isRealDatasetImage: true,
  isClinicalPhaseGroundTruth: false,
});

export const DFUTISSUE_SAMPLE_ITEMS: DFUTissueSampleItem[] = [
  testSample("0914", "phase1", "เฝ้าระวัง", "Watch"),
  testSample("0925", "phase2", "เริ่มน่ากังวล", "Concerning"),
  testSample("0927", "phase3", "เสี่ยงสูง", "High Risk"),
  testSample("0935", "phase4", "อันตรายมาก", "Very Dangerous"),
  testSample(
    "0961",
    "phase5",
    "ภาวะคุกคามเท้า",
    "Limb-Threatening",
    MASK_PENDING_REASON.th,
    MASK_PENDING_REASON.en,
  ),
];

export const DFUTISSUE_PHASE_COVERAGE_NOTE = {
  th: "รอบนี้ใช้ภาพจริง 5 ภาพจากชุด Test ของ DFUTissue ก่อน โดยเตรียม mask path ไว้แล้ว แต่ยังไม่ parse mask ใน prototype นี้ label จึงแสดงเป็น label pending และ Phase 1-5 เป็นค่าจำลองเพื่อทดสอบ flow เท่านั้น",
  en: "This first preview uses 5 real DFUTissue test images. Mask paths are prepared, but mask parsing is not implemented in this prototype yet, so labels show as label pending and Phase 1-5 values are prototype-derived for flow testing only.",
};
