import type {
  AssessmentRecord,
  CHWConsultationCase,
  ClinicPartner,
  ClinicalPhase,
  CommunityHealthWorker,
  DailyReminder,
  Doctor,
  DoctorCorrection,
  DoctorDatasetEntry,
  LocalizedText,
  Patient,
  RiskLevel,
  RoleId,
  SensationStatus,
  ThemeId,
} from "../types";

export const STORAGE_KEYS = {
  role: "woundsense_current_role",
  language: "woundsense_language",
  theme: "woundsense_theme",
  patients: "woundsense_patients",
  assessments: "woundsense_assessments",
  doctorCorrections: "woundsense_doctor_corrections",
  dailyReminders: "woundsense_daily_reminders",
  chwConsultationCases: "woundsense_chw_consultation_cases",
  clinicPartners: "woundsense_clinic_partners",
  doctorDataset: "woundsense_doctor_dataset",
  selectedPatient: "woundsense_selected_patient",
  dataMode: "woundsense_data_mode",
  patientAppointments: "woundsense_patient_appointments",
  patientChatContacts: "woundsense_patient_chat_contacts",
  patientChatThreads: "woundsense_patient_chat_threads",
} as const;

export const text = (th: string, en: string): LocalizedText => ({ th, en });

export const DEFAULT_DOCTOR_ID = "D001";
export const DEFAULT_CHW_ID = "CHW001";
export const DEFAULT_CLINIC_ID = "C001";

const DFUTISSUE_TEST_IMAGE_BASE =
  "https://raw.githubusercontent.com/uwm-bigdata/DFUTissueSegNet/main/DFUTissue/Labeled/Original/Images/Test";
const DFUTISSUE_TEST_MASK_BASE =
  "https://raw.githubusercontent.com/uwm-bigdata/DFUTissueSegNet/main/DFUTissue/Labeled/Original/Annotations/Test";

const dfuImage = (id: string) => `${DFUTISSUE_TEST_IMAGE_BASE}/${id}.png`;
const dfuMask = (id: string) => `${DFUTISSUE_TEST_MASK_BASE}/${id}.png`;

const datasetReason = text(
  "Phase นี้เป็นการจำลองจาก label ของ dataset เพื่อทดสอบระบบ ไม่ใช่ระยะจริงที่แพทย์ยืนยัน",
  "This phase is derived from dataset labels for prototype testing. It is not a doctor-confirmed clinical stage.",
);

export const ROLE_COPY: Record<
  RoleId,
  { title: LocalizedText; short: LocalizedText; description: LocalizedText }
> = {
  patient: {
    title: text("ระบบผู้ป่วย", "Patient System"),
    short: text("ผู้ป่วย", "Patient"),
    description: text(
      "สำหรับผู้ป่วยที่ต้องการถ่ายรูปแผล ดูผล AI เบื้องต้น รับการแจ้งเตือน และติดตามผลการรักษา",
      "For patients who want to take wound photos, view preliminary AI results, receive reminders, and track treatment progress.",
    ),
  },
  doctor: {
    title: text("ระบบแพทย์", "Doctor System"),
    short: text("แพทย์", "Doctor"),
    description: text(
      "สำหรับแพทย์ในการติดตามผู้ป่วย ดูผล AI แก้ไขผล AI บันทึกข้อมูลคลินิก และดูแนวโน้มการรักษา",
      "For doctors to monitor patients, review AI results, correct AI results, record clinic data, and track treatment progress.",
    ),
  },
  chw: {
    title: text("ระบบ รพ.สต. / อสม.", "Primary Care / CHW System"),
    short: text("รพ.สต.", "Primary Care"),
    description: text(
      "สำหรับ อสม. พยาบาลอนามัย หรือเจ้าหน้าที่ รพ.สต. ในการติดตามผู้ป่วย บันทึกข้อมูล ส่งเคสให้แพทย์ และดูคำตอบจากแพทย์",
      "For community health workers, primary care nurses, or primary care staff to monitor patients, record visits, send cases to doctors, and view doctor responses.",
    ),
  },
};

export const THEME_COPY: Record<
  ThemeId,
  { title: LocalizedText; description: LocalizedText }
> = {
  medical_clean: {
    title: text("Medical Clean", "Medical Clean"),
    description: text(
      "พื้นหลังขาว โทนน้ำเงินและเขียวอมฟ้า ให้ความรู้สึกสะอาดและน่าเชื่อถือ",
      "White background with blue and teal accents for a clean hospital feel.",
    ),
  },
  community_care: {
    title: text("Community Care", "Community Care"),
    description: text(
      "โทนเขียวอ่อน เป็นมิตรสำหรับ อสม. และ รพ.สต. ใช้งานง่าย",
      "Soft green, calm, and friendly for community care workflows.",
    ),
  },
  doctor_dark: {
    title: text("Doctor Dark Dashboard", "Doctor Dark Dashboard"),
    description: text(
      "โหมดมืด คอนทราสต์สูง เหมาะกับแดชบอร์ดแพทย์และงานข้อมูล",
      "Dark, high-contrast dashboard styling for doctor and admin work.",
    ),
  },
};

