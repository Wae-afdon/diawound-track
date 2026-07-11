import type { ClinicalPhase, DFUTissueLabel, Language, LocalizedText } from "../types";

export const DERIVED_PHASE_NOTICE: LocalizedText = {
  th: "Phase นี้เป็นการจำลองจาก label ของ dataset เพื่อทดสอบระบบ ไม่ใช่ระยะจริงที่แพทย์ยืนยัน",
  en: "This phase is derived from dataset labels for prototype testing. It is not a doctor-confirmed clinical stage.",
};

const phaseCopy: Record<ClinicalPhase, LocalizedText> = {
  phase1: { th: "Phase 1 เฝ้าระวัง", en: "Phase 1 Watch" },
  phase2: { th: "Phase 2 เริ่มน่ากังวล", en: "Phase 2 Concerning" },
  phase3: { th: "Phase 3 เสี่ยงสูง", en: "Phase 3 High Risk" },
  phase4: { th: "Phase 4 อันตรายมาก", en: "Phase 4 Very Dangerous" },
  phase5: { th: "Phase 5 ภาวะคุกคามเท้า", en: "Phase 5 Limb-Threatening" },
};

const phaseReasons: Record<ClinicalPhase, LocalizedText> = {
  phase1: {
    th: "พบลักษณะเนื้อเยื่อที่สัมพันธ์กับการซ่อมแซมแผล จึงจัดเป็น Phase จำลองระดับเฝ้าระวัง",
    en: "Granulation-like tissue is present, so this is mapped to a watch-level prototype phase.",
  },
  phase2: {
    th: "พบ fibrin หรือ callus จึงควรติดตามใกล้ชิดในระบบต้นแบบ",
    en: "Fibrin or callus is present, so the prototype maps it to closer follow-up.",
  },
  phase3: {
    th: "พบหลายชนิดเนื้อเยื่อหรือมี fibrin/callus เด่น จึงจัดเป็นระดับเสี่ยงสูงในระบบต้นแบบ",
    en: "Multiple tissue labels or dominant fibrin/callus are present, so the prototype maps it as high risk.",
  },
  phase4: {
    th: "พบ necrotic/eschar ใน label ของ dataset จึงจัดเป็นระดับอันตรายมากในระบบต้นแบบ",
    en: "Necrotic/eschar appears in the dataset label, so the prototype maps it to a very dangerous level.",
  },
  phase5: {
    th: "พบ label ที่น่ากังวลร่วมกันหลายอย่าง จึงจัดเป็นภาวะคุกคามเท้าในระบบต้นแบบเพื่อทดสอบ flow การส่งต่อ",
    en: "Multiple concerning labels are present, so the prototype maps it as limb-threatening for referral-flow testing.",
  },
};

export function derivePrototypePhaseFromTissueLabels(
  labels: DFUTissueLabel[],
): ClinicalPhase {
  const hasNecroticOrEschar = labels.includes("necrotic") || labels.includes("eschar");
  const hasMultipleConcerning =
    hasNecroticOrEschar &&
    labels.some((label) => label === "fibrin" || label === "callus" || label === "tendon");

  if (hasMultipleConcerning) return "phase5";
  if (hasNecroticOrEschar) return "phase4";
  if (labels.length > 1 && (labels.includes("fibrin") || labels.includes("callus"))) {
    return "phase3";
  }
  if (labels.includes("fibrin") || labels.includes("callus")) return "phase2";
  return "phase1";
}

export function getDerivedPhaseExplanation(
  labels: DFUTissueLabel[],
  language: Language,
) {
  const phase = derivePrototypePhaseFromTissueLabels(labels);
  return phaseReasons[phase][language];
}

export function getDerivedPhaseReasonText(phase: ClinicalPhase): LocalizedText {
  return phaseReasons[phase];
}

export function getDerivedPhaseLabel(phase: ClinicalPhase): LocalizedText {
  return phaseCopy[phase];
}
