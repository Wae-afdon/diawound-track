export type Language = "th" | "en";

export type RoleId = "patient" | "doctor" | "chw";

export type ThemeId = "medical_clean" | "community_care" | "doctor_dark";

export type RiskLevel = "low" | "medium" | "high" | "urgent";

export type DataMode = "mock" | "real_dataset_preview";

export type ClinicalPhase =
  | "phase1"
  | "phase2"
  | "phase3"
  | "phase4"
  | "phase5";

export type SensationStatus =
  | "no_pain_reduced_feeling"
  | "numbness"
  | "mild_pain"
  | "moderate_pain"
  | "severe_pain"
  | "burning_tingling"
  | "pain_walking"
  | "pain_at_rest";

export type DFUTissueLabel =
  | "granulation"
  | "fibrin"
  | "callus"
  | "necrotic"
  | "eschar"
  | "neodermis"
  | "tendon"
  | "dressing"
  | "label_pending";

export type ReviewStatus = "pending" | "confirmed" | "corrected";

export type SourceChannel = "online" | "chw" | "clinic" | "rhpc";

export type VisitType = "clinic" | "rhpc" | "home" | "self";

export type CarePath = "doctor" | "chw";

export type CHWConsultationStatus = "pending" | "reviewed" | "referred" | "urgent";

export type PatientPage =
  | "patientHome"
  | "patientOnboarding"
  | "patientPhoto"
  | "patientAiResult"
  | "patientAppointments"
  | "patientOwnProfile"
  | "patientChat"
  | "partnerClinics"
  | "contactChw"
  | "dailyReminder"
  | "patientProgress"
  | "notifications"
  | "emergency"
  | "settings";

export type DoctorPage =
  | "doctorDashboard"
  | "doctorSearch"
  | "doctorChwCases"
  | "patientProfile"
  | "clinicInterview"
  | "aiPendingReview"
  | "aiCorrection"
  | "doctorProgress"
  | "addPatient"
  | "datasetReference"
  | "realDatasetSamples"
  | "doctorDataset"
  | "partnerClinicManagement"
  | "roleSettings"
  | "notifications"
  | "emergency"
  | "settings";

export type ChwPage =
  | "chwDashboard"
  | "chwSearch"
  | "addCommunityVisit"
  | "uploadWoundPhoto"
  | "sendDoctorReview"
  | "communityPatientList"
  | "notifications"
  | "emergency"
  | "settings";

export type AppPage = PatientPage | DoctorPage | ChwPage;

export type LocalizedText = {
  th: string;
  en: string;
};

export type Patient = {
  id: string;
  patientCode: string;
  citizenIdMock: string;
  citizenIdMasked: string;
  age: number;
  gender: LocalizedText;
  diabetesYears?: number;
  underlyingDisease?: LocalizedText;
  woundLocation: LocalizedText;
  carePath: CarePath;
  assignedDoctor?: string | null;
  assignedCHW?: string | null;
  preferredClinicId?: string | null;
  mainWoundImageUrl?: string;
  mainWoundMaskUrl?: string;
  sourceChannel: SourceChannel;
  createdAt: string;
};