export const PHASE_COPY: Record<
  ClinicalPhase,
  {
    number: number;
    label: LocalizedText;
    meaning: LocalizedText;
    recommendation: LocalizedText;
  }
> = {
  phase1: {
    number: 1,
    label: text("เฝ้าระวัง", "Watch"),
    meaning: text(
      "ยังไม่พบสัญญาณอันตรายชัดเจนจากข้อมูลตัวอย่าง",
      "No clear danger signs are shown in this sample information.",
    ),
    recommendation: text(
      "ติดตามแผลต่อ ถ่ายรูปซ้ำตามเวลาที่กำหนด และสังเกตการเปลี่ยนแปลงของแผล",
      "Continue monitoring and take follow-up photos as scheduled.",
    ),
  },
  phase2: {
    number: 2,
    label: text("เริ่มน่ากังวล", "Concerning"),
    meaning: text(
      "มีลักษณะบางอย่างที่ควรติดตามใกล้ชิดขึ้น",
      "Some signs should be monitored more closely.",
    ),
    recommendation: text(
      "ควรติดตามใกล้ชิดมากขึ้น และให้ อสม. พยาบาลอนามัย หรือเจ้าหน้าที่ รพ.สต. ช่วยประเมินแผล",
      "Monitor more closely and ask a community health worker, primary care nurse, or primary care staff to assess the wound.",
    ),
  },
  phase3: {
    number: 3,
    label: text("เสี่ยงสูง", "High Risk"),
    meaning: text(
      "มีสัญญาณที่บ่งบอกว่าแผลอาจแย่ลง",
      "There are signs that the wound may be worsening.",
    ),
    recommendation: text(
      "ควรพบแพทย์ที่คลินิกในเครือ หรือให้เจ้าหน้าที่ รพ.สต. ส่งต่อเพื่อประเมินเพิ่มเติม",
      "Consider visiting a partner clinic or asking primary care staff to refer the case for further assessment.",
    ),
  },
  phase4: {
    number: 4,
    label: text("อันตรายมาก", "Very Dangerous"),
    meaning: text(
      "อาจมีสัญญาณรุนแรง เช่น หนอง กลิ่นผิดปกติ ปวดมาก หรือสงสัยแผลลึก",
      "Serious signs may be present, such as pus, unusual odor, severe pain, or suspected deep wound.",
    ),
    recommendation: text(
      "ควรพบแพทย์โดยเร็ว เพราะมีสัญญาณที่ควรได้รับการประเมินเพิ่มเติม",
      "Please see a doctor soon because there are signs that require further assessment.",
    ),
  },
  phase5: {
    number: 5,
    label: text("ภาวะคุกคามเท้า", "Limb-Threatening"),
    meaning: text(
      "อาจมีสัญญาณฉุกเฉินหรือเสี่ยงต่อภาวะแทรกซ้อนรุนแรง",
      "Emergency signs or risk of serious complications may be present.",
    ),
    recommendation: text(
      "ควรส่งต่อโรงพยาบาลหรือพบแพทย์อย่างเร่งด่วน เพื่อป้องกันการลุกลามของแผล",
      "Seek hospital referral or urgent medical care to prevent wound progression.",
    ),
  },
};

export const RISK_COPY: Record<
  RiskLevel,
  { label: LocalizedText; helper: LocalizedText }
> = {
  low: {
    label: text("ต่ำ", "Low"),
    helper: text(
      "ติดตามแผลต่อ ถ่ายรูปแผลซ้ำตามกำหนด และดูแลแผลตามคำแนะนำของเจ้าหน้าที่",
      "Continue wound monitoring, take scheduled wound photos, and follow healthcare staff advice.",
    ),
  },
  medium: {
    label: text("ปานกลาง", "Medium"),
    helper: text(
      "ควรให้ อสม. พยาบาลอนามัย หรือเจ้าหน้าที่ รพ.สต. ช่วยดูแผล และติดตามอาการต่อเนื่อง",
      "Ask a community health worker, primary care nurse, or primary care staff to check the wound and continue follow-up.",
    ),
  },
  high: {
    label: text("สูง", "High"),
    helper: text(
      "ควรพบแพทย์หรือห้องทำแผลเพื่อประเมินเพิ่มเติม",
      "Please visit a doctor or wound care room for further assessment.",
    ),
  },
  urgent: {
    label: text("เร่งด่วน", "Urgent"),
    helper: text(
      "ควรพบแพทย์หรือส่งต่อโรงพยาบาลโดยเร็ว",
      "Please see a doctor or seek hospital referral as soon as possible.",
    ),
  },
};

export const VISIT_TYPE_COPY: Record<AssessmentRecord["visitType"], LocalizedText> = {
  clinic: text("คลินิก", "Clinic"),
  rhpc: text("รพ.สต.", "Primary care unit"),
  home: text("เยี่ยมบ้าน", "Home visit"),
  self: text("ผู้ป่วยบันทึกเอง", "Self record"),
};

export const REVIEW_STATUS_COPY: Record<AssessmentRecord["reviewStatus"], LocalizedText> = {
  pending: text("รอแพทย์ตรวจ", "Pending review"),
  confirmed: text("แพทย์ยืนยันแล้ว", "Confirmed"),
  corrected: text("แพทย์แก้ไขแล้ว", "Corrected"),
};

export const SOURCE_CHANNEL_COPY: Record<Patient["sourceChannel"], LocalizedText> = {
  online: text("ผู้ป่วยใช้งานเอง", "Patient self-use"),
  chw: text("อสม. ส่งเคส", "CHW referral"),
  clinic: text("คลินิก", "Clinic"),
  rhpc: text("รพ.สต.", "Primary care unit"),
};

export const SENSATION_STATUS_COPY: Record<SensationStatus, LocalizedText> = {
  no_pain_reduced_feeling: text("ไม่ปวด / ไม่ค่อยรู้สึก", "No pain / reduced feeling"),
  numbness: text("ชา", "Numbness"),
  mild_pain: text("ปวดเล็กน้อย", "Mild pain"),
  moderate_pain: text("ปวดปานกลาง", "Moderate pain"),
  severe_pain: text("ปวดมาก", "Severe pain"),
  burning_tingling: text("แสบร้อน / เจ็บจี๊ด", "Burning / tingling pain"),
  pain_walking: text("ปวดเวลาเดิน", "Pain while walking"),
  pain_at_rest: text("ปวดแม้อยู่นิ่ง ๆ", "Pain even at rest"),
};

export function normalizeCitizenId(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCitizenId(value: string) {
  const digits = normalizeCitizenId(value);
  if (digits.length >= 13) {
    return `${digits[0]}-${digits.slice(1, 5)}-xxxxx-${digits.slice(10, 12)}-${digits[12]}`;
  }
  return "x-xxxx-xxxxx-xx-x";
}

export function calculateClinicalPhase(record: {
  fever?: boolean;
  pus?: boolean;
  odor?: boolean;
  blackTissue?: boolean;
  woundSpreading?: boolean;
  coldOrDarkFoot?: boolean;
  visibleBone?: boolean;
  suspectedDeepWound?: boolean;
  woundDurationDays: number;
  riskLevel: RiskLevel;
  redness?: boolean;
  swelling?: boolean;
  sensationStatus?: SensationStatus;
  painScore?: number | null;
  hasNumbness?: boolean;
  reducedSensation?: boolean;
  burningTinglingPain?: boolean;
  painWhileWalking?: boolean;
  painAtRest?: boolean;
  fibrinPercent: number;
  callusPercent: number;
  numbness?: boolean;
}): ClinicalPhase {
  const painScore = record.painScore ?? 0;
  const hasNumbness =
    Boolean(record.hasNumbness || record.numbness || record.sensationStatus === "numbness");
  const reducedSensation = Boolean(
    record.reducedSensation || record.sensationStatus === "no_pain_reduced_feeling",
  );
  const burningTinglingPain = Boolean(
    record.burningTinglingPain || record.sensationStatus === "burning_tingling",
  );
  const painWhileWalking = Boolean(
    record.painWhileWalking || record.sensationStatus === "pain_walking",
  );
  const painAtRest = Boolean(record.painAtRest || record.sensationStatus === "pain_at_rest");

  if (
    (record.fever && record.pus) ||
    (record.fever && record.odor) ||
    (record.blackTissue && record.woundSpreading) ||
    record.coldOrDarkFoot ||
    record.visibleBone ||
    (record.suspectedDeepWound && record.fever)
  ) {
    return "phase5";
  }

  if (
    record.pus ||
    record.odor ||
    painScore >= 8 ||
    (painAtRest && record.woundDurationDays > 7) ||
    record.blackTissue ||
    record.suspectedDeepWound ||
    (record.woundDurationDays >= 30 &&
      (record.riskLevel === "high" || record.riskLevel === "urgent"))
  ) {
    return "phase4";
  }

  if (
    (record.redness && record.swelling) ||
    (painScore >= 6 && painScore <= 7) ||
    painWhileWalking ||
    (burningTinglingPain && record.woundDurationDays > 14) ||
    (hasNumbness && record.woundDurationDays > 7) ||
    (reducedSensation && record.woundDurationDays > 7) ||
    record.fibrinPercent > 45 ||
    record.callusPercent > 40 ||
    record.woundDurationDays > 14
  ) {
    return "phase3";
  }

  if (
    record.fibrinPercent > 30 ||
    record.callusPercent > 25 ||
    (painScore >= 4 && painScore <= 5) ||
    record.sensationStatus === "numbness" ||
    (record.sensationStatus === "no_pain_reduced_feeling" &&
      record.woundDurationDays > 7) ||
    record.redness ||
    record.swelling ||
    (record.woundDurationDays >= 7 && record.woundDurationDays <= 14)
  ) {
    return "phase2";
  }

  return "phase1";
}

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: DEFAULT_DOCTOR_ID,
    name: "นพ.กิตติ วราเวช",
    specialty: text("เวชศาสตร์ครอบครัวและแผลเบาหวาน", "Family medicine and diabetic wound care"),
    clinicId: DEFAULT_CLINIC_ID,
  },
];