export type AssessmentRecord = {
  id: string;
  patientId: string;
  patientCode: string;
  citizenIdMasked: string;
  createdByRole: RoleId | "admin";
  visitType: VisitType;
  woundLocation: LocalizedText;
  woundDurationDays: number;
  sensationStatus: SensationStatus;
  painScore?: number | null;
  hasNumbness: boolean;
  reducedSensation: boolean;
  burningTinglingPain: boolean;
  painWhileWalking: boolean;
  painAtRest: boolean;
  redness: boolean;
  swelling: boolean;
  pus: boolean;
  odor: boolean;
  fever: boolean;
  blackTissue?: boolean;
  woundSpreading?: boolean;
  coldOrDarkFoot?: boolean;
  suspectedDeepWound?: boolean;
  visibleBone?: boolean;
  numbness?: boolean;
  note: LocalizedText;
  imageDataUrl: string;
  granulationPercent: number;
  fibrinPercent: number;
  callusPercent: number;
  necroticPercent: number;
  aiConfidence: number;
  riskLevel: RiskLevel;
  clinicalPhase: ClinicalPhase;
  clinicalPhaseLabel: LocalizedText;
  recommendation: LocalizedText;
  reviewStatus: ReviewStatus;
  doctorNote?: LocalizedText;
  chwNote?: LocalizedText;
  treatmentAdvice?: LocalizedText;
  isRealDatasetImage?: boolean;
  isClinicalPhaseGroundTruth?: boolean;
  datasetSampleId?: string;
  datasetName?: "DFUTissueSegNet / DFUTissue Dataset";
  sourceUrl?: string;
  paperUrl?: string;
  realTissueLabels?: DFUTissueLabel[];
  primaryTissueLabel?: DFUTissueLabel;
  derivedPrototypePhase?: ClinicalPhase;
  derivedPhaseReason?: LocalizedText;
  createdAt: string;
  updatedAt?: string;
};

export type DoctorCorrection = {
  id: string;
  patientId: string;
  assessmentId: string;
  correctedBy: string;
  originalAiPhase: ClinicalPhase;
  correctedClinicalPhase: ClinicalPhase;
  originalRiskLevel: RiskLevel;
  correctedRiskLevel: RiskLevel;
  originalGranulationPercent: number;
  originalFibrinPercent: number;
  originalCallusPercent: number;
  originalNecroticPercent: number;
  correctedGranulationPercent: number;
  correctedFibrinPercent: number;
  correctedCallusPercent: number;
  correctedNecroticPercent: number;
  doctorNote: LocalizedText;
  treatmentAdvice: LocalizedText;
  notifyPatient: boolean;
  createdAt: string;
};

export type CHWConsultationCase = {
  id: string;
  patientId: string;
  patientCode: string;
  citizenIdMasked: string;
  chwId: string;
  chwName: string;
  rhpcName: string;
  assessmentId: string;
  woundImageUrl: string;
  aiPhase: ClinicalPhase;
  aiRiskLevel: RiskLevel;
  chwNote: string;
  doctorResponse?: string;
  doctorTreatmentAdvice?: string;
  doctorCorrectedPhase?: ClinicalPhase;
  doctorCorrectedRiskLevel?: RiskLevel;
  status: CHWConsultationStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type ClinicPartner = {
  id: string;
  name: string;
  type: "clinic" | "hospital" | "rhpc";
  usesDiaWoundTrack: boolean;
  distanceKm: number;
  phone: string;
  address: LocalizedText;
  openingHours: LocalizedText;
};

export type DailyReminder = {
  id: string;
  patientId: string;
  frequency: "daily" | "every_other_day" | "doctor_defined";
  reminderTime: string;
  active: boolean;
  missedDays: number;
  streakDays: number;
  createdAt: string;
};

export type DoctorDatasetEntry = {
  id: string;
  imageDataUrl: string;
  sourceType:
    | "dfutissue_reference"
    | "doctor_added"
    | "community_field"
    | "other";
  externalDatasetName?: string;
  externalDatasetUrl?: string;
  woundType:
    | "diabetic_foot"
    | "pressure_ulcer"
    | "chronic_wound"
    | "other";
  woundLocation: string;
  mainLabel:
    | "granulation"
    | "fibrin"
    | "callus"
    | "necrotic"
    | "eschar"
    | "dressing"
    | "other";
  severityLevel: "mild" | "moderate" | "severe";
  clinicalPhase: ClinicalPhase;
  limbThreatLevel: "low" | "moderate" | "high" | "urgent";
  description: LocalizedText;
  doctorNote: LocalizedText;
  addedBy: string;
  createdAt: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: LocalizedText;
  clinicId: string;
};

export type CommunityHealthWorker = {
  id: string;
  name: string;
  area: LocalizedText;
  phone: string;
};