export const MOCK_CHWS: CommunityHealthWorker[] = [
  {
    id: DEFAULT_CHW_ID,
    name: "อสม.มาลี",
    area: text("รพ.สต.บ้านใหม่", "Ban Mai primary care unit"),
    phone: "000-333-4401",
  },
];

export const MOCK_CLINIC_PARTNERS: ClinicPartner[] = [
  {
    id: DEFAULT_CLINIC_ID,
    name: "WoundCare Clinic Chiangmai",
    type: "clinic",
    usesDiaWoundTrack: true,
    distanceKm: 1.8,
    phone: "000-111-2201",
    address: text("ถนนสุขภาพ ตำบลช้างเผือก", "Sukkhaphap Road, Chang Phueak"),
    openingHours: text("จันทร์-ศุกร์ 08:30-17:00", "Mon-Fri 08:30-17:00"),
  },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "P001",
    patientCode: "P001",
    citizenIdMock: "1111111111111",
    citizenIdMasked: "1-1111-xxxxx-11-1",
    age: 62,
    gender: text("ชาย", "Male"),
    diabetesYears: 12,
    underlyingDisease: text("เบาหวานชนิดที่ 2", "Type 2 diabetes"),
    woundLocation: text("ฝ่าเท้า", "Sole"),
    carePath: "doctor",
    assignedDoctor: DEFAULT_DOCTOR_ID,
    assignedCHW: null,
    preferredClinicId: DEFAULT_CLINIC_ID,
    mainWoundImageUrl: dfuImage("0914"),
    mainWoundMaskUrl: dfuMask("0914"),
    sourceChannel: "clinic",
    createdAt: "2026-07-01",
  },
  {
    id: "P002",
    patientCode: "P002",
    citizenIdMock: "2222222222222",
    citizenIdMasked: "2-2222-xxxxx-22-2",
    age: 58,
    gender: text("หญิง", "Female"),
    diabetesYears: 9,
    underlyingDisease: text("เบาหวานชนิดที่ 2", "Type 2 diabetes"),
    woundLocation: text("นิ้วเท้า", "Toe"),
    carePath: "doctor",
    assignedDoctor: DEFAULT_DOCTOR_ID,
    assignedCHW: null,
    preferredClinicId: DEFAULT_CLINIC_ID,
    mainWoundImageUrl: dfuImage("0925"),
    mainWoundMaskUrl: dfuMask("0925"),
    sourceChannel: "clinic",
    createdAt: "2026-07-01",
  },
  {
    id: "P003",
    patientCode: "P003",
    citizenIdMock: "3333333333333",
    citizenIdMasked: "3-3333-xxxxx-33-3",
    age: 67,
    gender: text("ชาย", "Male"),
    diabetesYears: 15,
    underlyingDisease: text("เบาหวานและปลายประสาทเสื่อม", "Diabetes with neuropathy"),
    woundLocation: text("ส้นเท้า", "Heel"),
    carePath: "chw",
    assignedDoctor: null,
    assignedCHW: DEFAULT_CHW_ID,
    preferredClinicId: null,
    mainWoundImageUrl: dfuImage("0927"),
    mainWoundMaskUrl: dfuMask("0927"),
    sourceChannel: "chw",
    createdAt: "2026-07-01",
  },
  {
    id: "P004",
    patientCode: "P004",
    citizenIdMock: "4444444444444",
    citizenIdMasked: "4-4444-xxxxx-44-4",
    age: 71,
    gender: text("หญิง", "Female"),
    diabetesYears: 18,
    underlyingDisease: text("เบาหวานและความดันโลหิตสูง", "Diabetes and hypertension"),
    woundLocation: text("หลังเท้า", "Dorsum of foot"),
    carePath: "chw",
    assignedDoctor: null,
    assignedCHW: DEFAULT_CHW_ID,
    preferredClinicId: null,
    mainWoundImageUrl: dfuImage("0935"),
    mainWoundMaskUrl: dfuMask("0935"),
    sourceChannel: "rhpc",
    createdAt: "2026-07-01",
  },
  {
    id: "P005",
    patientCode: "P005",
    citizenIdMock: "5555555555555",
    citizenIdMasked: "5-5555-xxxxx-55-5",
    age: 64,
    gender: text("ชาย", "Male"),
    diabetesYears: 10,
    underlyingDisease: text("เบาหวานชนิดที่ 2", "Type 2 diabetes"),
    woundLocation: text("ฝ่าเท้า", "Sole"),
    carePath: "chw",
    assignedDoctor: null,
    assignedCHW: DEFAULT_CHW_ID,
    preferredClinicId: null,
    mainWoundImageUrl: dfuImage("0961"),
    mainWoundMaskUrl: dfuMask("0961"),
    sourceChannel: "chw",
    createdAt: "2026-07-01",
  },
];

export function getDoctorPatients(doctorId: string, patients: Patient[] = MOCK_PATIENTS) {
  return patients.filter(
    (patient) => patient.carePath === "doctor" && patient.assignedDoctor === doctorId,
  );
}

export function getCHWPatients(chwId: string, patients: Patient[] = MOCK_PATIENTS) {
  return patients.filter(
    (patient) => patient.carePath === "chw" && patient.assignedCHW === chwId,
  );
}

export function getPatientById(patientId: string, patients: Patient[] = MOCK_PATIENTS) {
  return patients.find((patient) => patient.id === patientId);
}

export function getDoctorConsultationCases(
  _doctorId: string,
  cases: CHWConsultationCase[] = MOCK_CHW_CONSULTATION_CASES,
) {
  return cases;
}

export function getCHWConsultationCases(
  chwId: string,
  cases: CHWConsultationCase[] = MOCK_CHW_CONSULTATION_CASES,
) {
  return cases.filter((caseItem) => caseItem.chwId === chwId);
}
function patientById(id: string) {
  const patient = MOCK_PATIENTS.find((item) => item.id === id);
  if (!patient) throw new Error(`Missing mock patient ${id}`);
  return patient;
}

type AssessmentInput = Omit<
  AssessmentRecord,
  | "clinicalPhaseLabel"
  | "recommendation"
  | "sensationStatus"
  | "hasNumbness"
  | "reducedSensation"
  | "burningTinglingPain"
  | "painWhileWalking"
  | "painAtRest"
> &
  Partial<
    Pick<
      AssessmentRecord,
      | "sensationStatus"
      | "hasNumbness"
      | "reducedSensation"
      | "burningTinglingPain"
      | "painWhileWalking"
      | "painAtRest"
    >
  >;

function inferSensationStatus(input: {
  sensationStatus?: SensationStatus;
  painScore?: number | null;
  numbness?: boolean;
}): SensationStatus {
  if (input.sensationStatus) return input.sensationStatus;
  if (input.numbness) return "numbness";
  const painScore = input.painScore ?? 0;
  if (painScore >= 8) return "severe_pain";
  if (painScore >= 6) return "moderate_pain";
  if (painScore >= 1) return "mild_pain";
  return "no_pain_reduced_feeling";
}

function makeAssessment(input: AssessmentInput): AssessmentRecord {
  const sensationStatus = inferSensationStatus(input);
  return {
    ...input,
    sensationStatus,
    painScore: input.painScore ?? null,
    hasNumbness: input.hasNumbness ?? Boolean(input.numbness || sensationStatus === "numbness"),
    reducedSensation:
      input.reducedSensation ?? sensationStatus === "no_pain_reduced_feeling",
    burningTinglingPain:
      input.burningTinglingPain ?? sensationStatus === "burning_tingling",
    painWhileWalking: input.painWhileWalking ?? sensationStatus === "pain_walking",
    painAtRest: input.painAtRest ?? sensationStatus === "pain_at_rest",
    clinicalPhaseLabel: PHASE_COPY[input.clinicalPhase].label,
    recommendation: PHASE_COPY[input.clinicalPhase].recommendation,
  };
}

function assessmentSeed(
  id: string,
  patientId: string,
  partial: Omit<
    AssessmentInput,
    | "id"
    | "patientId"
    | "patientCode"
    | "citizenIdMasked"
  >,
): AssessmentRecord {
  const patient = patientById(patientId);
  return makeAssessment({
    id,
    patientId,
    patientCode: patient.patientCode,
    citizenIdMasked: patient.citizenIdMasked,
    ...partial,
  });
}

const datasetAssessmentFields = {
  isRealDatasetImage: true,
  isClinicalPhaseGroundTruth: false,
  datasetName: "DFUTissueSegNet / DFUTissue Dataset" as const,
  sourceUrl: "https://github.com/uwm-bigdata/DFUTissueSegNet",
  paperUrl: "https://arxiv.org/abs/2406.16012",
  realTissueLabels: [] as AssessmentRecord["realTissueLabels"],
  primaryTissueLabel: "label_pending" as const,
  derivedPhaseReason: datasetReason,
};

function assessmentForPatient(
  id: string,
  patientId: string,
  imageId: string,
  partial: Omit<
    AssessmentInput,
    | "id"
    | "patientId"
    | "patientCode"
    | "citizenIdMasked"
    | "imageDataUrl"
    | "granulationPercent"
    | "fibrinPercent"
    | "callusPercent"
    | "necroticPercent"
    | "datasetSampleId"
    | "derivedPrototypePhase"
    | "isRealDatasetImage"
    | "isClinicalPhaseGroundTruth"
    | "datasetName"
    | "sourceUrl"
    | "paperUrl"
    | "realTissueLabels"
    | "primaryTissueLabel"
    | "derivedPhaseReason"
  >,
): AssessmentRecord {
  return assessmentSeed(id, patientId, {
    ...partial,
    imageDataUrl: dfuImage(imageId),
    granulationPercent: 0,
    fibrinPercent: 0,
    callusPercent: 0,
    necroticPercent: 0,
    datasetSampleId: `dfu-test-${imageId}`,
    derivedPrototypePhase: partial.clinicalPhase,
    ...datasetAssessmentFields,
  });
}

export const MOCK_ASSESSMENTS: AssessmentRecord[] = [
  assessmentForPatient("assessment-P001-main", "P001", "0914", {
    createdByRole: "doctor",
    visitType: "clinic",
    woundLocation: text("ฝ่าเท้า", "Sole"),
    woundDurationDays: 3,
    sensationStatus: "no_pain_reduced_feeling",
    painScore: null,
    hasNumbness: true,
    reducedSensation: true,
    redness: false,
    swelling: false,
    pus: false,
    odor: false,
    fever: false,
    numbness: true,
    note: text(
      "ผู้ป่วยมีอาการชาบริเวณเท้า แพทย์เริ่มติดตามแผลรายวัน",
      "Patient has reduced foot sensation. Doctor starts daily wound follow-up.",
    ),
    aiConfidence: 74,
    riskLevel: "low",
    clinicalPhase: "phase1",
    reviewStatus: "confirmed",
    doctorNote: text("ยืนยันเป็นเคสติดตามใน prototype", "Confirmed as a monitoring case in the prototype."),
    createdAt: "2026-07-08T09:00:00+07:00",
  }),
  assessmentForPatient("assessment-P002-main", "P002", "0925", {
    createdByRole: "doctor",
    visitType: "clinic",
    woundLocation: text("นิ้วเท้า", "Toe"),
    woundDurationDays: 6,
    sensationStatus: "mild_pain",
    painScore: 3,
    hasNumbness: false,
    reducedSensation: false,
    redness: true,
    swelling: false,
    pus: false,
    odor: false,
    fever: false,
    note: text(
      "แพทย์แก้ไขผล AI และนัดติดตามผล",
      "Doctor corrected the AI result and scheduled follow-up.",
    ),
    aiConfidence: 78,
    riskLevel: "medium",
    clinicalPhase: "phase2",
    reviewStatus: "corrected",
    doctorNote: text("ปรับผลเป็น Phase 2 เพื่อทดสอบ flow การแก้ไข", "Adjusted to Phase 2 for correction-flow testing."),
    treatmentAdvice: text("นัดติดตามและลดแรงกดบริเวณนิ้วเท้า", "Follow up and reduce pressure around the toe."),
    createdAt: "2026-07-08T10:00:00+07:00",
    updatedAt: "2026-07-08T10:20:00+07:00",
  }),
  assessmentForPatient("assessment-P003-main", "P003", "0927", {
    createdByRole: "chw",
    visitType: "rhpc",
    woundLocation: text("ส้นเท้า", "Heel"),
    woundDurationDays: 9,
    sensationStatus: "numbness",
    painScore: 0,
    hasNumbness: true,
    reducedSensation: true,
    redness: true,
    swelling: true,
    pus: false,
    odor: false,
    fever: false,
    numbness: true,
    note: text(
      "อสม.ส่งเคสให้แพทย์ช่วยดู เนื่องจากผู้ป่วยไม่ปวดแต่มีแผลชัด",
      "CHW sent this case for doctor review because the patient has no pain but a visible wound.",
    ),
    chwNote: text(
      "อสม.ส่งเคสให้แพทย์ช่วยดู เนื่องจากผู้ป่วยไม่ปวดแต่มีแผลชัด",
      "CHW sent this case for doctor review because the patient has no pain but a visible wound.",
    ),
    aiConfidence: 82,
    riskLevel: "high",
    clinicalPhase: "phase3",
    reviewStatus: "pending",
    createdAt: "2026-07-08T11:00:00+07:00",
  }),
  assessmentForPatient("assessment-P004-main", "P004", "0935", {
    createdByRole: "chw",
    visitType: "rhpc",
    woundLocation: text("หลังเท้า", "Dorsum of foot"),
    woundDurationDays: 12,
    sensationStatus: "pain_walking",
    painScore: 6,
    hasNumbness: false,
    reducedSensation: false,
    redness: true,
    swelling: true,
    pus: false,
    odor: true,
    fever: false,
    note: text(
      "อสม.พบว่าแผลควรได้รับการประเมินเพิ่มเติม",
      "CHW found the wound should receive further assessment.",
    ),
    chwNote: text(
      "อสม.พบว่าแผลควรได้รับการประเมินเพิ่มเติม",
      "CHW found the wound should receive further assessment.",
    ),
    aiConfidence: 84,
    riskLevel: "urgent",
    clinicalPhase: "phase4",
    reviewStatus: "pending",
    createdAt: "2026-07-08T12:00:00+07:00",
  }),
  assessmentForPatient("assessment-P005-main", "P005", "0961", {
    createdByRole: "chw",
    visitType: "home",
    woundLocation: text("ฝ่าเท้า", "Sole"),
    woundDurationDays: 15,
    sensationStatus: "no_pain_reduced_feeling",
    painScore: 0,
    hasNumbness: true,
    reducedSensation: true,
    redness: true,
    swelling: true,
    pus: true,
    odor: true,
    fever: false,
    numbness: true,
    note: text(
      "ผู้ป่วยไม่ปวดแต่มีลักษณะแผลที่ระบบจัดเป็นเคสเร่งด่วนใน prototype",
      "Patient has no pain, but the prototype marks this wound flow as urgent.",
    ),
    chwNote: text(
      "ผู้ป่วยไม่ปวดแต่มีลักษณะแผลที่ระบบจัดเป็นเคสเร่งด่วนใน prototype",
      "Patient has no pain, but the prototype marks this wound flow as urgent.",
    ),
    aiConfidence: 88,
    riskLevel: "urgent",
    clinicalPhase: "phase5",
    reviewStatus: "pending",
    createdAt: "2026-07-08T13:00:00+07:00",
  }),
];

export const MOCK_CORRECTIONS: DoctorCorrection[] = [
  {
    id: "correction-P002-main",
    patientId: "P002",
    assessmentId: "assessment-P002-main",
    correctedBy: DEFAULT_DOCTOR_ID,
    originalAiPhase: "phase1",
    correctedClinicalPhase: "phase2",
    originalRiskLevel: "low",
    correctedRiskLevel: "medium",
    originalGranulationPercent: 0,
    originalFibrinPercent: 0,
    originalCallusPercent: 0,
    originalNecroticPercent: 0,
    correctedGranulationPercent: 0,
    correctedFibrinPercent: 0,
    correctedCallusPercent: 0,
    correctedNecroticPercent: 0,
    doctorNote: text(
      "แพทย์แก้ไขผล AI และนัดติดตามผล",
      "Doctor corrected the AI result and scheduled follow-up.",
    ),
    treatmentAdvice: text("ติดตามแผลและลดแรงกด", "Monitor the wound and reduce pressure."),
    notifyPatient: true,
    createdAt: "2026-07-08T10:20:00+07:00",
  },
];

const consultationCase = (
  patientId: "P003" | "P004" | "P005",
  assessmentId: string,
  imageId: string,
  status: CHWConsultationCase["status"],
): CHWConsultationCase => {
  const patient = patientById(patientId);
  const assessment = MOCK_ASSESSMENTS.find((record) => record.id === assessmentId);
  if (!assessment) throw new Error(`Missing consultation assessment ${assessmentId}`);
  return {
    id: `consult-${patientId}`,
    patientId: patient.id,
    patientCode: patient.patientCode,
    citizenIdMasked: patient.citizenIdMasked,
    chwId: DEFAULT_CHW_ID,
    chwName: MOCK_CHWS[0].name,
    rhpcName: "รพ.สต.บ้านใหม่",
    assessmentId,
    woundImageUrl: dfuImage(imageId),
    aiPhase: assessment.clinicalPhase,
    aiRiskLevel: assessment.riskLevel,
    chwNote: assessment.chwNote?.th ?? assessment.note.th,
    status,
    createdAt: assessment.createdAt,
  };
};

export const MOCK_CHW_CONSULTATION_CASES: CHWConsultationCase[] = [
  consultationCase("P003", "assessment-P003-main", "0927", "pending"),
  consultationCase("P004", "assessment-P004-main", "0935", "pending"),
  consultationCase("P005", "assessment-P005-main", "0961", "urgent"),
];

export const MOCK_DAILY_REMINDERS: DailyReminder[] = [
  {
    id: "reminder-P001",
    patientId: "P001",
    frequency: "daily",
    reminderTime: "08:00",
    active: true,
    missedDays: 0,
    streakDays: 3,
    createdAt: "2026-07-08T08:00:00+07:00",
  },
  {
    id: "reminder-P003",
    patientId: "P003",
    frequency: "daily",
    reminderTime: "18:00",
    active: true,
    missedDays: 1,
    streakDays: 2,
    createdAt: "2026-07-08T18:00:00+07:00",
  },
  {
    id: "reminder-P005",
    patientId: "P005",
    frequency: "doctor_defined",
    reminderTime: "07:30",
    active: true,
    missedDays: 2,
    streakDays: 0,
    createdAt: "2026-07-08T07:30:00+07:00",
  },
];
export const MOCK_DATASET_ENTRIES: DoctorDatasetEntry[] = [
  {
    id: "dataset-entry-001",
    imageDataUrl: "mock-dataset-1",
    sourceType: "dfutissue_reference",
    externalDatasetName: "DFUTissueSegNet / DFUTissue Dataset",
    externalDatasetUrl: "https://github.com/uwm-bigdata/DFUTissueSegNet",
    woundType: "diabetic_foot",
    woundLocation: "sole",
    mainLabel: "granulation",
    severityLevel: "moderate",
    clinicalPhase: "phase2",
    limbThreatLevel: "moderate",
    description: text(
      "รายการอ้างอิงสำหรับทดสอบหน้าจอการจัดการข้อมูล",
      "Reference entry for testing dataset management screens.",
    ),
    doctorNote: text(
      "ใช้เพื่อเทียบคำอธิบายเนื้อเยื่อใน prototype",
      "Used to compare tissue-label wording in the prototype.",
    ),
    addedBy: "นพ.กิตติ วรเวช",
    createdAt: "2026-06-20T10:00:00+07:00",
  },
  {
    id: "dataset-entry-002",
    imageDataUrl: "mock-dataset-2",
    sourceType: "doctor_added",
    woundType: "diabetic_foot",
    woundLocation: "heel",
    mainLabel: "fibrin",
    severityLevel: "moderate",
    clinicalPhase: "phase3",
    limbThreatLevel: "high",
    description: text(
      "ข้อมูลตัวอย่างจากคลินิกเพื่อทดสอบการกรอกโดยแพทย์",
      "Sample clinic data to test doctor-entered references.",
    ),
    doctorNote: text(
      "ควรใช้เป็นข้อมูลจำลองเท่านั้นในเวอร์ชันนี้",
      "Use as mock-only data in this version.",
    ),
    addedBy: "พญ.ลลิตา ศุภกิจ",
    createdAt: "2026-07-02T11:00:00+07:00",
  },
  {
    id: "dataset-entry-003",
    imageDataUrl: "mock-dataset-3",
    sourceType: "community_field",
    woundType: "chronic_wound",
    woundLocation: "toe",
    mainLabel: "callus",
    severityLevel: "mild",
    clinicalPhase: "phase1",
    limbThreatLevel: "low",
    description: text(
      "ภาพตัวอย่างจากงานเยี่ยมชุมชน",
      "Sample image from a community visit workflow.",
    ),
    doctorNote: text(
      "รอแพทย์ยืนยันป้ายกำกับก่อนใช้ต่อยอด",
      "Waiting for doctor label confirmation before future use.",
    ),
    addedBy: "อสม.สมพร",
    createdAt: "2026-07-05T16:00:00+07:00",
  },
];


