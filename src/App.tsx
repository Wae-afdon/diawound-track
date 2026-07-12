import {
  Activity,
  Ambulance,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  Edit3,
  FileText,
  HeartPulse,
  Home,
  Languages,
  LineChart as LineChartIcon,
  LogOut,
  Moon,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  SunMedium,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type {
  ChangeEvent,
  ComponentType,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer as ChartResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DATASET_SOURCES } from "./data/datasetSources";
import {
  DFUTISSUE_PHASE_COVERAGE_NOTE,
  DFUTISSUE_SAMPLE_ITEMS,
  DFUTISSUE_SAMPLE_TARGET,
  type DFUTissueSampleItem,
} from "./data/dfutissueSample";
import {
  calculateClinicalPhase,
  DEFAULT_CHW_ID,
  DEFAULT_DOCTOR_ID,
  getCHWConsultationCases,
  getCHWPatients,
  getDoctorConsultationCases,
  getDoctorPatients,
  maskCitizenId,
  MOCK_ASSESSMENTS,
  MOCK_CHWS,
  MOCK_CHW_CONSULTATION_CASES,
  MOCK_CLINIC_PARTNERS,
  MOCK_CORRECTIONS,
  MOCK_DAILY_REMINDERS,
  MOCK_DATASET_ENTRIES,
  MOCK_DOCTORS,
  MOCK_PATIENTS,
  PHASE_COPY,
  REVIEW_STATUS_COPY,
  RISK_COPY,
  ROLE_COPY,
  SENSATION_STATUS_COPY,
  SOURCE_CHANNEL_COPY,
  STORAGE_KEYS,
  text,
  THEME_COPY,
  VISIT_TYPE_COPY,
} from "./data/mockData";
import { useSupabaseSyncedArray, type SupabaseSyncState } from "./hooks/useSupabaseSyncedArray";
import { useLanguage } from "./i18n/useLanguage";
import type { TranslationKey } from "./i18n/translations";
import { isSupabaseConfigured } from "./lib/supabase";
import { assessmentService } from "./services/assessmentService";
import { clinicService } from "./services/clinicService";
import { consultationCaseService } from "./services/consultationCaseService";
import { doctorCorrectionService } from "./services/doctorCorrectionService";
import { doctorDatasetService } from "./services/doctorDatasetService";
import { patientService } from "./services/patientService";
import { reminderService } from "./services/reminderService";
import { uploadWoundImageFromDataUrl } from "./services/storageService";
import { formatSupabaseError } from "./services/supabaseRecordService";
import type {
  AppPage,
  AssessmentRecord,
  CHWConsultationCase,
  ChwPage,
  ClinicPartner,
  ClinicalPhase,
  DailyReminder,
  DataMode,
  DFUTissueLabel,
  DoctorCorrection,
  DoctorDatasetEntry,
  DoctorPage,
  Language,
  LocalizedText,
  Patient,
  PatientPage,
  RiskLevel,
  RoleId,
  SensationStatus,
  ThemeId,
} from "./types";
import { getDataMode, setDataMode as persistDataMode } from "./utils/datasetMode";
import { DERIVED_PHASE_NOTICE } from "./utils/phaseMapping";

type AppIcon = ComponentType<{ size?: number; className?: string }>;

type PatientAppointmentStatus = "active" | "request" | "cancelled" | "completed";
type PatientAppointment = {
  id: string;
  patientId: string;
  provider: "doctor" | "primary_care";
  location: "partner_clinic" | "primary_care_unit";
  date: string;
  time: string;
  reasonKey: TranslationKey;
  note: string;
  status: PatientAppointmentStatus;
  createdAt: string;
};

type PatientChatContact = {
  id: string;
  type: "doctor" | "primary_care";
  name: string;
  organization: string;
  phone: string;
  note: string;
  createdAt: string;
};

type PatientChatMessage = {
  id: string;
  sender: "patient" | "contact";
  text: string;
  createdAt: string;
};

type PatientChatThread = {
  id: string;
  contactId: string;
  messages: PatientChatMessage[];
};

const themeIds: ThemeId[] = ["medical_clean", "community_care", "doctor_dark"];
const roleIds: RoleId[] = ["patient", "doctor", "chw"];

const defaultPageByRole: Record<RoleId, AppPage> = {
  patient: "patientHome",
  doctor: "doctorDashboard",
  chw: "chwDashboard",
};

const pageTitleKey: Partial<Record<AppPage, TranslationKey>> = {
  patientHome: "patientHome",
  patientOnboarding: "onboarding",
  patientPhoto: "takeWoundPhoto",
  patientAiResult: "aiResult",
  patientAppointments: "appointments",
  patientOwnProfile: "patientOwnProfile",
  patientChat: "chat",
  partnerClinics: "partnerClinics",
  contactChw: "contactChw",
  dailyReminder: "dailyReminder",
  patientProgress: "treatmentProgress",
  doctorDashboard: "doctorDashboard",
  doctorSearch: "patientTracking",
  doctorChwCases: "chwCases",
  patientProfile: "patientProfile",
  clinicInterview: "clinicInterviewForm",
  aiPendingReview: "aiPendingReview",
  aiCorrection: "aiCorrection",
  doctorProgress: "treatmentProgress",
  addPatient: "addAnotherPatient",
  datasetReference: "datasetReference",
  realDatasetSamples: "realDatasetSamples",
  doctorDataset: "doctorDatasetManagement",
  partnerClinicManagement: "partnerClinicManagement",
  roleSettings: "userRoleSettings",
  chwDashboard: "primaryCareDashboard",
  chwSearch: "communityPatientTracking",
  addCommunityVisit: "addCommunityVisit",
  uploadWoundPhoto: "uploadWoundPhoto",
  sendDoctorReview: "sendToDoctorReview",
  communityPatientList: "communityPatientList",
  notifications: "notifications",
  emergency: "emergencyCall",
  settings: "settings",
};

const bottomNav: Record<
  RoleId,
  Array<{ page: AppPage; labelKey: TranslationKey; icon: AppIcon }>
> = {
  patient: [
    { page: "patientHome", labelKey: "home", icon: Home },
    { page: "patientAppointments", labelKey: "appointments", icon: CalendarDays },
    { page: "patientPhoto", labelKey: "camera", icon: Camera },
    { page: "emergency", labelKey: "emergency", icon: Ambulance },
    { page: "patientOwnProfile", labelKey: "profile", icon: UserRound },
  ],
  doctor: [
    { page: "doctorDashboard", labelKey: "dashboard", icon: Home },
    { page: "doctorSearch", labelKey: "search", icon: Search },
    { page: "aiPendingReview", labelKey: "aiReview", icon: Sparkles },
    { page: "doctorProgress", labelKey: "progress", icon: LineChartIcon },
    { page: "settings", labelKey: "settings", icon: Settings },
  ],
  chw: [
    { page: "chwDashboard", labelKey: "dashboard", icon: Home },
    { page: "chwSearch", labelKey: "patientsNav", icon: Search },
    { page: "addCommunityVisit", labelKey: "visit", icon: ClipboardList },
    { page: "sendDoctorReview", labelKey: "send", icon: Upload },
    { page: "settings", labelKey: "settings", icon: Settings },
  ],
};

type NavigationItem = {
  page: AppPage;
  labelKey: TranslationKey;
  icon: AppIcon;
};

const desktopNav: Record<RoleId, NavigationItem[]> = {
  patient: [
    { page: "patientHome", labelKey: "patientHome", icon: Home },
    { page: "patientPhoto", labelKey: "takeWoundPhoto", icon: Camera },
    { page: "patientAiResult", labelKey: "aiResult", icon: Sparkles },
    { page: "patientProgress", labelKey: "treatmentProgress", icon: LineChartIcon },
    { page: "patientAppointments", labelKey: "patientAppointments", icon: CalendarDays },
    { page: "partnerClinics", labelKey: "partnerClinics", icon: Building2 },
    { page: "emergency", labelKey: "emergency", icon: Ambulance },
    { page: "patientOwnProfile", labelKey: "profile", icon: UserRound },
  ],
  doctor: [
    { page: "doctorDashboard", labelKey: "doctorDashboard", icon: Home },
    { page: "doctorSearch", labelKey: "patientTracking", icon: Search },
    { page: "aiPendingReview", labelKey: "aiReview", icon: Sparkles },
    { page: "doctorChwCases", labelKey: "chwCases", icon: Upload },
    { page: "doctorProgress", labelKey: "treatmentProgress", icon: LineChartIcon },
    { page: "datasetReference", labelKey: "datasetReference", icon: Database },
    { page: "settings", labelKey: "settings", icon: Settings },
  ],
  chw: [
    { page: "chwDashboard", labelKey: "primaryCareDashboard", icon: Home },
    { page: "communityPatientList", labelKey: "communityPatientList", icon: Users },
    { page: "chwSearch", labelKey: "communityPatientTracking", icon: Search },
    { page: "addCommunityVisit", labelKey: "addCommunityVisit", icon: ClipboardList },
    { page: "sendDoctorReview", labelKey: "sendToDoctorReview", icon: Upload },
    { page: "emergency", labelKey: "emergency", icon: Ambulance },
    { page: "settings", labelKey: "settings", icon: Settings },
  ],
};

const roleIcons: Record<RoleId, AppIcon> = {
  patient: HeartPulse,
  doctor: Stethoscope,
  chw: Users,
};

const INITIAL_PATIENT_APPOINTMENTS: PatientAppointment[] = [];

const INITIAL_PATIENT_CHAT_CONTACTS: PatientChatContact[] = [
  {
    id: "patient-chat-doctor",
    type: "doctor",
    name: "นพ.กิตติ วราเวช",
    organization: "WoundCare Clinic Chiangmai",
    phone: "000-111-2222",
    note: "แพทย์ผู้ดูแลใน prototype",
    createdAt: "2026-07-08T09:00:00+07:00",
  },
  {
    id: "patient-chat-chw",
    type: "primary_care",
    name: "อสม.มาลี",
    organization: "รพ.สต.บ้านใหม่",
    phone: "000-444-5555",
    note: "เจ้าหน้าที่ติดตามแผลในชุมชน",
    createdAt: "2026-07-08T09:05:00+07:00",
  },
];

const INITIAL_PATIENT_CHAT_THREADS: PatientChatThread[] = [
  {
    id: "thread-patient-chat-doctor",
    contactId: "patient-chat-doctor",
    messages: [
      {
        id: "msg-doctor-1",
        sender: "contact",
        text: "ส่งรูปแผลล่าสุดมาได้เลยครับ",
        createdAt: "2026-07-08T10:00:00+07:00",
      },
    ],
  },
  {
    id: "thread-patient-chat-chw",
    contactId: "patient-chat-chw",
    messages: [
      {
        id: "msg-chw-1",
        sender: "contact",
        text: "ถ่ายรูปแผลตามเวลาที่ตั้งไว้ แล้วแจ้งได้เลยค่ะ",
        createdAt: "2026-07-08T10:05:00+07:00",
      },
    ],
  },
];

const PHASE1_RECOMMENDATION_TH =
  "ติดตามแผลต่อ ถ่ายรูปซ้ำตามเวลาที่กำหนด และสังเกตการเปลี่ยนแปลงของแผล";
const PHASE1_RECOMMENDATION_EN =
  "Continue monitoring and take follow-up photos as scheduled.";
const LEGACY_PHASE1_RECOMMENDATION_EN =
  "Continue monitoring the wound, take follow-up photos as scheduled, and watch for changes.";

function localize(value: LocalizedText | undefined, language: Language) {
  if (value?.en === PHASE1_RECOMMENDATION_EN || value?.en === LEGACY_PHASE1_RECOMMENDATION_EN) {
    return language === "th" ? PHASE1_RECOMMENDATION_TH : PHASE1_RECOMMENDATION_EN;
  }
  return value ? value[language] : "-";
}

function isTheme(value: string | null): value is ThemeId {
  return !!value && themeIds.includes(value as ThemeId);
}

function isRole(value: string | null): value is RoleId {
  return !!value && roleIds.includes(value as RoleId);
}

function readTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  return isTheme(stored) ? stored : "medical_clean";
}

function readRole() {
  const stored = localStorage.getItem(STORAGE_KEYS.role);
  return isRole(stored) ? stored : null;
}

function readJsonArray<T>(key: string, initialValue: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return initialValue;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as T[]) : initialValue;
  } catch {
    return initialValue;
  }
}

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Cannot read image file"));
    reader.readAsDataURL(file);
  });
}

function resizeImageDataUrl(dataUrl: string, maxDimension = 1600, quality = 0.86) {
  return new Promise<string>((resolve) => {
    if (!dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }

    const image = new Image();
    image.onload = () => {
      const longestSide = Math.max(image.width, image.height);
      if (!longestSide || longestSide <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      const scale = maxDimension / longestSide;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

async function uploadAssessmentImagesForCloud(records: AssessmentRecord[]) {
  return Promise.all(
    records.map(async (record) => ({
      ...record,
      imageDataUrl: await uploadWoundImageFromDataUrl({
        dataUrl: record.imageDataUrl,
        patientId: record.patientId,
        recordId: record.id,
      }),
    })),
  );
}

async function uploadDatasetImagesForCloud(entries: DoctorDatasetEntry[]) {
  return Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      imageDataUrl: await uploadWoundImageFromDataUrl({
        dataUrl: entry.imageDataUrl,
        patientId: "doctor-dataset",
        recordId: entry.id,
      }),
    })),
  );
}

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function riskScore(risk: RiskLevel) {
  return { low: 1, medium: 2, high: 3, urgent: 4 }[risk];
}

function riskFromPhase(phase: ClinicalPhase): RiskLevel {
  if (phase === "phase1") return "low";
  if (phase === "phase2") return "medium";
  if (phase === "phase3" || phase === "phase4") return "high";
  return "urgent";
}

function latestAssessmentFor(
  patientId: string | undefined,
  assessments: AssessmentRecord[],
) {
  if (!patientId) return undefined;
  return assessments
    .filter((record) => record.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
}

function patientAssessments(patientId: string | undefined, records: AssessmentRecord[]) {
  if (!patientId) return [];
  return records
    .filter((record) => record.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

function findPatientByCitizenId(patients: Patient[], query: string) {
  const normalized = query.replace(/\D/g, "");
  const cleanQuery = query.trim().toLowerCase();
  return patients.find(
    (patient) =>
      patient.citizenIdMock === normalized ||
      patient.patientCode.toLowerCase() === cleanQuery,
  );
}

function getCorrection(
  assessmentId: string | undefined,
  corrections: DoctorCorrection[],
) {
  if (!assessmentId) return undefined;
  return corrections.find((correction) => correction.assessmentId === assessmentId);
}

function roleDisplayName(role: AssessmentRecord["createdByRole"], language: Language) {
  if (role === "admin") return language === "th" ? "ผู้ดูแลระบบ" : "Admin";
  return localize(ROLE_COPY[role].short, language);
}

function latestPatientStatus({
  latest,
  reminder,
  language,
}: {
  latest?: AssessmentRecord;
  reminder?: DailyReminder;
  language: Language;
}) {
  if (latest?.riskLevel === "urgent" || latest?.clinicalPhase === "phase5") {
    return {
      label: language === "th" ? "เร่งด่วน" : "Urgent",
      tone: "danger" as const,
    };
  }
  if (latest?.reviewStatus === "pending") {
    return {
      label: language === "th" ? "รอตรวจ" : "Pending",
      tone: "warning" as const,
    };
  }
  if (latest?.reviewStatus === "corrected") {
    return {
      label: language === "th" ? "แก้ไขแล้ว" : "Corrected",
      tone: "success" as const,
    };
  }
  if ((reminder?.missedDays ?? 0) > 0 || latest?.riskLevel === "high") {
    return {
      label: language === "th" ? "ต้องติดตาม" : "Follow-up",
      tone: "primary" as const,
    };
  }
  return {
    label: language === "th" ? "ต้องติดตาม" : "Follow-up",
    tone: "primary" as const,
  };
}

function latestConsultationForPatient(
  patientId: string | undefined,
  cases: CHWConsultationCase[],
) {
  if (!patientId) return undefined;
  return cases
    .filter((caseItem) => caseItem.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function chwConsultationStatusView(
  caseItem: CHWConsultationCase | undefined,
  t: (key: TranslationKey) => string,
) {
  if (!caseItem) {
    return { label: t("notSent"), tone: "neutral" as const };
  }
  if (caseItem.status === "urgent") {
    return { label: t("urgentStatus"), tone: "danger" as const };
  }
  if (caseItem.status === "referred") {
    return { label: t("referralRecommended"), tone: "danger" as const };
  }
  if (caseItem.status === "reviewed" || caseItem.doctorResponse) {
    return { label: t("doctorResponded"), tone: "success" as const };
  }
  return { label: t("waitingForDoctor"), tone: "warning" as const };
}

function phaseNumber(phase: ClinicalPhase) {
  return PHASE_COPY[phase].number;
}

function painScoreValue(record: Pick<AssessmentRecord, "painScore">) {
  return typeof record.painScore === "number" ? record.painScore : null;
}

function sensationStatusFor(record: Partial<AssessmentRecord>): SensationStatus {
  if (record.sensationStatus) return record.sensationStatus;
  if (record.numbness || record.hasNumbness) return "numbness";
  const painScore = painScoreValue(record);
  if ((painScore ?? 0) >= 8) return "severe_pain";
  if ((painScore ?? 0) >= 6) return "moderate_pain";
  if ((painScore ?? 0) >= 1) return "mild_pain";
  return "no_pain_reduced_feeling";
}

function localizedSensationStatus(record: Partial<AssessmentRecord>, language: Language) {
  return localize(SENSATION_STATUS_COPY[sensationStatusFor(record)], language);
}

function hasNumbnessOrReducedSensation(record: Partial<AssessmentRecord>) {
  const status = sensationStatusFor(record);
  return Boolean(
    record.hasNumbness ||
      record.numbness ||
      record.reducedSensation ||
      status === "numbness" ||
      status === "no_pain_reduced_feeling",
  );
}

function sensationScore(record: Partial<AssessmentRecord>) {
  const status = sensationStatusFor(record);
  if (status === "no_pain_reduced_feeling" || status === "numbness") return 3;
  if (status === "burning_tingling" || status === "pain_walking") return 2;
  if (status === "pain_at_rest" || status === "severe_pain") return 4;
  if (status === "moderate_pain") return 2;
  if (status === "mild_pain") return 1;
  return 0;
}

function estimatedTissuePercents(sample: DFUTissueSampleItem) {
  const labels = sample.realTissueLabels;
  const result: Record<"granulation" | "fibrin" | "callus" | "necrotic", number> = {
    granulation: 0,
    fibrin: 0,
    callus: 0,
    necrotic: 0,
  };
  const displayLabels = labels.filter(
    (label): label is "granulation" | "fibrin" | "callus" | "necrotic" =>
      label === "granulation" || label === "fibrin" || label === "callus" || label === "necrotic",
  );
  if (!displayLabels.length) return result;
  if (displayLabels.length === 1) {
    result[displayLabels[0]] = 100;
    return result;
  }
  const primary = displayLabels.includes(sample.primaryTissueLabel as (typeof displayLabels)[number])
    ? (sample.primaryTissueLabel as (typeof displayLabels)[number])
    : displayLabels[0];
  result[primary] = 55;
  const remaining = displayLabels.filter((label) => label !== primary);
  remaining.forEach((label) => {
    result[label] = Math.round(45 / remaining.length);
  });
  return result;
}

function tissueLabelText(label: DFUTissueLabel | undefined, translate: (key: TranslationKey) => string) {
  if (!label || label === "label_pending") return translate("labelPending");
  return label;
}

function tissueLabelsText(labels: DFUTissueLabel[] | undefined, translate: (key: TranslationKey) => string) {
  const parsedLabels = (labels ?? []).filter((label) => label !== "label_pending");
  return parsedLabels.length ? parsedLabels.join(", ") : translate("labelPending");
}

function applyRealDatasetPreview(records: AssessmentRecord[]) {
  if (!DFUTISSUE_SAMPLE_ITEMS.length) return records;
  return records.map((record, index) => {
    const patientIndex = Number(record.patientId.replace(/\D/g, "")) - 1;
    const sample =
      DFUTISSUE_SAMPLE_ITEMS[
        Number.isFinite(patientIndex) && patientIndex >= 0
          ? patientIndex % DFUTISSUE_SAMPLE_ITEMS.length
          : index % DFUTISSUE_SAMPLE_ITEMS.length
      ];
    const tissue = estimatedTissuePercents(sample);
    const clinicalPhase = sample.derivedPrototypePhase;
    return {
      ...record,
      imageDataUrl: sample.imagePath,
      granulationPercent: tissue.granulation,
      fibrinPercent: tissue.fibrin,
      callusPercent: tissue.callus,
      necroticPercent: tissue.necrotic,
      riskLevel: riskFromPhase(clinicalPhase),
      clinicalPhase,
      clinicalPhaseLabel: PHASE_COPY[clinicalPhase].label,
      recommendation: PHASE_COPY[clinicalPhase].recommendation,
      isRealDatasetImage: true,
      isClinicalPhaseGroundTruth: false,
      datasetSampleId: sample.id,
      datasetName: sample.datasetName,
      sourceUrl: sample.sourceUrl,
      paperUrl: sample.paperUrl,
      realTissueLabels: sample.realTissueLabels,
      primaryTissueLabel: sample.primaryTissueLabel,
      derivedPrototypePhase: sample.derivedPrototypePhase,
      derivedPhaseReason: text(sample.derivedPhaseReasonTh, sample.derivedPhaseReasonEn),
    };
  });
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-sm lg:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function Button({
  children,
  icon: Icon,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: AppIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "warning";
}) {
  const variants = {
    primary:
      "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]",
    secondary:
      "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)]",
    ghost: "border-[var(--line)] bg-transparent text-[var(--ink)]",
    danger: "border-red-500 bg-red-600 text-white",
    warning: "border-amber-400 bg-amber-400 text-slate-950",
  };

  return (
    <button
      type={type}
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold leading-tight transition hover:shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-12 ${variants[variant]} ${className}`}
    >
      {Icon ? <Icon size={17} className="shrink-0" /> : null}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

function IconButton({
  icon: Icon,
  label,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: AppIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)] ${className}`}
    >
      <Icon size={18} />
    </button>
  );
}

function ScreenHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      {eyebrow ? (
        <p className="text-xs font-black uppercase tracking-normal text-[var(--primary)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-black leading-tight text-[var(--ink)] lg:text-3xl">
        {title}
      </h1>
      {children ? (
        <div className="text-sm leading-relaxed text-[var(--muted)]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}) {
  const tones = {
    neutral: "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)]",
    success: "border-emerald-400/40 bg-emerald-500/15 text-[var(--success)]",
    warning: "border-amber-400/40 bg-amber-500/15 text-[var(--warning)]",
    danger: "border-red-400/40 bg-red-500/15 text-[var(--danger)]",
    primary: "border-sky-400/40 bg-sky-500/15 text-[var(--primary)]",
  };

  return (
    <span
      className={`inline-flex min-h-7 max-w-full items-center rounded-lg border px-2 py-1 text-left text-xs font-black leading-tight ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function riskTone(risk: RiskLevel): "success" | "warning" | "danger" {
  if (risk === "low") return "success";
  if (risk === "medium") return "warning";
  return "danger";
}

function phaseTone(phase: ClinicalPhase): "success" | "warning" | "danger" | "primary" {
  if (phase === "phase1") return "success";
  if (phase === "phase2") return "primary";
  if (phase === "phase3") return "warning";
  return "danger";
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const { language, t } = useLanguage();
  return (
    <Badge tone={riskTone(risk)}>
      {t("riskLevel")}: {localize(RISK_COPY[risk].label, language)}
    </Badge>
  );
}

function PhaseBadge({ phase }: { phase: ClinicalPhase }) {
  const { language, t } = useLanguage();
  const phaseCopy = PHASE_COPY[phase];
  return (
    <Badge tone={phaseTone(phase)}>
      {t("phase")} {phaseCopy.number}: {localize(phaseCopy.label, language)}
    </Badge>
  );
}

function InfoCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-[var(--surface-soft)] p-3">
      <p className="text-[11px] font-black uppercase tracking-normal text-[var(--muted)]">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-black text-[var(--ink)]">
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  variant = "primary",
}: {
  icon: AppIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: AppIcon;
  variant?: "primary" | "warning" | "danger";
}) {
  const variants = {
    primary:
      "border-[var(--primary)] bg-[var(--surface-soft)] text-[var(--primary)]",
    warning:
      "border-amber-400/50 bg-amber-400/10 text-[var(--warning)]",
    danger:
      "border-red-400/40 bg-red-500/10 text-[var(--danger)]",
  };

  return (
    <Card className={`border ${variants[variant]}`}>
      <div className="mx-auto grid max-w-xl justify-items-center gap-3 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-current/25 bg-current/10">
          <Icon size={46} />
        </div>
        <div className="grid gap-2">
          <h2 className="text-lg font-black text-[var(--ink)] sm:text-xl">
            {title}
          </h2>
          <p className="text-sm font-semibold leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        </div>
        {actionLabel && onAction ? (
          <Button
            icon={ActionIcon}
            variant={variant === "danger" ? "secondary" : "primary"}
            onClick={onAction}
            className="w-full sm:w-auto"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  icon: AppIcon;
  tone?: "primary" | "danger" | "warning" | "success";
}) {
  const color = {
    primary: "text-[var(--primary)]",
    danger: "text-[var(--danger)]",
    warning: "text-[var(--warning)]",
    success: "text-[var(--success)]",
  }[tone];

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-[var(--surface-soft)] ${color}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-[var(--muted)]">{label}</p>
          <div className="text-xl font-black leading-tight text-[var(--ink)]">
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ChwWorkflowCard({
  step,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  step: number;
  title: string;
  description: string;
  icon: AppIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-left shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface-strong)] text-[var(--primary)]">
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-normal text-[var(--muted)]">
              {step.toString().padStart(2, "0")}
            </p>
            <ChevronRight size={16} className="text-[var(--muted)] transition group-hover:text-[var(--primary)]" />
          </div>
          <h3 className="mt-1 text-base font-black leading-tight text-[var(--ink)]">
            {title}
          </h3>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function ChwSectionCard({
  title,
  icon: Icon,
  children,
  action,
  className = "",
}: {
  title: string;
  icon: AppIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
              <Icon size={18} />
            </div>
            <h2 className="min-w-0 text-lg font-black leading-tight">{title}</h2>
          </div>
          {action}
        </div>
        {children}
      </div>
    </Card>
  );
}

function ChwAlertStrip({
  urgentCount,
  waitingCount,
  missedCount,
}: {
  urgentCount: number;
  waitingCount: number;
  missedCount: number;
}) {
  const { language, t } = useLanguage();
  const hasAlerts = urgentCount + waitingCount + missedCount > 0;

  return (
    <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-[var(--ink)] shadow-sm">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-400 text-white">
          <ShieldAlert size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-black">{t("closeFollowUpAlert")}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={urgentCount > 0 ? "danger" : "neutral"}>
              {t("urgentPhase")}: {urgentCount}
            </Badge>
            <Badge tone={waitingCount > 0 ? "warning" : "neutral"}>
              {t("waitingDoctorReview")}: {waitingCount}
            </Badge>
            <Badge tone={missedCount > 0 ? "warning" : "neutral"}>
              {t("missedFollowUpShort")}: {missedCount}
            </Badge>
          </div>
          {!hasAlerts ? (
            <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
              {t("noMissedFollowUp")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TextInput({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`grid gap-1 text-sm font-black text-[var(--ink)] ${className}`}>
      <span>{label}</span>
      <input
        {...props}
        className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
      />
    </label>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-1 text-sm font-black text-[var(--ink)]">
      <span>{label}</span>
      <textarea
        {...props}
        className="min-h-24 resize-none rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-[var(--ink)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--ink)] outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3 text-sm font-black ${
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)]"
          : "border-[var(--line)] bg-[var(--surface-soft)] text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function MedicalDisclaimerBox({ compact = false }: { compact?: boolean }) {
  const { language, t } = useLanguage();
  return (
    <div
      className={`rounded-lg border border-amber-400/40 bg-amber-400/10 text-[var(--ink)] ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex gap-2">
        <ShieldAlert className="mt-0.5 shrink-0 text-[var(--warning)]" size={17} />
        <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
          {t("medicalDisclaimer")}
        </p>
      </div>
    </div>
  );
}

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className={`grid gap-2 ${compact ? "" : "w-full"}`}>
      {!compact ? (
        <p className="text-xs font-black text-[var(--muted)]">{t("language")}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ToggleChip active={language === "th"} onClick={() => setLanguage("th")}>
          {compact ? "ไทย" : t("thai")}
        </ToggleChip>
        <ToggleChip active={language === "en"} onClick={() => setLanguage("en")}>
          {compact ? "EN" : t("english")}
        </ToggleChip>
      </div>
    </div>
  );
}

function ThemeSwitcher({
  theme,
  onChange,
  compact = false,
}: {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
  compact?: boolean;
}) {
  const { language, t } = useLanguage();
  return (
    <div className="grid gap-2">
      {!compact ? (
        <p className="text-xs font-black text-[var(--muted)]">{t("theme")}</p>
      ) : null}
      <div className="grid gap-2">
        {themeIds.map((item) => {
          const active = item === theme;
          const Icon =
            item === "medical_clean"
              ? SunMedium
              : item === "community_care"
                ? HeartPulse
                : Moon;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`rounded-lg border p-3 text-left transition ${
                active
                  ? "border-[var(--primary)] bg-[var(--surface-strong)]"
                  : "border-[var(--line)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black">
                    {localize(THEME_COPY[item].title, language)}
                  </p>
                  {!compact ? (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                      {localize(THEME_COPY[item].description, language)}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DataModeSwitcher({
  mode,
  onChange,
}: {
  mode: DataMode;
  onChange: (mode: DataMode) => void;
}) {
  const { language, t } = useLanguage();
  const modes: Array<{ value: DataMode; label: string }> = [
    { value: "mock", label: t("mockDataMode") },
    { value: "real_dataset_preview", label: t("realDatasetPreviewMode") },
  ];
  return (
    <div className="grid gap-2">
      <p className="text-xs font-black text-[var(--muted)]">{t("dataMode")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {modes.map((item) => (
          <ToggleChip
            key={item.value}
            active={mode === item.value}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

function LogoutConfirmModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/45 p-5">
      <div className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="grid gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-red-500/10 text-red-500">
            <LogOut size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--ink)]">{t("logoutTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {t("logoutMessage")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="secondary" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button variant="danger" icon={LogOut} onClick={onConfirm}>
              {t("confirmLogout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoutButton({
  onLogout,
  compact = false,
}: {
  onLogout: () => void;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      {compact ? (
        <IconButton icon={LogOut} label={t("logout")} onClick={() => setOpen(true)} />
      ) : (
        <Button variant="danger" icon={LogOut} onClick={() => setOpen(true)}>
          {t("logout")}
        </Button>
      )}
      <LogoutConfirmModal
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onLogout();
        }}
      />
    </>
  );
}

function RoleLoginCard({
  role,
  onSelect,
}: {
  role: RoleId;
  onSelect: (role: RoleId) => void;
}) {
  const { language, t } = useLanguage();
  const Icon = roleIcons[role];
  const buttonKey: Record<RoleId, TranslationKey> = {
    patient: "loginPatient",
    doctor: "loginDoctor",
    chw: "loginChw",
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className="h-full rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-left shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--surface-soft)] active:scale-[0.99] lg:p-5"
    >
      <div className="flex gap-3 lg:grid lg:gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)] lg:h-14 lg:w-14">
          <Icon size={23} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black leading-tight text-[var(--ink)] lg:text-xl">
            {localize(ROLE_COPY[role].title, language)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {localize(ROLE_COPY[role].description, language)}
          </p>
          <div className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-3 text-sm font-black text-[var(--primary-ink)]">
            <span>{t(buttonKey[role])}</span>
            <ChevronRight size={17} />
          </div>
        </div>
      </div>
    </button>
  );
}

function LoginScreen({
  theme,
  onThemeChange,
  onSelectRole,
}: {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  onSelectRole: (role: RoleId) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className={`theme-${theme} min-h-screen overflow-x-hidden bg-[var(--app-bg)] px-4 py-6 text-[var(--ink)] lg:px-8 lg:py-10`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-5">
        <div className="grid gap-5 rounded-[28px] border border-[var(--phone-line)] bg-[var(--phone-bg)] p-4 shadow-phone lg:gap-6 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary)] text-[var(--primary-ink)]">
              <HeartPulse size={28} />
            </div>
            <LanguageSwitcher compact />
          </div>

          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-normal text-[var(--primary)]">
              {t("appSubtitle")}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-[var(--ink)] lg:text-5xl">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] lg:text-base">
              {t("loginSubtitle")}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {roleIds.map((role) => (
              <RoleLoginCard key={role} role={role} onSelect={onSelectRole} />
            ))}
          </div>

          <Card className="p-3 lg:p-4">
            <ThemeSwitcher theme={theme} onChange={onThemeChange} compact />
          </Card>

          <p className="pb-2 text-center text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {t("safeWording")}
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthGuard({
  role,
  login,
  children,
}: {
  role: RoleId | null;
  login: ReactNode;
  children: ReactNode;
}) {
  return role ? <>{children}</> : <>{login}</>;
}

function AppHeader({
  role,
  page,
  canGoBack,
  onBack,
  onSettings,
  onNotifications,
  onLogout,
}: {
  role: RoleId;
  page: AppPage;
  canGoBack: boolean;
  onBack: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}) {
  const { language, t } = useLanguage();
  const Icon = roleIcons[role];
  const titleKey = pageTitleKey[page] ?? "appName";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--phone-bg)]/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {canGoBack ? (
          <IconButton icon={ChevronLeft} label={t("back")} onClick={onBack} />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-ink)]">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-[var(--primary)]">
            {t("appName")} / {localize(ROLE_COPY[role].short, language)}
          </p>
          <h1 className="truncate text-base font-black text-[var(--ink)]">
            {t(titleKey)}
          </h1>
        </div>
        <IconButton icon={Bell} label={t("notifications")} onClick={onNotifications} />
        <IconButton icon={Settings} label={t("settings")} onClick={onSettings} />
        <LogoutButton compact onLogout={onLogout} />
      </div>
    </header>
  );
}

function DesktopSidebar({
  role,
  page,
  onNavigate,
  onLogout,
}: {
  role: RoleId;
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}) {
  const { language, t } = useLanguage();
  const Icon = roleIcons[role];

  return (
    <aside className="app-scrollbar hidden h-full min-h-0 w-[300px] shrink-0 flex-col overflow-y-auto rounded-3xl border border-[var(--phone-line)] bg-[var(--phone-bg)] p-4 shadow-[0_24px_70px_rgba(2,6,23,0.28)] ring-1 ring-white/5 lg:flex xl:w-[320px]">
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--primary)] text-[var(--primary-ink)]">
          <HeartPulse size={25} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight">{t("appName")}</p>
          <p className="truncate text-xs font-bold uppercase tracking-normal text-[var(--muted)]">
            {localize(ROLE_COPY[role].title, language)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--surface)] text-[var(--primary)]">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--muted)]">
              {language === "th" ? "\u0e23\u0e30\u0e1a\u0e1a" : "Role"}
            </p>
            <p className="truncate text-sm font-black">{localize(ROLE_COPY[role].short, language)}</p>
          </div>
        </div>
      </div>

      <nav className="mt-4 grid flex-1 content-start gap-1 pr-1">
        {desktopNav[role].map((item) => {
          const active = item.page === page;
          const NavIcon = item.icon;
          return (
            <button
              key={`${role}-desktop-${item.page}`}
              type="button"
              onClick={() => onNavigate(item.page)}
              className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-left text-sm font-black transition ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-ink)] shadow-[0_12px_26px_rgba(56,189,248,0.18)]"
                  : "border-transparent text-[var(--muted)] hover:border-[var(--line)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <NavIcon size={18} className="shrink-0" />
              <span className="min-w-0 truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-4">
        <LogoutButton onLogout={onLogout} />
      </div>
    </aside>
  );
}

function ResponsiveHeader({
  role,
  page,
  canGoBack,
  onBack,
  onSettings,
  onNotifications,
  onLogout,
}: {
  role: RoleId;
  page: AppPage;
  canGoBack: boolean;
  onBack: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}) {
  const { language, t } = useLanguage();
  const titleKey = pageTitleKey[page] ?? "appName";

  return (
    <>
      <div className="lg:hidden">
        <AppHeader
          role={role}
          page={page}
          canGoBack={canGoBack}
          onBack={onBack}
          onSettings={onSettings}
          onNotifications={onNotifications}
          onLogout={onLogout}
        />
      </div>
      <header className="sticky top-0 z-20 hidden border-b border-[var(--line)] bg-[var(--phone-bg)]/95 px-6 py-4 backdrop-blur lg:block">
        <div className="flex items-center gap-4">
          {canGoBack ? (
            <IconButton icon={ChevronLeft} label={t("back")} onClick={onBack} />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-normal text-[var(--primary)]">
              {localize(ROLE_COPY[role].title, language)}
            </p>
            <h1 className="mt-1 truncate text-2xl font-black leading-tight text-[var(--ink)]">
              {t(titleKey)}
            </h1>
          </div>
          <div className="hidden min-h-11 min-w-[280px] items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-semibold text-[var(--muted)] xl:flex">
            <Search size={17} />
            <span className="truncate">{t("patientSearchPlaceholder")}</span>
          </div>
          <IconButton icon={Bell} label={t("notifications")} onClick={onNotifications} />
          <IconButton icon={Settings} label={t("settings")} onClick={onSettings} />
          <LogoutButton compact onLogout={onLogout} />
        </div>
      </header>
    </>
  );
}

function ResponsiveContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto grid w-full max-w-7xl gap-4 ${className}`}>
      {children}
    </div>
  );
}

function ResponsiveGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {children}
    </div>
  );
}

function PatientSummaryPanel({
  patient,
  latest,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
}) {
  const { language, t } = useLanguage();

  return (
    <Card className="lg:sticky lg:top-24">
      <div className="grid gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--primary)] text-xl font-black text-[var(--primary-ink)]">
            {patient.patientCode.slice(-1)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black">{patient.patientCode}</h2>
            <p className="text-sm font-semibold text-[var(--muted)]">{patient.citizenIdMasked}</p>
          </div>
        </div>
        <div className="grid gap-3">
          <InfoCell label={t("age")} value={`${patient.age} ${t("years")}`} />
          <InfoCell label={t("diabetesYears")} value={`${patient.diabetesYears ?? "-"} ${t("years")}`} />
          <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
          <InfoCell label={t("assignedDoctor")} value={patient.assignedDoctor ?? "-"} />
          <InfoCell label={t("assignedCHW")} value={patient.assignedCHW ?? "-"} />
          <InfoCell label={t("latestPhase")} value={latest ? <PhaseBadge phase={latest.clinicalPhase} /> : "-"} />
          <InfoCell label={t("latestRisk")} value={latest ? <RiskBadge risk={latest.riskLevel} /> : "-"} />
        </div>
      </div>
    </Card>
  );
}

function AppShell({
  theme,
  role,
  page,
  canGoBack,
  onBack,
  onSettings,
  onNotifications,
  onLogout,
  onNavigate,
  showMedicalDisclaimer,
  showPatientChat,
  onPatientChat,
  onPatientCameraCapture,
  onPatientCameraError,
  children,
}: {
  theme: ThemeId;
  role: RoleId;
  page: AppPage;
  canGoBack: boolean;
  onBack: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onLogout: () => void;
  onNavigate: (page: AppPage) => void;
  showMedicalDisclaimer: boolean;
  showPatientChat: boolean;
  onPatientChat: () => void;
  onPatientCameraCapture?: (dataUrl: string) => void;
  onPatientCameraError?: (messageKey: TranslationKey) => void;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const [chatQuickPanelOpen, setChatQuickPanelOpen] = useState(false);
  const patientCameraInputRef = useRef<HTMLInputElement>(null);

  const closeChatQuickPanel = () => setChatQuickPanelOpen(false);
  const openPatientCamera = () => {
    if (role !== "patient") {
      onNavigate("patientPhoto");
      return;
    }

    try {
      patientCameraInputRef.current?.click();
    } catch {
      onPatientCameraError?.("cameraPermissionDenied");
    }
    onNavigate("patientPhoto");
  };

  const handlePatientCameraFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      onPatientCameraCapture?.(dataUrl);
      onNavigate("patientPhoto");
    } catch {
      onPatientCameraError?.("cameraUnavailable");
      onNavigate("patientPhoto");
    }
  };

  return (
    <div className={`theme-${theme} min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--ink)] lg:h-screen lg:min-h-0 lg:overflow-hidden`}>
      <div className="mx-auto flex min-h-screen w-full flex-col lg:h-full lg:min-h-0 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6 lg:p-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:p-6">
        <DesktopSidebar role={role} page={page} onNavigate={onNavigate} onLogout={onLogout} />
        <div className="relative flex min-h-screen min-w-0 flex-col bg-[var(--phone-bg)] shadow-phone lg:h-full lg:min-h-0 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-[var(--phone-line)] lg:shadow-[0_24px_70px_rgba(2,6,23,0.22)] lg:ring-1 lg:ring-white/5">
          <ResponsiveHeader
            role={role}
            page={page}
            canGoBack={canGoBack}
            onBack={onBack}
            onSettings={onSettings}
            onNotifications={onNotifications}
            onLogout={onLogout}
          />
          <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-7 lg:py-6">
            <ResponsiveContainer className="pb-[calc(8.5rem+env(safe-area-inset-bottom))] lg:pb-6">
              {showMedicalDisclaimer ? <MedicalDisclaimerBox compact /> : null}
              {children}
            </ResponsiveContainer>
          </main>
          {showPatientChat && !chatQuickPanelOpen ? (
            <FloatingChatButton onClick={() => setChatQuickPanelOpen(true)} />
          ) : null}
          {showPatientChat && chatQuickPanelOpen ? (
            <ChatQuickPanel
              onClose={closeChatQuickPanel}
              onNavigate={(nextPage) => {
                closeChatQuickPanel();
                onNavigate(nextPage);
              }}
              onPatientChat={() => {
                closeChatQuickPanel();
                onPatientChat();
              }}
            />
          ) : null}
          {role === "patient" ? (
            <input
              ref={patientCameraInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              aria-label={t("openWoundCamera")}
              onChange={handlePatientCameraFile}
            />
          ) : null}
          <MobileBottomNav
            role={role}
            page={page}
            onNavigate={onNavigate}
            onPatientCamera={openPatientCamera}
          />
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({
  role,
  page,
  onNavigate,
  onPatientCamera,
}: {
  role: RoleId;
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  onPatientCamera?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--phone-bg)]/95 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_48px_rgba(2,6,23,0.26)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-1">
        {bottomNav[role].map((item) => {
          const active = item.page === page;
          const Icon = item.icon;
          const featuredCamera = role === "patient" && item.page === "patientPhoto";
          return (
            <button
              key={`${role}-${item.page}`}
              type="button"
              aria-label={featuredCamera ? t("openWoundCamera") : t(item.labelKey)}
              onClick={() => {
                if (featuredCamera && onPatientCamera) {
                  onPatientCamera();
                  return;
                }
                onNavigate(item.page);
              }}
              className={`grid place-items-center text-center text-[11px] font-black leading-tight ${
                featuredCamera
                  ? `-mt-10 mx-auto min-h-[88px] w-[78px] rounded-[2rem] border-4 border-[var(--phone-bg)] px-2 shadow-[0_16px_34px_rgba(56,189,248,0.28)] ${
                      active
                        ? "bg-[var(--primary)] text-[var(--primary-ink)]"
                        : "bg-[var(--primary)] text-[var(--primary-ink)]"
                    }`
                  : `min-h-[60px] rounded-lg px-1 ${
                      active
                        ? "bg-[var(--primary)] text-[var(--primary-ink)]"
                        : "text-[var(--muted)]"
                    }`
              }`}
            >
              <Icon size={featuredCamera ? 28 : 20} />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function FloatingChatButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="floating-chat fixed bottom-[calc(6.8rem+env(safe-area-inset-bottom))] right-4 z-50 inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--primary)] px-5 py-3 text-sm font-black text-[var(--primary-ink)] shadow-[0_18px_38px_rgba(56,189,248,0.28)] lg:hidden"
    >
      <MessageCircle size={19} />
      {t("chat")}
    </button>
  );
}

function ChatQuickPanel({
  onClose,
  onNavigate,
  onPatientChat,
}: {
  onClose: () => void;
  onNavigate: (page: AppPage) => void;
  onPatientChat: () => void;
}) {
  const { language } = useLanguage();
  const copy =
    language === "th"
      ? {
          title: "แชทช่วยเหลือ",
          subtitle: "เลือกช่องทางติดต่อที่ต้องการ",
          contactChw: "ติดต่อ อสม.",
          contactClinic: "ติดต่อคลินิก",
          askAi: "ถามเกี่ยวกับผล AI",
          emergency: "โทรฉุกเฉิน",
          close: "ปิด",
        }
      : {
          title: "Quick Help",
          subtitle: "Choose how you want to get help.",
          contactChw: "Contact CHW",
          contactClinic: "Contact Clinic",
          askAi: "Ask About AI Result",
          emergency: "Emergency Call",
          close: "Close",
        };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label={copy.close}
        className="absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />
      <section className="chat-quick-panel absolute inset-x-3 bottom-[calc(6.3rem+env(safe-area-inset-bottom))] mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--phone-bg)] p-4 text-[var(--ink)] shadow-[0_24px_70px_rgba(2,6,23,0.36)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{copy.title}</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              {copy.subtitle}
            </p>
          </div>
          <IconButton icon={X} label={copy.close} onClick={onClose} />
        </div>
        <div className="grid gap-2">
          <Button variant="secondary" icon={Users} onClick={() => onNavigate("contactChw")}>
            {copy.contactChw}
          </Button>
          <Button variant="secondary" icon={Building2} onClick={() => onNavigate("partnerClinics")}>
            {copy.contactClinic}
          </Button>
          <Button icon={Sparkles} onClick={onPatientChat}>
            {copy.askAi}
          </Button>
          <Button variant="danger" icon={Ambulance} onClick={() => onNavigate("emergency")}>
            {copy.emergency}
          </Button>
        </div>
      </section>
    </div>
  );
}

function PatientIdentityBanner({
  patient,
  latest,
  onOpenHistory,
  onAddRecord,
  onAddAnother,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  onOpenHistory?: () => void;
  onAddRecord?: () => void;
  onAddAnother?: () => void;
}) {
  const { language, t } = useLanguage();
  return (
    <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--primary)]">
              {t("selectedPatientNotice")}
            </p>
            <h2 className="mt-1 text-xl font-black">{patient.patientCode}</h2>
            <p className="text-sm text-[var(--muted)]">
              {t("maskedCitizenId")}: {patient.citizenIdMasked}
            </p>
          </div>
          {latest ? <RiskBadge risk={latest.riskLevel} /> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoCell label={t("age")} value={`${patient.age} ${t("years")}`} />
          <InfoCell label={t("gender")} value={localize(patient.gender, language)} />
          <InfoCell
            label={t("woundLocation")}
            value={localize(patient.woundLocation, language)}
          />
          <InfoCell
            label={t("latestPhase")}
            value={latest ? <PhaseBadge phase={latest.clinicalPhase} /> : "-"}
          />
          <InfoCell
            label={t("latestVisitDate")}
            value={latest ? formatDate(latest.createdAt, language) : "-"}
          />
          <InfoCell
            label={t("sourceChannel")}
            value={localize(SOURCE_CHANNEL_COPY[patient.sourceChannel], language)}
          />
        </div>

        {(onOpenHistory || onAddRecord || onAddAnother) ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {onOpenHistory ? (
              <Button variant="secondary" icon={FileText} onClick={onOpenHistory}>
                {t("openHistory")}
              </Button>
            ) : null}
            {onAddRecord ? (
              <Button icon={ClipboardList} onClick={onAddRecord}>
                {t("addFollowUp")}
              </Button>
            ) : null}
            {onAddAnother ? (
              <Button variant="ghost" icon={UserPlus} onClick={onAddAnother}>
                {t("addAnotherPatient")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function MockWoundPhoto({
  imageDataUrl,
  withSegmentation = false,
  className = "",
}: {
  imageDataUrl?: string;
  withSegmentation?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  if (
    imageDataUrl?.startsWith("data:image") ||
    imageDataUrl?.startsWith("/datasets/") ||
    imageDataUrl?.startsWith("https://")
  ) {
    return (
      <img
        src={imageDataUrl}
        alt={t("takeWoundPhoto")}
        className={`aspect-[4/3] w-full rounded-lg object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={t("takeWoundPhoto")}
      className={`mock-wound-photo aspect-[4/3] w-full rounded-lg border border-[var(--line)] ${className}`}
    >
      {withSegmentation ? (
        <div className="segmentation-layer">
          <span className="seg-callus" />
          <span className="seg-granulation" />
          <span className="seg-fibrin" />
          <span className="seg-necrotic" />
        </div>
      ) : null}
    </div>
  );
}

function PhotoCapture({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-3">
      <MockWoundPhoto imageDataUrl={value} withSegmentation />
      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-black text-[var(--ink)]">
        <Camera size={17} />
        <span>{t("takeOrUploadPhoto")}</span>
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
        />
      </label>
    </div>
  );
}

function TissueBars({ record }: { record: AssessmentRecord }) {
  const { t } = useLanguage();
  const rows = [
    { label: t("granulation"), value: record.granulationPercent, color: "#d94b6a" },
    { label: t("fibrin"), value: record.fibrinPercent, color: "#e2b13c" },
    { label: t("callus"), value: record.callusPercent, color: "#b78a55" },
    { label: t("necrotic"), value: record.necroticPercent, color: "#30343b" },
  ];

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1">
          <div className="flex justify-between gap-2 text-xs font-black">
            <span>{row.label}</span>
            <span>{row.value}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
            <div
              className="h-full rounded-full"
              style={{ width: `${row.value}%`, background: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SensationSummary({ record }: { record: AssessmentRecord }) {
  const { language, t } = useLanguage();
  const painScore = painScoreValue(record);
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCell
          label={t("woundSensation")}
          value={localizedSensationStatus(record, language)}
        />
        <InfoCell
          label={t("painScoreIfPresent")}
          value={painScore === null ? "-" : `${painScore}/10`}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--muted)]">
        {t("noPainSafetyNote")}
      </p>
    </div>
  );
}

function DatasetSourceBox({ record }: { record: AssessmentRecord }) {
  const { language, t } = useLanguage();
  if (!record.isRealDatasetImage) {
    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
        <Badge tone="neutral">{t("mockDataMode")}</Badge>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--muted)]">
          {t("mockAssessmentSource")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--primary)] bg-[var(--surface-soft)] p-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone="success">{t("realDatasetImage")}</Badge>
        <Badge tone="primary">{t("derivedPhase")}</Badge>
        <Badge tone="warning">{t("mockSymptomData")}</Badge>
      </div>
      <div className="mt-3 grid gap-2 text-xs font-semibold leading-relaxed text-[var(--muted)]">
        <p>{t("realDatasetSourceNotice")}</p>
        <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-[var(--ink)]">
          {t("realDatasetPrototypeFlowNote")}
        </p>
        <p>{localize(DERIVED_PHASE_NOTICE, language)}</p>
        <p>
          {t("realTissueLabels")}:{" "}
          {tissueLabelsText(record.realTissueLabels, t)}
        </p>
        <p>
          {t("primaryTissueLabel")}:{" "}
          {tissueLabelText(record.primaryTissueLabel, t)}
        </p>
      </div>
    </div>
  );
}

function AssessmentCard({
  record,
  corrections,
  patient,
  action,
}: {
  record: AssessmentRecord;
  corrections: DoctorCorrection[];
  patient?: Patient;
  action?: ReactNode;
}) {
  const { language, t } = useLanguage();
  const correction = getCorrection(record.id, corrections);
  return (
    <Card>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[104px_minmax(0,1fr)] lg:grid-cols-[132px_minmax(0,1fr)]">
          <MockWoundPhoto imageDataUrl={record.imageDataUrl} className="aspect-square" />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <PhaseBadge phase={record.clinicalPhase} />
              <RiskBadge risk={record.riskLevel} />
              {record.isRealDatasetImage ? (
                <Badge tone="success">{t("realDatasetImage")}</Badge>
              ) : null}
            </div>
            <h3 className="mt-2 text-base font-black">{record.patientCode}</h3>
            <p className="text-xs font-semibold text-[var(--muted)]">
              {patient ? localize(patient.woundLocation, language) : localize(record.woundLocation, language)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {formatDateTime(record.createdAt, language)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCell label={t("visitType")} value={localize(VISIT_TYPE_COPY[record.visitType], language)} />
          <InfoCell label={t("reviewStatus")} value={localize(REVIEW_STATUS_COPY[record.reviewStatus], language)} />
          <InfoCell label={t("woundSensation")} value={localizedSensationStatus(record, language)} />
          <InfoCell label={t("aiConfidence")} value={`${record.aiConfidence}%`} />
        </div>
        <SensationSummary record={record} />
        <DatasetSourceBox record={record} />

        <div>
          <p className="text-xs font-black text-[var(--muted)]">{t("recommendation")}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
            {localize(record.recommendation, language)}
          </p>
        </div>

        {correction ? (
          <div className="rounded-lg border border-[var(--primary)] bg-[var(--surface-soft)] p-3">
            <p className="text-xs font-black text-[var(--primary)]">
              {t("correctedByDoctor")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <PhaseBadge phase={correction.correctedClinicalPhase} />
              <RiskBadge risk={correction.correctedRiskLevel} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {localize(correction.doctorNote, language)}
            </p>
          </div>
        ) : null}

        {action}
      </div>
    </Card>
  );
}

function PatientSearchBox({
  patients,
  onFound,
}: {
  patients: Patient[];
  onFound: (patient: Patient) => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const handleSearch = () => {
    const found = findPatientByCitizenId(patients, query);
    if (!found) {
      setMessage(t("patientNotFound"));
      return;
    }
    setMessage(`${t("patientFound")}: ${found.patientCode}`);
    onFound(found);
  };

  return (
    <Card>
      <div className="grid gap-3">
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
          {t("prototypeCitizenWarning")}
        </div>
        <TextInput
          label={t("enterCitizenId")}
          inputMode="numeric"
          placeholder={t("citizenPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button icon={Search} onClick={handleSearch}>
          {t("searchPatient")}
        </Button>
        {message ? (
          <p className="text-sm font-black text-[var(--primary)]">{message}</p>
        ) : null}
      </div>
    </Card>
  );
}

function EmergencyButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-28 rounded-lg border border-red-500 bg-red-600 px-4 py-5 text-center text-xl font-black text-white shadow-lg lg:min-h-36 lg:text-2xl"
    >
      <Ambulance className="mx-auto mb-2" size={34} />
      {t("emergencyCall")}
    </button>
  );
}

function PatientHomeScreen({
  patient,
  latest,
  assessments,
  corrections,
  reminders,
  onNavigate,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  assessments: AssessmentRecord[];
  corrections: DoctorCorrection[];
  reminders: DailyReminder[];
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  const patientRecords = patientAssessments(patient.id, assessments).slice(-3).reverse();
  const reminder = reminders.find((item) => item.patientId === patient.id);

  return (
    <>
      <ScreenHeader title={t("patientHome")} eyebrow={`${t("appName")} / ${t("patientRoleLabel")}`}>
        <p>{t("valueProp")}</p>
      </ScreenHeader>

      <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-ink)]">
              <HeartPulse size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-normal text-[var(--primary)]">
                {t("todaysWoundCare")}
              </p>
              <h2 className="text-2xl font-black leading-tight">{t("patientHome")}</h2>
              <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                {patient.patientCode} / {patient.citizenIdMasked}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
              <p className="text-xs font-black text-[var(--primary)]">{t("slides")}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--ink)]">
                {t("dailyPhotoReminder")}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
              <p className="text-xs font-black text-[var(--primary)]">{t("announcements")}</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--ink)]">
                {t("woundCareAnnouncement")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("latestAiSummary")}
          value={latest ? `${t("phase")} ${phaseNumber(latest.clinicalPhase)}` : "-"}
          icon={Sparkles}
        />
        <StatCard
          label={t("nextAppointment")}
          value={reminder?.active ? reminder.reminderTime : "-"}
          icon={CalendarDays}
          tone={reminder?.missedDays ? "warning" : "success"}
        />
      </div>

      {latest ? (
        <Card>
          <div className="grid gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">{t("latestAiSummary")}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatDateTime(latest.createdAt, language)}
                </p>
              </div>
              <RiskBadge risk={latest.riskLevel} />
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)]">
              <MockWoundPhoto imageDataUrl={latest.imageDataUrl} className="aspect-square" />
              <div className="grid gap-2">
                <PhaseBadge phase={latest.clinicalPhase} />
                <p className="text-sm font-semibold leading-relaxed text-[var(--muted)]">
                  {localize(latest.recommendation, language)}
                </p>
              </div>
            </div>
            <Button variant="secondary" icon={Sparkles} onClick={() => onNavigate("patientAiResult")}>
              {t("viewLatestAiResult")}
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("healthEducation")}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <Button icon={Camera} onClick={() => onNavigate("patientPhoto")}>
              {t("captureWoundPhoto")}
            </Button>
            <Button variant="secondary" icon={Bell} onClick={() => onNavigate("dailyReminder")}>
              {t("dailyReminder")}
            </Button>
            <Button variant="secondary" icon={LineChartIcon} onClick={() => onNavigate("patientProgress")}>
              {t("trackHealingProgress")}
            </Button>
            <Button variant="secondary" icon={Building2} onClick={() => onNavigate("partnerClinics")}>
              {t("findPartnerClinic")}
            </Button>
            <Button variant="secondary" icon={Users} onClick={() => onNavigate("contactChw")}>
              {t("contactChw")}
            </Button>
            <Button variant="danger" icon={Ambulance} onClick={() => onNavigate("emergency")}>
              {t("emergency")}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("latestRecords")}</h2>
          {patientRecords.map((record) => (
            <AssessmentCard
              key={record.id}
              record={record}
              corrections={corrections}
              patient={patient}
            />
          ))}
          <Button variant="ghost" icon={ChevronRight} onClick={() => onNavigate("patientProgress")}>
            {t("treatmentProgress")}
          </Button>
        </div>
      </Card>

      <MedicalDisclaimerBox compact />
    </>
  );
}

function OnboardingScreen({ onNavigate }: { onNavigate: (page: AppPage) => void }) {
  const { t } = useLanguage();
  const steps = [
    { icon: Camera, title: t("takeWoundPhoto"), detail: t("dailyReminderCopy") },
    { icon: Sparkles, title: t("aiResult"), detail: t("mockAiReady") },
    { icon: Building2, title: t("partnerClinics"), detail: t("highRiskClinicSuggestion") },
  ];

  return (
    <>
      <ScreenHeader title={t("onboarding")} eyebrow={t("appName")}>
        <p>{t("onboardingCopy")}</p>
      </ScreenHeader>
      <div className="grid gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title}>
              <div className="flex gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
                  <Icon size={19} />
                </div>
                <div>
                  <h2 className="font-black">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    {step.detail}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Button icon={ChevronRight} onClick={() => onNavigate("patientPhoto")}>
        {t("continue")}
      </Button>
    </>
  );
}

type SymptomForm = {
  sensationStatus: SensationStatus;
  painScore: number | null;
  woundDurationDays: number;
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
  blackTissue: boolean;
  woundSpreading: boolean;
  coldOrDarkFoot: boolean;
  suspectedDeepWound: boolean;
  visibleBone: boolean;
  numbness: boolean;
};

const initialSymptoms: SymptomForm = {
  sensationStatus: "numbness",
  painScore: null,
  woundDurationDays: 5,
  hasNumbness: true,
  reducedSensation: false,
  burningTinglingPain: false,
  painWhileWalking: false,
  painAtRest: false,
  redness: false,
  swelling: false,
  pus: false,
  odor: false,
  fever: false,
  blackTissue: false,
  woundSpreading: false,
  coldOrDarkFoot: false,
  suspectedDeepWound: false,
  visibleBone: false,
  numbness: true,
};

function createAssessmentFromSymptoms({
  patient,
  role,
  visitType,
  imageDataUrl,
  symptoms,
  language,
}: {
  patient: Patient;
  role: RoleId;
  visitType: AssessmentRecord["visitType"];
  imageDataUrl: string;
  symptoms: SymptomForm;
  language: Language;
}): AssessmentRecord {
  const painScore = symptoms.painScore ?? 0;
  const sensationConcern =
    symptoms.hasNumbness ||
    symptoms.reducedSensation ||
    symptoms.sensationStatus === "numbness" ||
    symptoms.sensationStatus === "no_pain_reduced_feeling" ||
    symptoms.sensationStatus === "burning_tingling" ||
    symptoms.sensationStatus === "pain_walking";
  const seedRisk: RiskLevel =
    symptoms.visibleBone || symptoms.coldOrDarkFoot || (symptoms.fever && symptoms.pus)
      ? "urgent"
      : symptoms.pus ||
          symptoms.odor ||
          symptoms.blackTissue ||
          symptoms.sensationStatus === "pain_at_rest" ||
          painScore >= 7
        ? "high"
        : symptoms.redness || symptoms.swelling || painScore >= 4 || sensationConcern
          ? "medium"
          : "low";
  const granulationPercent = seedRisk === "urgent" ? 26 : seedRisk === "high" ? 34 : seedRisk === "medium" ? 50 : 62;
  const fibrinPercent = seedRisk === "low" ? 18 : seedRisk === "medium" ? 28 : 36;
  const callusPercent = seedRisk === "urgent" ? 12 : 18;
  const necroticPercent = Math.max(4, 100 - granulationPercent - fibrinPercent - callusPercent);
  const clinicalPhase = calculateClinicalPhase({
    ...symptoms,
    riskLevel: seedRisk,
    fibrinPercent,
    callusPercent,
  });
  const riskLevel = riskFromPhase(clinicalPhase);
  const createdAt = new Date().toISOString();

  return {
    id: `assessment-${Date.now()}`,
    patientId: patient.id,
    patientCode: patient.patientCode,
    citizenIdMasked: patient.citizenIdMasked,
    createdByRole: role,
    visitType,
    woundLocation: patient.woundLocation,
    woundDurationDays: symptoms.woundDurationDays,
    sensationStatus: symptoms.sensationStatus,
    painScore: symptoms.painScore,
    hasNumbness: symptoms.hasNumbness,
    reducedSensation: symptoms.reducedSensation,
    burningTinglingPain: symptoms.burningTinglingPain,
    painWhileWalking: symptoms.painWhileWalking,
    painAtRest: symptoms.painAtRest,
    redness: symptoms.redness,
    swelling: symptoms.swelling,
    pus: symptoms.pus,
    odor: symptoms.odor,
    fever: symptoms.fever,
    blackTissue: symptoms.blackTissue,
    woundSpreading: symptoms.woundSpreading,
    coldOrDarkFoot: symptoms.coldOrDarkFoot,
    suspectedDeepWound: symptoms.suspectedDeepWound,
    visibleBone: symptoms.visibleBone,
    numbness: symptoms.numbness,
    note:
      language === "th"
        ? text("บันทึกจาก mock UX flow", "Record from mock UX flow")
        : text("บันทึกจาก mock UX flow", "Record from mock UX flow"),
    imageDataUrl,
    granulationPercent,
    fibrinPercent,
    callusPercent,
    necroticPercent,
    aiConfidence: 82,
    riskLevel,
    clinicalPhase,
    clinicalPhaseLabel: PHASE_COPY[clinicalPhase].label,
    recommendation: PHASE_COPY[clinicalPhase].recommendation,
    reviewStatus: role === "patient" || role === "chw" ? "pending" : "confirmed",
    createdAt,
  };
}

function SymptomChecklist({
  symptoms,
  setSymptoms,
}: {
  symptoms: SymptomForm;
  setSymptoms: Dispatch<SetStateAction<SymptomForm>>;
}) {
  const { language, t } = useLanguage();
  const sensationOptions = Object.entries(SENSATION_STATUS_COPY).map(([value, label]) => ({
    value: value as SensationStatus,
    label: localize(label, language),
  }));
  const updateSensation = (sensationStatus: SensationStatus) => {
    setSymptoms((previous) => ({
      ...previous,
      sensationStatus,
      painScore:
        sensationStatus === "no_pain_reduced_feeling" || sensationStatus === "numbness"
          ? null
          : previous.painScore ?? 3,
      hasNumbness: sensationStatus === "numbness",
      reducedSensation: sensationStatus === "no_pain_reduced_feeling",
      burningTinglingPain: sensationStatus === "burning_tingling",
      painWhileWalking: sensationStatus === "pain_walking",
      painAtRest: sensationStatus === "pain_at_rest",
      numbness: sensationStatus === "numbness",
    }));
  };
  const options: Array<{ key: keyof SymptomForm; label: LocalizedText }> = [
    { key: "redness", label: text("แดง", "Redness") },
    { key: "swelling", label: text("บวม", "Swelling") },
    { key: "pus", label: text("มีหนอง", "Pus") },
    { key: "odor", label: text("มีกลิ่นผิดปกติ", "Unusual odor") },
    { key: "fever", label: text("มีไข้", "Fever") },
    { key: "blackTissue", label: text("แผลดำ", "Black tissue") },
    { key: "woundSpreading", label: text("แผลลาม", "Spreading wound") },
    { key: "coldOrDarkFoot", label: text("เท้าเย็นหรือคล้ำ", "Cold or dark foot") },
    { key: "suspectedDeepWound", label: text("สงสัยแผลลึก", "Suspected deep wound") },
    { key: "visibleBone", label: text("เห็นกระดูก", "Visible bone") },
    { key: "numbness", label: text("ชา", "Numbness") },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
        <SelectField
          label={t("woundSensation")}
          value={symptoms.sensationStatus}
          onChange={(value) => updateSensation(value as SensationStatus)}
          options={sensationOptions}
        />
        <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
          {t("woundSensationExplanation")}
        </p>
      </div>
      <label className="grid gap-2 text-sm font-black">
        <span>{t("painScoreIfPresent")}: {symptoms.painScore ?? 0}/10</span>
        <input
          type="range"
          min={0}
          max={10}
          value={symptoms.painScore ?? 0}
          onChange={(event) =>
            setSymptoms((previous) => ({
              ...previous,
              painScore: Number(event.target.value),
            }))
          }
        />
      </label>
      <TextInput
        label={t("woundDuration")}
        type="number"
        min={1}
        placeholder={t("woundDurationPlaceholder")}
        value={symptoms.woundDurationDays}
        onChange={(event) =>
          setSymptoms((previous) => ({
            ...previous,
            woundDurationDays: Number(event.target.value),
          }))
        }
      />
      <p className="-mt-2 text-xs font-semibold text-[var(--muted)]">
        {t("woundDurationHelper")}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = Boolean(symptoms[option.key]);
          return (
            <label
              key={String(option.key)}
              className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-black ${
                checked
                  ? "border-[var(--primary)] bg-[var(--surface-strong)]"
                  : "border-[var(--line)] bg-[var(--surface-soft)]"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  setSymptoms((previous) => ({
                    ...previous,
                    [option.key]: event.target.checked,
                    ...(option.key === "numbness"
                      ? {
                          hasNumbness: event.target.checked,
                          sensationStatus: event.target.checked
                            ? "numbness"
                            : previous.sensationStatus,
                        }
                      : {}),
                  }))
                }
              />
              <span>{localize(option.label, language)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TakeWoundPhotoScreen({
  patient,
  latest,
  onCreateAssessment,
  onNavigate,
  initialCapturedImage,
  cameraErrorKey,
  onInitialCaptureConsumed,
  onCameraErrorConsumed,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  onCreateAssessment: (record: AssessmentRecord) => Promise<void>;
  onNavigate: (page: AppPage) => void;
  initialCapturedImage?: string;
  cameraErrorKey?: TranslationKey | "";
  onInitialCaptureConsumed?: () => void;
  onCameraErrorConsumed?: () => void;
}) {
  const { language, t } = useLanguage();
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState("");
  const [symptoms, setSymptoms] = useState<SymptomForm>(initialSymptoms);
  const [patientNote, setPatientNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!initialCapturedImage) return;
    setPendingImageDataUrl(initialCapturedImage);
    setImageDataUrl("");
    setMessage("");
    onInitialCaptureConsumed?.();
  }, [initialCapturedImage]);

  useEffect(() => {
    if (!cameraErrorKey) return;
    setMessage(t(cameraErrorKey));
    onCameraErrorConsumed?.();
  }, [cameraErrorKey, t]);

  const handleImageFile = async (
    event: ChangeEvent<HTMLInputElement>,
    errorKey: TranslationKey,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setPendingImageDataUrl(dataUrl);
      setImageDataUrl("");
      setMessage("");
    } catch {
      setMessage(t(errorKey));
    }
  };

  const openCamera = () => {
    setMessage("");
    if (!cameraInputRef.current) {
      setMessage(t("cameraUnavailable"));
      return;
    }
    try {
      cameraInputRef.current.click();
    } catch {
      setMessage(t("cameraPermissionDenied"));
    }
  };

  const openUploadPicker = () => {
    setMessage("");
    uploadInputRef.current?.click();
  };

  const confirmPendingPhoto = () => {
    if (!pendingImageDataUrl) return;
    setImageDataUrl(pendingImageDataUrl);
    setPendingImageDataUrl("");
    setMessage("");
  };

  const retakePhoto = () => {
    setPendingImageDataUrl("");
    setImageDataUrl("");
    openCamera();
  };

  const runMockAi = async () => {
    if (isSavingRef.current) return;
    if (!imageDataUrl) {
      setMessage(t("uploadPhotoFirst"));
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setMessage(t("loading"));
    const resizedImageDataUrl = await resizeImageDataUrl(imageDataUrl);
    const record = createAssessmentFromSymptoms({
      patient,
      role: "patient",
      visitType: "self",
      imageDataUrl: resizedImageDataUrl,
      symptoms,
      language,
    });
    try {
      await onCreateAssessment({
        ...record,
        note: text(
          patientNote || localize(record.note, "th"),
          patientNote || localize(record.note, "en"),
        ),
      });
      setMessage(t("savedSuccessfully"));
    } catch (error) {
      setMessage(`${t("failedToSave")}: ${formatSupabaseError(error)}`);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };
  const previewImageDataUrl = pendingImageDataUrl || imageDataUrl;
  const hasConfirmedImage = Boolean(imageDataUrl);

  return (
    <>
      <input
        ref={cameraInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        aria-label={t("openWoundCamera")}
        onChange={(event) => handleImageFile(event, "cameraUnavailable")}
      />
      <input
        ref={uploadInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        aria-label={t("uploadImage")}
        onChange={(event) => handleImageFile(event, "cameraUnavailable")}
      />
      <ScreenHeader title={t("takeWoundPhoto")} eyebrow={`${t("appName")} / ${t("patientRoleLabel")}`}>
        <p>{patient.patientCode} / {t("dailyReminderCopy")}</p>
      </ScreenHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
      <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
        <div className="grid gap-4">
          <div>
            <h2 className="text-lg font-black">{t("woundPhotoTitle")}</h2>
            <p className="mt-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
              {t("woundPhotoCaptureGuidance")}
            </p>
            <div className="mt-3">
              {previewImageDataUrl ? (
                <MockWoundPhoto imageDataUrl={previewImageDataUrl} withSegmentation />
              ) : (
                <button
                  type="button"
                  aria-label={t("openWoundCamera")}
                  onClick={openCamera}
                  className="grid aspect-[4/3] w-full place-items-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-center"
                >
                  <div>
                    <Camera className="mx-auto text-[var(--primary)]" size={34} />
                    <p className="mt-2 text-sm font-black text-[var(--ink)]">
                      {t("noWoundImageYet")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                      {t("openWoundCamera")}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
          {pendingImageDataUrl ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" icon={Camera} onClick={retakePhoto}>
                {t("retakeShort")}
              </Button>
              <Button icon={CheckCircle2} onClick={confirmPendingPhoto}>
                {t("useThisPhoto")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="secondary" icon={Camera} onClick={hasConfirmedImage ? retakePhoto : openCamera}>
                {hasConfirmedImage ? t("retakeShort") : t("takeWoundPhoto")}
              </Button>
              <Button variant="secondary" icon={Upload} onClick={openUploadPicker}>
                {t("uploadImage")}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {hasConfirmedImage ? (
        <Card>
          <div className="grid gap-4">
            <h2 className="text-lg font-black">{t("additionalDetails")}</h2>
            <SymptomChecklist symptoms={symptoms} setSymptoms={setSymptoms} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCell label={t("photoDate")} value={formatDateTime(new Date().toISOString(), language)} />
              <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
              <InfoCell label={t("woundSensation")} value={localizedSensationStatus(symptoms, language)} />
              <InfoCell
                label={t("numbnessReducedSensation")}
                value={symptoms.hasNumbness || symptoms.reducedSensation ? t("saved") : "-"}
              />
            </div>
            <TextArea
              label={t("patientNote")}
              value={patientNote}
              onChange={(event) => setPatientNote(event.target.value)}
            />
          </div>
        </Card>
      ) : null}
      </div>

      <Card>
        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black">{t("aiResult")}</h2>
            {latest ? <RiskBadge risk={latest.riskLevel} /> : <Badge tone="neutral">{t("aiPending")}</Badge>}
          </div>
          {latest ? (
            <>
              <div className="flex flex-wrap gap-2">
                <PhaseBadge phase={latest.clinicalPhase} />
                <Badge tone="primary">{t("aiConfidence")}: {latest.aiConfidence}%</Badge>
                {latest.isRealDatasetImage ? <Badge tone="success">{t("realDatasetImage")}</Badge> : null}
              </div>
              <TissueBars record={latest} />
              <p className="text-sm font-semibold leading-relaxed text-[var(--muted)]">
                {localize(latest.recommendation, language)}
              </p>
              <DatasetSourceBox record={latest} />
            </>
          ) : (
            <p className="text-sm font-semibold leading-relaxed text-[var(--muted)]">
              {t("mockAiReady")}
            </p>
          )}
          <MedicalDisclaimerBox compact />
        </div>
      </Card>

      {hasConfirmedImage ? (
      <Card>
        <div className="grid gap-3">
          <Button icon={Sparkles} onClick={runMockAi} disabled={isSaving}>
            {isSaving ? t("loading") : t("analyzeWithAi")}
          </Button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="secondary" icon={CheckCircle2} onClick={runMockAi} disabled={isSaving}>
              {isSaving ? t("loading") : t("saveTodayResult")}
            </Button>
            <Button variant="secondary" icon={Upload} onClick={() => setMessage(t("contactChw"))}>
              {t("sendToDoctorReview")}
            </Button>
            <Button variant="secondary" icon={Users} onClick={() => onNavigate("contactChw")}>
              {t("contactChw")}
            </Button>
            <Button variant="secondary" icon={Building2} onClick={() => onNavigate("partnerClinics")}>
              {t("findPartnerClinic")}
            </Button>
          </div>
          <Button variant="danger" icon={Ambulance} onClick={() => onNavigate("emergency")}>
            {t("emergencyCall")}
          </Button>
          {message ? <Badge tone="warning">{message}</Badge> : null}
        </div>
      </Card>
      ) : message ? (
        <Badge tone="warning">{message}</Badge>
      ) : null}
    </>
  );
}

function AiResultScreen({
  record,
  patient,
  corrections,
  onNavigate,
}: {
  record?: AssessmentRecord;
  patient: Patient;
  corrections: DoctorCorrection[];
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  if (!record) {
    return (
      <>
        <ScreenHeader title={t("aiResult")} />
        <Card>
          <div className="grid gap-3">
            <p className="text-sm text-[var(--muted)]">{t("selectPatientFirst")}</p>
            <Button icon={Camera} onClick={() => onNavigate("patientPhoto")}>
              {t("takeWoundPhoto")}
            </Button>
          </div>
        </Card>
      </>
    );
  }

  const highRisk = record.riskLevel === "high" || record.riskLevel === "urgent";

  return (
    <>
      <ScreenHeader title={t("aiResult")} eyebrow={patient.patientCode}>
        <p>{t("mockAiReady")}</p>
      </ScreenHeader>
      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-3">
            <MockWoundPhoto imageDataUrl={record.imageDataUrl} withSegmentation />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCell label={t("lastUpdate")} value={formatDateTime(record.createdAt, language)} />
              <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <PhaseBadge phase={record.clinicalPhase} />
              <RiskBadge risk={record.riskLevel} />
              <Badge tone="primary">{t("aiConfidence")}: {record.aiConfidence}%</Badge>
              {record.isRealDatasetImage ? <Badge tone="success">{t("realDatasetImage")}</Badge> : null}
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <h3 className="text-sm font-black">{t("clinicalPhaseResult")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {localize(PHASE_COPY[record.clinicalPhase].meaning, language)}
              </p>
            </div>
            <TissueBars record={record} />
            <SensationSummary record={record} />
            <DatasetSourceBox record={record} />
            <div>
              <p className="text-xs font-black text-[var(--muted)]">{t("recommendation")}</p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--ink)]">
                {localize(record.recommendation, language)}
              </p>
            </div>
            {getCorrection(record.id, corrections) ? (
              <div className="rounded-lg border border-[var(--primary)] bg-[var(--surface-soft)] p-3">
                <p className="text-xs font-black text-[var(--primary)]">{t("correctedByDoctor")}</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                  {localize(getCorrection(record.id, corrections)?.doctorNote, language)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
      {highRisk ? (
        <Card className="border-amber-400/50 bg-amber-400/10">
          <div className="grid gap-3">
            <p className="text-sm font-black text-[var(--warning)]">
              {t("highRiskChwSuggestion")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button icon={Building2} onClick={() => onNavigate("partnerClinics")}>
                {t("partnerClinics")}
              </Button>
              <Button variant="secondary" icon={Users} onClick={() => onNavigate("contactChw")}>
                {t("contactChw")}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
      <MedicalDisclaimerBox />
    </>
  );
}

function PartnerClinicsScreen({ clinics }: { clinics: ClinicPartner[] }) {
  const { language, t } = useLanguage();
  return (
    <>
      <ScreenHeader title={t("partnerClinics")}>
        <p>{t("highRiskClinicSuggestion")}</p>
      </ScreenHeader>
      <div className="grid gap-3">
        {clinics.map((clinic) => (
          <Card key={clinic.id}>
            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{clinic.name}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {localize(clinic.address, language)}
                  </p>
                </div>
                <Badge tone={clinic.usesDiaWoundTrack ? "success" : "neutral"}>
                  {clinic.distanceKm.toFixed(1)} km
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoCell label={t("openingHours")} value={localize(clinic.openingHours, language)} />
                <InfoCell label={t("phone")} value={clinic.phone} />
              </div>
              <Button variant="secondary" icon={Phone}>
                {t("callPartnerClinic")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ContactChwScreen({ patient }: { patient: Patient }) {
  const { language, t } = useLanguage();
  return (
    <>
      <ScreenHeader title={t("contactChw")} eyebrow={patient.patientCode}>
        <p>{t("highRiskChwSuggestion")}</p>
      </ScreenHeader>
      <div className="grid gap-3">
        {MOCK_CHWS.map((chw) => (
          <Card key={chw.id}>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
                <Users size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-black">{chw.name}</h2>
                <p className="text-sm text-[var(--muted)]">{localize(chw.area, language)}</p>
                <Button className="mt-3 w-full" variant="secondary" icon={Phone}>
                  {t("callCHW")} / {chw.phone}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function DailyReminderScreen({
  patient,
  reminders,
  setReminders,
}: {
  patient: Patient;
  reminders: DailyReminder[];
  setReminders: Dispatch<SetStateAction<DailyReminder[]>>;
}) {
  const { t } = useLanguage();
  const current = reminders.find((item) => item.patientId === patient.id);
  const [time, setTime] = useState(current?.reminderTime ?? "08:00");
  const [message, setMessage] = useState("");

  const saveReminder = () => {
    const next: DailyReminder = {
      id: current?.id ?? `reminder-${Date.now()}`,
      patientId: patient.id,
      frequency: "daily",
      reminderTime: time,
      active: true,
      missedDays: current?.missedDays ?? 0,
      streakDays: current?.streakDays ?? 0,
      createdAt: current?.createdAt ?? new Date().toISOString(),
    };
    setReminders((previous) => [
      ...previous.filter((item) => item.patientId !== patient.id),
      next,
    ]);
    setMessage(t("reminderSet"));
  };

  return (
    <>
      <ScreenHeader title={t("dailyReminder")} eyebrow={patient.patientCode}>
        <p>{t("dailyReminderCopy")}</p>
      </ScreenHeader>
      <Card>
        <div className="grid gap-4">
          <TextInput
            label={t("dailyReminder")}
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoCell label={t("activeReminders")} value={current?.active ? t("saved") : "-"} />
            <InfoCell label={t("missedFollowUp")} value={current?.missedDays ?? 0} />
          </div>
          <Button icon={Bell} onClick={saveReminder}>
            {t("save")}
          </Button>
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>
      </Card>
    </>
  );
}

function PatientAppointmentsScreen({
  patient,
  appointments,
  setAppointments,
}: {
  patient: Patient;
  appointments: PatientAppointment[];
  setAppointments: Dispatch<SetStateAction<PatientAppointment[]>>;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"active" | "request" | "cancelled">("active");
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState<PatientAppointment["provider"]>("doctor");
  const [location, setLocation] = useState<PatientAppointment["location"]>("partner_clinic");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [reasonKey, setReasonKey] = useState<TranslationKey>("scheduledWoundFollowUp");
  const [note, setNote] = useState("");

  const patientAppointments = appointments.filter((item) => item.patientId === patient.id);
  const visibleAppointments = patientAppointments.filter((item) => {
    if (tab === "cancelled") return item.status === "cancelled";
    if (tab === "request") return item.status === "request";
    return item.status === "active" || item.status === "completed";
  });

  const createAppointment = () => {
    const appointment: PatientAppointment = {
      id: `appointment-${Date.now()}`,
      patientId: patient.id,
      provider,
      location,
      date: date || new Date().toISOString().slice(0, 10),
      time,
      reasonKey,
      note,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setAppointments((previous) => [appointment, ...previous]);
    setShowForm(false);
    setNote("");
  };

  const updateStatus = (id: string, status: PatientAppointmentStatus) => {
    setAppointments((previous) =>
      previous.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  const emptyStateByTab = {
    active: {
      icon: CalendarDays,
      title: t("noAppointmentsTitle"),
      description: t("noAppointmentsBody"),
      actionLabel: t("createAppointment"),
      actionIcon: Plus,
      onAction: () => setShowForm(true),
      variant: "primary" as const,
    },
    request: {
      icon: CalendarClock,
      title: t("noAppointmentRequestsTitle"),
      description: t("noAppointmentRequestsBody"),
      actionLabel: t("checkLater"),
      actionIcon: CalendarClock,
      onAction: () => setTab("active"),
      variant: "primary" as const,
    },
    cancelled: {
      icon: CalendarX,
      title: t("noCancelledAppointmentsTitle"),
      description: t("noCancelledAppointmentsBody"),
      actionLabel: t("viewAllAppointments"),
      actionIcon: CalendarDays,
      onAction: () => setTab("active"),
      variant: "danger" as const,
    },
  }[tab];

  return (
    <>
      <ScreenHeader title={t("patientAppointments")} eyebrow={patient.patientCode}>
        <p>{t("patientAppointmentsIntro")}</p>
      </ScreenHeader>
      <div className="app-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 md:grid md:grid-cols-3 md:overflow-visible">
        {[
          ["active", t("myAppointments")],
          ["request", t("appointmentRequests")],
          ["cancelled", t("cancelledAppointments")],
        ].map(([value, label]) => (
          <ToggleChip
            key={value}
            active={tab === value}
            onClick={() => setTab(value as typeof tab)}
          >
            {label}
          </ToggleChip>
        ))}
      </div>

      {!visibleAppointments.length ? (
        <EmptyState {...emptyStateByTab} />
      ) : (
        <div className="grid gap-3">
          {visibleAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <div className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-black">{t(appointment.reasonKey)}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {appointment.date} / {appointment.time}
                    </p>
                  </div>
                  <Badge tone={appointment.status === "cancelled" ? "danger" : appointment.status === "completed" ? "success" : "primary"}>
                    {appointment.status === "cancelled"
                      ? t("cancelled")
                      : appointment.status === "completed"
                        ? t("completed")
                        : t("saved")}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCell
                    label={t("selectProvider")}
                    value={appointment.provider === "doctor" ? t("doctorProvider") : t("primaryCareProvider")}
                  />
                  <InfoCell
                    label={t("selectLocation")}
                    value={appointment.location === "partner_clinic" ? t("partnerClinicLocation") : t("primaryCareUnit")}
                  />
                </div>
                {appointment.note ? (
                  <p className="text-sm font-semibold leading-relaxed text-[var(--muted)]">
                    {appointment.note}
                  </p>
                ) : null}
                {appointment.status !== "cancelled" ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="secondary" icon={CheckCircle2} onClick={() => updateStatus(appointment.id, "completed")}>
                      {t("markCompleted")}
                    </Button>
                    <Button variant="ghost" icon={LogOut} onClick={() => updateStatus(appointment.id, "cancelled")}>
                      {t("cancelAppointment")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            {t("createAppointment")}
          </Button>
        </div>
      )}

      {showForm ? (
        <Card>
          <div className="grid gap-4">
            <h2 className="text-lg font-black">{t("createAppointment")}</h2>
            <SelectField
              label={t("selectProvider")}
              value={provider}
              onChange={setProvider}
              options={[
                { value: "doctor", label: t("doctorProvider") },
                { value: "primary_care", label: t("primaryCareProvider") },
              ]}
            />
            <SelectField
              label={t("selectLocation")}
              value={location}
              onChange={setLocation}
              options={[
                { value: "partner_clinic", label: t("partnerClinicLocation") },
                { value: "primary_care_unit", label: t("primaryCareUnit") },
              ]}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput label={t("selectDate")} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <TextInput label={t("selectTime")} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
            <SelectField
              label={t("appointmentReason")}
              value={reasonKey}
              onChange={setReasonKey}
              options={[
                "scheduledWoundFollowUp",
                "aiSuggestedDoctor",
                "woundLooksWorse",
                "requestFurtherAssessment",
                "postTreatmentFollowUp",
              ].map((key) => ({ value: key as TranslationKey, label: t(key as TranslationKey) }))}
            />
            <TextArea label={t("additionalNote")} value={note} onChange={(event) => setNote(event.target.value)} />
            <Button icon={CalendarDays} onClick={createAppointment}>
              {t("createAppointment")}
            </Button>
          </div>
        </Card>
      ) : null}
    </>
  );
}

function PatientOwnProfileScreen({
  patient,
  latest,
  reminders,
  clinics,
  onNavigate,
  onLogout,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  reminders: DailyReminder[];
  clinics: ClinicPartner[];
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}) {
  const { language, t } = useLanguage();
  const reminder = reminders.find((item) => item.patientId === patient.id);
  const chw = MOCK_CHWS.find((item) => item.id === patient.assignedCHW) ?? MOCK_CHWS[0];
  const clinic = clinics.find((item) => item.id === patient.preferredClinicId) ?? clinics[0];

  return (
    <>
      <ScreenHeader title={t("patientOwnProfile")} eyebrow={`${t("appName")} / ${t("patientRoleLabel")}`} />
      <Card className="overflow-hidden p-0">
        <div className="h-28 bg-[var(--surface-strong)]" />
        <div className="-mt-12 grid gap-4 p-4">
          <div className="flex items-end gap-3">
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-[var(--surface)] bg-[var(--primary)] text-3xl font-black text-[var(--primary-ink)] shadow-sm">
              {patient.patientCode.slice(-1)}
            </div>
            <div className="pb-2">
              <h2 className="text-2xl font-black">{patient.patientCode}</h2>
              <p className="text-sm font-semibold text-[var(--muted)]">{t("patientRoleLabel")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoCell label={t("patientCode")} value={patient.patientCode} />
            <InfoCell label={t("maskedCitizenId")} value={patient.citizenIdMasked} />
            <InfoCell label={t("age")} value={`${patient.age} ${t("years")}`} />
            <InfoCell label={t("gender")} value={localize(patient.gender, language)} />
            <InfoCell label={t("diabetesYears")} value={`${patient.diabetesYears ?? "-"} ${t("years")}`} />
            <InfoCell label={t("phoneLabel")} value="085-321-4567" />
            <InfoCell label={t("areaVillage")} value={localize(patient.woundLocation, language)} />
            <InfoCell label={t("assignedPrimaryCareUnit")} value={patient.preferredClinicId ?? t("primaryCareUnit")} />
            <InfoCell label={t("assignedCarePerson")} value={chw.name} />
            <InfoCell label={t("recommendedPartnerClinic")} value={clinic?.name ?? "-"} />
            <InfoCell label={t("lastFollowUpDate")} value={latest ? formatDate(latest.createdAt, language) : "-"} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("woundCareSummary")}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoCell label={t("latestPhase")} value={latest ? <PhaseBadge phase={latest.clinicalPhase} /> : "-"} />
            <InfoCell label={t("latestRisk")} value={latest ? <RiskBadge risk={latest.riskLevel} /> : "-"} />
            <InfoCell label={t("latestAiResult")} value={latest ? formatDate(latest.createdAt, language) : "-"} />
            <InfoCell label={t("dailyReminderStatus")} value={reminder?.active ? reminder.reminderTime : "-"} />
            <InfoCell label={t("nextFollowUpReminder")} value={reminder?.reminderTime ?? "-"} />
            <InfoCell label={t("lastUploadedWoundPhotoDate")} value={latest ? formatDate(latest.createdAt, language) : "-"} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <Button icon={Camera} onClick={() => onNavigate("patientPhoto")}>
            {t("captureWoundPhoto")}
          </Button>
          <Button variant="secondary" icon={Sparkles} onClick={() => onNavigate("patientAiResult")}>
            {t("viewLatestAiResult")}
          </Button>
          <Button variant="secondary" icon={LineChartIcon} onClick={() => onNavigate("patientProgress")}>
            {t("trackHealingProgress")}
          </Button>
          <Button variant="secondary" icon={Users} onClick={() => onNavigate("contactChw")}>
            {t("contactChw")}
          </Button>
          <Button variant="secondary" icon={Building2} onClick={() => onNavigate("partnerClinics")}>
            {t("findPartnerClinic")}
          </Button>
          <Button variant="danger" icon={Ambulance} onClick={() => onNavigate("emergency")}>
            {t("emergencyCall")}
          </Button>
        </div>
      </Card>
      <Button variant="ghost" icon={LogOut} onClick={onLogout} className="w-full border-red-300 text-red-600">
        {t("logout")}
      </Button>
    </>
  );
}

function PatientChatScreen({
  contacts,
  setContacts,
  threads,
  setThreads,
  onNavigate,
}: {
  contacts: PatientChatContact[];
  setContacts: Dispatch<SetStateAction<PatientChatContact[]>>;
  threads: PatientChatThread[];
  setThreads: Dispatch<SetStateAction<PatientChatThread[]>>;
  onNavigate: (page: AppPage) => void;
}) {
  const { t } = useLanguage();
  const [selectedContactId, setSelectedContactId] = useState(contacts[0]?.id ?? "");
  const [contactType, setContactType] = useState<PatientChatContact["type"]>("doctor");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0];
  const selectedThread = selectedContact
    ? threads.find((thread) => thread.contactId === selectedContact.id)
    : undefined;
  const quickMessages: TranslationKey[] = [
    "askAboutWound",
    "sendLatestWoundPhoto",
    "askFollowUpVisit",
    "woundMoreRed",
    "needMoreAdvice",
  ];

  const addContact = () => {
    const id = `patient-contact-${Date.now()}`;
    const nextContact: PatientChatContact = {
      id,
      type: contactType,
      name: name || (contactType === "doctor" ? t("doctorProvider") : t("primaryCareProvider")),
      organization,
      phone,
      note,
      createdAt: new Date().toISOString(),
    };
    setContacts((previous) => [nextContact, ...previous]);
    setThreads((previous) => [
      {
        id: `thread-${id}`,
        contactId: id,
        messages: [],
      },
      ...previous,
    ]);
    setSelectedContactId(id);
    setName("");
    setOrganization("");
    setPhone("");
    setNote("");
  };

  const sendMessage = (textValue = message) => {
    if (!selectedContact || !textValue.trim()) return;
    const nextMessage: PatientChatMessage = {
      id: `message-${Date.now()}`,
      sender: "patient",
      text: textValue.trim(),
      createdAt: new Date().toISOString(),
    };
    setThreads((previous) => {
      const existing = previous.find((thread) => thread.contactId === selectedContact.id);
      if (!existing) {
        return [
          {
            id: `thread-${selectedContact.id}`,
            contactId: selectedContact.id,
            messages: [nextMessage],
          },
          ...previous,
        ];
      }
      return previous.map((thread) =>
        thread.contactId === selectedContact.id
          ? { ...thread, messages: [...thread.messages, nextMessage] }
          : thread,
      );
    });
    setMessage("");
  };

  return (
    <>
      <ScreenHeader title={t("chat")} eyebrow={t("patientRoleLabel")}>
        <p>{t("chatConcept")}</p>
      </ScreenHeader>
      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("myContacts")}</h2>
          <div className="grid gap-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelectedContactId(contact.id)}
                className={`rounded-lg border p-3 text-left ${
                  selectedContact?.id === contact.id
                    ? "border-[var(--primary)] bg-[var(--surface-strong)]"
                    : "border-[var(--line)] bg-[var(--surface-soft)]"
                }`}
              >
                <p className="font-black">{contact.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  {contact.type === "doctor" ? t("doctorContactType") : t("primaryCareContactType")} / {contact.organization || "-"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("recentMessages")}</h2>
          {selectedThread?.messages.length ? (
            <div className="grid gap-2">
              {selectedThread.messages.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg p-3 text-sm font-semibold ${
                    item.sender === "patient"
                      ? "ml-8 bg-[var(--primary)] text-[var(--primary-ink)]"
                      : "mr-8 bg-[var(--surface-soft)] text-[var(--ink)]"
                  }`}
                >
                  {item.text}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-[var(--muted)]">{t("messagePlaceholder")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((key) => (
              <Button key={key} variant="secondary" onClick={() => sendMessage(t(key))}>
                {t(key)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <TextInput
              label={t("chat")}
              placeholder={t("messagePlaceholder")}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button icon={Send} onClick={() => sendMessage()} className="self-end">
              {t("send")}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" icon={Phone}>{t("callContact")}</Button>
            <Button variant="secondary" icon={CalendarDays} onClick={() => onNavigate("patientAppointments")}>{t("viewAppointment")}</Button>
            <Button variant="secondary" icon={Camera} onClick={() => onNavigate("patientPhoto")}>{t("sendWoundPhoto")}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("addContact")}</h2>
          <SelectField
            label={t("contactType")}
            value={contactType}
            onChange={setContactType}
            options={[
              { value: "doctor", label: t("doctorContactType") },
              { value: "primary_care", label: t("primaryCareContactType") },
            ]}
          />
          <TextInput label={t("contactName")} value={name} onChange={(event) => setName(event.target.value)} />
          <TextInput label={t("clinicRhpcName")} value={organization} onChange={(event) => setOrganization(event.target.value)} />
          <TextInput label={t("contactPhone")} value={phone} onChange={(event) => setPhone(event.target.value)} />
          <TextArea label={t("contactNote")} value={note} onChange={(event) => setNote(event.target.value)} />
          <Button icon={Plus} onClick={addContact}>
            {t("addContact")}
          </Button>
        </div>
      </Card>
    </>
  );
}

function TreatmentProgressScreen({
  patient,
  records,
  corrections,
}: {
  patient: Patient;
  records: AssessmentRecord[];
  corrections: DoctorCorrection[];
}) {
  const { language, t } = useLanguage();
  const [range, setRange] = useState<"day" | "week" | "month" | "fiveMonths">("week");
  const patientRecords = patientAssessments(patient.id, records);
  const latest = patientRecords[patientRecords.length - 1];
  const chartData = patientRecords.map((record) => ({
    date: formatDate(record.createdAt, language),
    risk: riskScore(record.riskLevel),
    phase: phaseNumber(record.clinicalPhase),
    sensation: sensationScore(record),
    pain: painScoreValue(record),
    numbness: hasNumbnessOrReducedSensation(record) ? 1 : 0,
    granulation: record.granulationPercent,
    fibrin: record.fibrinPercent,
    callus: record.callusPercent,
    necrotic: record.necroticPercent,
  }));
  const hasPainTrend = chartData.some((item) => typeof item.pain === "number");

  return (
    <>
      <ScreenHeader title={t("treatmentProgress")} eyebrow={patient.patientCode}>
        <p>{t("safeWording")}</p>
      </ScreenHeader>
      <div className="app-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 md:grid md:grid-cols-4 md:overflow-visible">
        {[
          ["day", t("oneDay")],
          ["week", t("oneWeek")],
          ["month", t("oneMonth")],
          ["fiveMonths", t("fiveMonths")],
        ].map(([value, label]) => (
          <ToggleChip
            key={value}
            active={range === value}
            onClick={() => setRange(value as typeof range)}
          >
            {label}
          </ToggleChip>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("clinicalPhaseTrend")}</h2>
          <div className="h-56">
            <ChartResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="phase"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("woundSensationTrend")}</h2>
          <div className="h-56">
            <ChartResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sensation"
                  stroke="#0f9f8e"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartResponsiveContainer>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {t("noPainSafetyNote")}
          </p>
        </div>
      </Card>

      {hasPainTrend ? (
        <Card>
          <div className="grid gap-3">
            <h2 className="text-lg font-black">{t("painScoreIfPresentTrend")}</h2>
            <div className="h-56">
              <ChartResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pain"
                    stroke="#d94b6a"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ChartResponsiveContainer>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("numbnessReducedSensation")}</h2>
          <div className="h-48">
            <ChartResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <Tooltip />
                <Bar dataKey="numbness" fill="#8b5cf6" />
              </BarChart>
            </ChartResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("tissueOverview")}</h2>
          <div className="h-56">
            <ChartResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                <Tooltip />
                <Bar dataKey="granulation" stackId="a" fill="#d94b6a" />
                <Bar dataKey="fibrin" stackId="a" fill="#e2b13c" />
                <Bar dataKey="callus" stackId="a" fill="#b78a55" />
                <Bar dataKey="necrotic" stackId="a" fill="#30343b" />
              </BarChart>
            </ChartResponsiveContainer>
          </div>
        </div>
      </Card>

      </div>

      {latest ? (
        <AssessmentCard
          record={latest}
          corrections={corrections}
          patient={patient}
        />
      ) : null}
    </>
  );
}

function EmergencyScreen({ patient }: { patient?: Patient }) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const callOptions = [
    [t("callPartnerClinic"), "000-111-2222"],
    [t("callNearbyHospital"), "000-222-3333"],
    [t("callPrimaryCareUnit"), "000-333-4444"],
    [t("callCHW"), "000-444-5555"],
    [t("callPatientRelative"), "000-555-6666"],
  ];

  return (
    <>
      <ScreenHeader title={t("emergencyCall")} eyebrow={patient?.patientCode}>
        <p>{t("emergencyWarning")}</p>
      </ScreenHeader>
      <EmergencyButton onClick={() => setMessage(`${t("callStarted")}: 000-000-1669`)} />
      <Card>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {callOptions.map(([label, number]) => (
            <Button
              key={label}
              variant="secondary"
              icon={Phone}
              onClick={() => setMessage(`${t("callStarted")}: ${label} ${number}`)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="border-red-400/50 bg-red-500/10">
        <p className="text-sm font-black leading-relaxed text-[var(--danger)]">
          {t("mockPhoneNotice")}
        </p>
      </Card>
      {message ? <Badge tone="warning">{message}</Badge> : null}
    </>
  );
}

function CloudSyncBanner({ states }: { states: SupabaseSyncState[] }) {
  const { t } = useLanguage();
  const loading = states.some((state) => state.loading);
  const error = states.find((state) => state.error);

  if (isSupabaseConfigured && !loading && !error) return null;

  return (
    <Card className={error ? "border-red-400/50 bg-red-500/10 p-3" : "border-[var(--primary)] bg-[var(--surface-soft)] p-3"}>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--primary)]">
          <Database size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-[var(--ink)]">{t("cloudSync")}</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {!isSupabaseConfigured
              ? t("supabaseNotConfigured")
              : loading
                ? t("cloudSyncLoading")
                : `${t("cannotLoadData")}: ${error?.error}`}
          </p>
        </div>
      </div>
    </Card>
  );
}

function SettingsScreen({
  role,
  theme,
  dataMode,
  onThemeChange,
  onDataModeChange,
  onLogout,
  onReset,
  onImportLocalDemoData,
  onNavigate,
}: {
  role: RoleId;
  theme: ThemeId;
  dataMode: DataMode;
  onThemeChange: (theme: ThemeId) => void;
  onDataModeChange: (mode: DataMode) => void;
  onLogout: () => void;
  onReset: () => void;
  onImportLocalDemoData: () => Promise<void>;
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  const [message, setMessage] = useState("");

  const reset = () => {
    onReset();
    setMessage(t("saved"));
  };

  const importLocalData = async () => {
    setMessage(t("loading"));
    try {
      await onImportLocalDemoData();
      setMessage(t("importLocalDemoDataDone"));
    } catch (error) {
      setMessage(`${t("failedToSave")}: ${formatSupabaseError(error)}`);
    }
  };

  return (
    <>
      <ScreenHeader title={t("settings")} eyebrow={localize(ROLE_COPY[role].title, language)} />
      <Card>
        <div className="grid gap-4">
          <LanguageSwitcher />
          <ThemeSwitcher theme={theme} onChange={onThemeChange} />
          <DataModeSwitcher mode={dataMode} onChange={onDataModeChange} />
          <MedicalDisclaimerBox compact />
          <Button variant="secondary" icon={Database} onClick={reset}>
            {t("resetMockData")}
          </Button>
          <div className="grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
            <p className="text-sm font-black text-[var(--ink)]">{t("cloudSync")}</p>
            <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
              {t("importLocalDemoDataHelp")}
            </p>
            <Button variant="secondary" icon={Upload} onClick={importLocalData}>
              {t("importLocalDemoDataToSupabase")}
            </Button>
          </div>
          <LogoutButton onLogout={onLogout} />
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>
      </Card>
      {role === "doctor" ? (
        <Card>
          <div className="grid gap-2">
            <h2 className="text-lg font-black">{t("datasetReference")}</h2>
            <Button variant="secondary" icon={Database} onClick={() => onNavigate("datasetReference")}>
              {t("datasetReference")}
            </Button>
            <Button variant="secondary" icon={Camera} onClick={() => onNavigate("realDatasetSamples")}>
              {t("realDatasetSamples")}
            </Button>
            <Button variant="secondary" icon={ClipboardList} onClick={() => onNavigate("doctorDataset")}>
              {t("doctorDatasetManagement")}
            </Button>
            <Button variant="secondary" icon={Building2} onClick={() => onNavigate("partnerClinicManagement")}>
              {t("partnerClinicManagement")}
            </Button>
            <Button variant="secondary" icon={Users} onClick={() => onNavigate("roleSettings")}>
              {t("userRoleSettings")}
            </Button>
          </div>
        </Card>
      ) : null}
      {role === "chw" ? (
        <Card>
          <div className="grid gap-2">
            <h2 className="text-lg font-black">{t("primaryCareSystemLabel")}</h2>
            <Button variant="secondary" icon={FileText} onClick={() => onNavigate("sendDoctorReview")}>
              {t("viewDoctorResponse")}
            </Button>
            <Button variant="secondary" icon={Ambulance} onClick={() => onNavigate("emergency")}>
              {t("emergencyCall")}
            </Button>
            <Button variant="secondary" icon={Database} onClick={() => onNavigate("datasetReference")}>
              {t("datasetReference")}
            </Button>
          </div>
        </Card>
      ) : null}
    </>
  );
}

function DoctorSidebarPatientCard({
  patient,
  latest,
  reminder,
  selected,
  onSelect,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  reminder?: DailyReminder;
  selected: boolean;
  onSelect: () => void;
}) {
  const { language, t } = useLanguage();
  const status = latestPatientStatus({ latest, reminder, language });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--surface-strong)] shadow-sm"
          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]"
      }`}
    >
      <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-3">
        <MockWoundPhoto imageDataUrl={latest?.imageDataUrl} className="aspect-square" />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--ink)]">
                {patient.patientCode}
              </p>
              <p className="truncate text-[11px] font-semibold text-[var(--muted)]">
                {patient.citizenIdMasked}
              </p>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {latest ? <PhaseBadge phase={latest.clinicalPhase} /> : null}
            {latest ? <RiskBadge risk={latest.riskLevel} /> : null}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
            {t("lastUpdate")}:{" "}
            {latest ? formatDate(latest.createdAt, language) : "-"}
          </p>
        </div>
      </div>
    </button>
  );
}

function DoctorPatientListDrawer({
  open,
  patients,
  assessments,
  reminders,
  selectedPatientId,
  onSelectPatient,
  onAddPatient,
  onClose,
}: {
  open: boolean;
  patients: Patient[];
  assessments: AssessmentRecord[];
  reminders: DailyReminder[];
  selectedPatientId?: string;
  onSelectPatient: (patient: Patient, record?: AssessmentRecord) => void;
  onAddPatient: () => void;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.replace(/\D/g, "").toLowerCase();
  const cleanQuery = query.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    if (!cleanQuery) return true;
    return (
      patient.patientCode.toLowerCase().includes(cleanQuery) ||
      patient.citizenIdMasked.toLowerCase().includes(cleanQuery) ||
      patient.citizenIdMock.includes(normalizedQuery) ||
      localize(patient.woundLocation, language).toLowerCase().includes(cleanQuery)
    );
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("close")}
        className="doctor-patient-drawer-backdrop absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />
      <aside className="doctor-patient-drawer absolute inset-y-0 left-0 flex w-[min(92vw,360px)] flex-col border-r border-[var(--line)] bg-[var(--phone-bg)] text-[var(--ink)] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--primary)]">
              {t("doctorSystemLabel")}
            </p>
            <h2 className="truncate text-lg font-black">
              {t("patientsUnderCare")}
            </h2>
          </div>
          <IconButton icon={ChevronLeft} label={t("close")} onClick={onClose} />
        </div>

        <div className="grid gap-3 border-b border-[var(--line)] p-4">
          <TextInput
            label={t("search")}
            placeholder={t("patientSearchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button
            icon={Plus}
            onClick={() => {
              onAddPatient();
              onClose();
            }}
          >
            {t("addPatientShort")}
          </Button>
        </div>

        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-2">
            {filteredPatients.map((patient) => {
              const latest = latestAssessmentFor(patient.id, assessments);
              return (
                <DoctorSidebarPatientCard
                  key={patient.id}
                  patient={patient}
                  latest={latest}
                  reminder={reminders.find((item) => item.patientId === patient.id)}
                  selected={patient.id === selectedPatientId}
                  onSelect={() => {
                    onSelectPatient(patient, latest);
                    onClose();
                  }}
                />
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

function DoctorPatientTrackingScreen({
  patient,
  patients,
  assessments,
  corrections,
  reminders,
  onNavigate,
  onSelectPatient,
}: {
  patient: Patient;
  patients: Patient[];
  assessments: AssessmentRecord[];
  corrections: DoctorCorrection[];
  reminders: DailyReminder[];
  onNavigate: (page: AppPage) => void;
  onSelectPatient: (patient: Patient, record?: AssessmentRecord) => void;
}) {
  const { language, t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const records = patientAssessments(patient.id, assessments);
  const latest = records[records.length - 1];
  const correction = getCorrection(latest?.id, corrections);

  const openCorrection = () => {
    if (latest) onSelectPatient(patient, latest);
    onNavigate("aiCorrection");
  };

  return (
    <>
      <DoctorPatientListDrawer
        open={drawerOpen}
        patients={patients}
        assessments={assessments}
        reminders={reminders}
        selectedPatientId={patient.id}
        onSelectPatient={onSelectPatient}
        onAddPatient={() => onNavigate("addPatient")}
        onClose={() => setDrawerOpen(false)}
      />

      <ScreenHeader title={t("patientTracking")} eyebrow={t("doctorSystemLabel")}>
        <p>{t("addPatientCitizenFirst")}</p>
      </ScreenHeader>

      <Button
        variant="secondary"
        icon={Users}
        onClick={() => setDrawerOpen(true)}
        className="w-full"
      >
        {t("patientListDrawer")}
      </Button>

      <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[var(--primary)]">
                {t("currentlyViewingPatient")}
              </p>
              <h2 className="mt-1 text-2xl font-black">{patient.patientCode}</h2>
              <p className="text-sm font-semibold text-[var(--muted)]">
                {t("maskedCitizenId")}: {patient.citizenIdMasked}
              </p>
            </div>
            {latest ? (
              <div className="flex flex-wrap gap-2">
                <PhaseBadge phase={latest.clinicalPhase} />
                <RiskBadge risk={latest.riskLevel} />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCell label={t("age")} value={`${patient.age} ${t("years")}`} />
            <InfoCell label={t("diabetesYears")} value={`${patient.diabetesYears ?? "-"} ${t("years")}`} />
            <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
            <InfoCell label={t("assignedCHW")} value={patient.assignedCHW ?? "-"} />
            <InfoCell
              label={t("latestPhase")}
              value={latest ? <PhaseBadge phase={latest.clinicalPhase} /> : "-"}
            />
            <InfoCell
              label={t("latestRisk")}
              value={latest ? <RiskBadge risk={latest.riskLevel} /> : "-"}
            />
            <InfoCell
              label={t("lastUpdate")}
              value={latest ? formatDate(latest.createdAt, language) : "-"}
            />
            <InfoCell
              label={t("reviewStatus")}
              value={latest ? localize(REVIEW_STATUS_COPY[latest.reviewStatus], language) : "-"}
            />
          </div>
        </div>
      </Card>

      <DoctorAlertCard latest={latest} reminder={reminders.find((item) => item.patientId === patient.id)} correction={correction} />
      <DoctorLatestWoundSection
        patient={patient}
        latest={latest}
        correction={correction}
        onCorrect={openCorrection}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Button variant="secondary" icon={Camera} onClick={() => {}}>
          {t("viewLatestWound")}
        </Button>
        <Button variant="secondary" icon={Sparkles} onClick={() => {}}>
          {t("viewAiResult")}
        </Button>
        <Button icon={Edit3} onClick={openCorrection}>
          {t("correctAiResult")}
        </Button>
        <Button
          variant="secondary"
          icon={ClipboardList}
          onClick={() => onNavigate("clinicInterview")}
        >
          {t("recordClinicData")}
        </Button>
        <Button
          variant="danger"
          icon={Ambulance}
          onClick={() => onNavigate("emergency")}
          className="col-span-2"
        >
          {t("emergencyCall")}
        </Button>
      </div>
    </>
  );
}

function ChwSidebarPatientCard({
  patient,
  latest,
  consultationCase,
  selected,
  onSelect,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  consultationCase?: CHWConsultationCase;
  selected: boolean;
  onSelect: () => void;
}) {
  const { language, t } = useLanguage();
  const status = chwConsultationStatusView(consultationCase, t);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full max-w-full overflow-hidden rounded-lg border p-3 text-left transition ${
        selected
          ? "border-[var(--primary)] bg-[var(--surface-strong)] shadow-sm"
          : "border-[var(--line)] bg-[var(--surface)]"
      }`}
    >
      <div className="grid min-w-0 grid-cols-[54px_minmax(0,1fr)] gap-3">
        <MockWoundPhoto imageDataUrl={latest?.imageDataUrl} className="aspect-square" />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[var(--ink)]">
                {patient.patientCode}
              </p>
              <p className="truncate text-[11px] font-semibold text-[var(--muted)]">
                {patient.citizenIdMasked}
              </p>
            </div>
            <div className="ml-auto max-w-full">
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {latest ? <PhaseBadge phase={latest.clinicalPhase} /> : null}
            {latest ? <RiskBadge risk={latest.riskLevel} /> : null}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
            {t("lastUpdate")}:{" "}
            {latest ? formatDate(latest.createdAt, language) : "-"}
          </p>
        </div>
      </div>
    </button>
  );
}

function ChwPatientListContent({
  patients,
  assessments,
  consultationCases,
  selectedPatientId,
  onSelectPatient,
  onAddPatient,
  onCloseAfterSelect,
}: {
  patients: Patient[];
  assessments: AssessmentRecord[];
  consultationCases: CHWConsultationCase[];
  selectedPatientId?: string;
  onSelectPatient: (patient: Patient, record?: AssessmentRecord) => void;
  onAddPatient: () => void;
  onCloseAfterSelect?: () => void;
}) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.replace(/\D/g, "").toLowerCase();
  const cleanQuery = query.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    if (!cleanQuery) return true;
    return (
      patient.patientCode.toLowerCase().includes(cleanQuery) ||
      patient.citizenIdMasked.toLowerCase().includes(cleanQuery) ||
      patient.citizenIdMock.includes(normalizedQuery) ||
      localize(patient.woundLocation, language).toLowerCase().includes(cleanQuery)
    );
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="grid shrink-0 gap-3">
        <TextInput
          label={t("search")}
          placeholder={t("patientSearchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button icon={Plus} onClick={onAddPatient}>
          {t("addPatientShort")}
        </Button>
      </div>
      <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <div className="grid gap-3 pb-1">
          {filteredPatients.map((patient) => {
            const latest = latestAssessmentFor(patient.id, assessments);
            return (
              <ChwSidebarPatientCard
                key={patient.id}
                patient={patient}
                latest={latest}
                consultationCase={latestConsultationForPatient(patient.id, consultationCases)}
                selected={patient.id === selectedPatientId}
                onSelect={() => {
                  onSelectPatient(patient, latest);
                  onCloseAfterSelect?.();
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChwPatientListDrawer({
  open,
  patients,
  assessments,
  consultationCases,
  selectedPatientId,
  onSelectPatient,
  onAddPatient,
  onClose,
}: {
  open: boolean;
  patients: Patient[];
  assessments: AssessmentRecord[];
  consultationCases: CHWConsultationCase[];
  selectedPatientId?: string;
  onSelectPatient: (patient: Patient, record?: AssessmentRecord) => void;
  onAddPatient: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("close")}
        className="doctor-patient-drawer-backdrop absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />
      <aside className="doctor-patient-drawer absolute inset-y-0 left-0 flex w-[min(92vw,360px)] flex-col border-r border-[var(--line)] bg-[var(--phone-bg)] text-[var(--ink)] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
          <div className="min-w-0">
            <p className="text-xs font-black text-[var(--primary)]">
              {t("primaryCareSystemLabel")}
            </p>
            <h2 className="truncate text-lg font-black">
              {t("patientListDrawer")}
            </h2>
          </div>
          <IconButton icon={ChevronLeft} label={t("close")} onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <ChwPatientListContent
            patients={patients}
            assessments={assessments}
            consultationCases={consultationCases}
            selectedPatientId={selectedPatientId}
            onSelectPatient={onSelectPatient}
            onAddPatient={() => {
              onAddPatient();
              onClose();
            }}
            onCloseAfterSelect={onClose}
          />
        </div>
      </aside>
    </div>
  );
}

function ChwPatientTrackingScreen({
  patient,
  patients,
  assessments,
  consultationCases,
  reminders,
  onNavigate,
  onSelectPatient,
}: {
  patient: Patient;
  patients: Patient[];
  assessments: AssessmentRecord[];
  consultationCases: CHWConsultationCase[];
  reminders: DailyReminder[];
  onNavigate: (page: AppPage) => void;
  onSelectPatient: (patient: Patient, record?: AssessmentRecord) => void;
}) {
  const { language, t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const records = patientAssessments(patient.id, assessments);
  const latest = records[records.length - 1];
  const consultationCase = latestConsultationForPatient(patient.id, consultationCases);
  const consultationStatus = chwConsultationStatusView(consultationCase, t);
  const chwNote = latest ? localize(latest.chwNote ?? latest.note, language) : "-";
  const reminder = reminders.find((item) => item.patientId === patient.id);
  const missedDays = reminder?.missedDays ?? 0;
  const primaryCareStaff = MOCK_CHWS.find((chw) => chw.id === patient.assignedCHW) ?? MOCK_CHWS[0];

  return (
    <>
      <ChwPatientListDrawer
        open={drawerOpen}
        patients={patients}
        assessments={assessments}
        consultationCases={consultationCases}
        selectedPatientId={patient.id}
        onSelectPatient={onSelectPatient}
        onAddPatient={() => onNavigate("communityPatientList")}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="grid gap-4 lg:h-[calc(100vh-11rem)] lg:min-h-[640px] lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-6 lg:overflow-hidden">
        <aside className="hidden min-h-0 lg:flex">
          <Card className="flex h-full min-h-0 w-full flex-col overflow-hidden border-[var(--line)] p-4 shadow-lg">
            <div className="mb-3 shrink-0 border-b border-[var(--line)] pb-3">
              <p className="text-xs font-black text-[var(--primary)]">
                {t("primaryCareSystemLabel")}
              </p>
              <h2 className="text-lg font-black">{t("patientListDrawer")}</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ChwPatientListContent
                patients={patients}
                assessments={assessments}
                consultationCases={consultationCases}
                selectedPatientId={patient.id}
                onSelectPatient={onSelectPatient}
                onAddPatient={() => onNavigate("communityPatientList")}
              />
            </div>
          </Card>
        </aside>

        <section className="min-w-0 lg:min-h-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-[var(--line)] lg:bg-[var(--surface)] lg:shadow-lg">
          <div className="app-scrollbar grid gap-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:p-5">
          <ScreenHeader title={t("communityPatientTracking")} eyebrow={t("primaryCareSystemLabel")}>
            <p>{t("publicHealthWorkflow")}</p>
          </ScreenHeader>

          <Button
            variant="secondary"
            icon={Users}
            onClick={() => setDrawerOpen(true)}
            className="w-full lg:hidden"
          >
            {t("patientListDrawer")}
          </Button>

          <div className="app-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 md:grid md:grid-cols-5 md:overflow-visible">
            {[t("patientListWorkflow"), t("woundPhotoWorkflow"), t("aiResultWorkflow"), t("sendDoctorWorkflow"), t("followUpWorkflow")].map((item, index) => (
              <div
                key={item}
                className="grid min-h-14 min-w-24 place-items-center rounded-md bg-[var(--surface-soft)] px-1 text-center text-[10px] font-black leading-tight text-[var(--primary)] md:min-w-0"
              >
                <span>{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--primary)]">
                  {t("currentlyViewingPatient")}
                </p>
                <h2 className="mt-1 text-2xl font-black">{patient.patientCode}</h2>
                <p className="text-sm font-semibold text-[var(--muted)]">
                  {t("maskedCitizenId")}: {patient.citizenIdMasked}
                </p>
              </div>
              <Badge tone={consultationStatus.tone}>{consultationStatus.label}</Badge>
            </div>
          </Card>

          <ChwSectionCard title={t("patientInfo")} icon={Users}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCell label={t("patientCode")} value={patient.patientCode} />
              <InfoCell label={t("maskedCitizenId")} value={patient.citizenIdMasked} />
              <InfoCell label={t("age")} value={`${patient.age} ${t("years")}`} />
              <InfoCell label={t("gender")} value={localize(patient.gender, language)} />
              <InfoCell label={t("diabetesYears")} value={`${patient.diabetesYears ?? "-"} ${t("years")}`} />
              <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
              <InfoCell label={t("assignedPrimaryCareStaff")} value={primaryCareStaff.name} />
              <InfoCell label={t("rhpcName")} value={patient.preferredClinicId ?? primaryCareStaff.id} />
            </div>
          </ChwSectionCard>

          {latest ? (
            <>
              <ChwSectionCard title={t("latestWoundPhoto")} icon={Camera}>
                <div className="grid gap-4 md:grid-cols-[minmax(180px,0.9fr)_minmax(0,1fr)]">
                  <MockWoundPhoto imageDataUrl={latest.imageDataUrl} withSegmentation />
                  <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                      {latest.isRealDatasetImage ? <Badge tone="success">{t("realDatasetImage")}</Badge> : null}
                      <Badge tone="primary">{t("uploadedBy")}: {roleDisplayName(latest.createdByRole, language)}</Badge>
                    </div>
                    <InfoCell label={t("uploadedDate")} value={formatDateTime(latest.createdAt, language)} />
                    <InfoCell label={t("visitType")} value={localize(VISIT_TYPE_COPY[latest.visitType], language)} />
                  </div>
                </div>
              </ChwSectionCard>

              <ChwSectionCard title={t("latestAiResult")} icon={Sparkles}>
                <div className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <PhaseBadge phase={latest.clinicalPhase} />
                    <RiskBadge risk={latest.riskLevel} />
                    <Badge tone="primary">{t("aiConfidence")}: {latest.aiConfidence}%</Badge>
                  </div>
                  <TissueBars record={latest} />
                  <div>
                    <p className="text-xs font-black text-[var(--muted)]">{t("recommendation")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
                      {localize(latest.recommendation, language)}
                    </p>
                  </div>
                  <DatasetSourceBox record={latest} />
                  <p className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                    {t("medicalDisclaimer")}
                  </p>
                </div>
              </ChwSectionCard>

              <ChwSectionCard
                title={t("sendDoctorSection")}
                icon={Upload}
                action={<Badge tone={consultationStatus.tone}>{consultationStatus.label}</Badge>}
              >
                <div className="grid gap-3">
                  <InfoCell label={t("chwNote")} value={chwNote} />
                  <InfoCell
                    label={t("sendReason")}
                    value={
                      latest.riskLevel === "high" || latest.riskLevel === "urgent"
                        ? t("aiHighRiskReason")
                        : t("needDoctorAssessment")
                    }
                  />
                  <Button icon={Upload} onClick={() => onNavigate("sendDoctorReview")}>
                    {t("sendToDoctorReview")}
                  </Button>
                </div>
              </ChwSectionCard>

              <ChwSectionCard title={t("followUpProgress")} icon={LineChartIcon}>
                <div className="grid gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoCell label={t("doctorResponse")} value={consultationCase?.doctorResponse ?? t("noDoctorResponseYet")} />
                    <InfoCell label={t("treatmentAdvice")} value={consultationCase?.doctorTreatmentAdvice ?? "-"} />
                    <InfoCell
                      label={t("treatmentTrend")}
                      value={`${t("phase")} ${phaseNumber(latest.clinicalPhase)} / ${localize(RISK_COPY[latest.riskLevel].label, language)}`}
                    />
                    <InfoCell label={t("nextVisitReminder")} value={reminder?.reminderTime ?? "-"} />
                    <InfoCell
                      label={t("missedFollowUpStatus")}
                      value={missedDays > 0 ? `${missedDays} ${t("days")}` : t("noMissedFollowUp")}
                    />
                    <InfoCell
                      label={t("consultationStatus")}
                      value={<Badge tone={consultationStatus.tone}>{consultationStatus.label}</Badge>}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="secondary" icon={CheckCircle2} onClick={() => {}}>
                      {t("markAcknowledged")}
                    </Button>
                    <Button variant="secondary" icon={Phone} onClick={() => onNavigate("emergency")}>
                      {t("callDoctor")}
                    </Button>
                  </div>
                </div>
              </ChwSectionCard>
            </>
          ) : (
            <Card>
              <p className="text-sm font-semibold text-[var(--muted)]">{t("selectPatientFirst")}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" icon={Camera} onClick={() => {}}>
              {t("viewLatestWound")}
            </Button>
            <Button variant="secondary" icon={Sparkles} onClick={() => {}}>
              {t("viewAiResult")}
            </Button>
            <Button
              variant="secondary"
              icon={ClipboardList}
              onClick={() => onNavigate("addCommunityVisit")}
            >
              {t("visit")}
            </Button>
            <Button icon={Upload} onClick={() => onNavigate("sendDoctorReview")}>
              {t("sendToDoctorReview")}
            </Button>
            <Button variant="secondary" icon={FileText} onClick={() => onNavigate("sendDoctorReview")}>
              {t("viewDoctorResponse")}
            </Button>
            <Button variant="secondary" icon={Phone} onClick={() => onNavigate("emergency")}>
              {t("callDoctor")}
            </Button>
            <Button
              variant="danger"
              icon={Ambulance}
              onClick={() => onNavigate("emergency")}
              className="col-span-2"
            >
              {t("emergencyCall")}
            </Button>
          </div>
          </div>
        </section>
      </div>
    </>
  );
}

function DoctorAlertCard({
  latest,
  reminder,
  correction,
}: {
  latest?: AssessmentRecord;
  reminder?: DailyReminder;
  correction?: DoctorCorrection;
}) {
  const { t } = useLanguage();
  const alerts = [
    latest?.reviewStatus === "pending" ? t("alertAiPending") : "",
    (reminder?.missedDays ?? 0) > 0 ? t("alertMissedPhoto") : "",
    latest?.clinicalPhase === "phase4" || latest?.clinicalPhase === "phase5"
      ? t("alertPhase45")
      : "",
    latest?.createdByRole === "chw" ? t("alertChwSent") : "",
    latest && !correction && (latest.riskLevel === "high" || latest.riskLevel === "urgent")
      ? t("alertCorrectionNeeded")
      : "",
  ].filter(Boolean);

  if (!alerts.length) return null;

  return (
    <Card className="border-red-400/50 bg-red-500/10">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-red-500/15 text-[var(--danger)]">
          <ShieldAlert size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="font-black text-[var(--danger)]">{t("alerts")}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">
            {t("doctorAlertCopy")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <Badge key={alert} tone="danger">
                {alert}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function DoctorLatestWoundSection({
  patient,
  latest,
  correction,
  onCorrect,
}: {
  patient: Patient;
  latest?: AssessmentRecord;
  correction?: DoctorCorrection;
  onCorrect?: () => void;
}) {
  const { language, t } = useLanguage();
  if (!latest) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">{t("selectPatientFirst")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid content-start gap-3 xl:self-start">
          <MockWoundPhoto
            imageDataUrl={latest.imageDataUrl}
            withSegmentation
            className="xl:max-h-[280px]"
          />
          <div className="grid auto-rows-auto content-start items-start gap-3 sm:grid-cols-2">
            <InfoCell label={t("lastUpdate")} value={formatDateTime(latest.createdAt, language)} />
            <InfoCell label={t("uploadedBy")} value={roleDisplayName(latest.createdByRole, language)} />
            <InfoCell label={t("visitType")} value={localize(VISIT_TYPE_COPY[latest.visitType], language)} />
            <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
          </div>
          <div className="grid gap-3 2xl:grid-cols-2">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <p className="text-xs font-black text-[var(--muted)]">
                {t("originalAiResult")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PhaseBadge phase={latest.clinicalPhase} />
                <RiskBadge risk={latest.riskLevel} />
              </div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                {localize(latest.recommendation, language)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--primary)] bg-[var(--surface-strong)] p-3">
              <p className="text-xs font-black text-[var(--primary)]">
                {t("correctedByDoctor")}
              </p>
              {correction ? (
                <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PhaseBadge phase={correction.correctedClinicalPhase} />
                    <RiskBadge risk={correction.correctedRiskLevel} />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                    {localize(correction.doctorNote, language)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                  {t("noCorrection")}
                </p>
              )}
              {onCorrect ? (
                <Button icon={Edit3} onClick={onCorrect} className="mt-3 w-full">
                  {t("correctAiResult")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <PhaseBadge phase={latest.clinicalPhase} />
              <RiskBadge risk={latest.riskLevel} />
              {latest.isRealDatasetImage ? (
                <Badge tone="success">{t("realDatasetImage")}</Badge>
              ) : null}
              <Badge tone="primary">
                {t("aiConfidence")}: {latest.aiConfidence}%
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {localize(latest.recommendation, language)}
            </p>
          </div>
          <SensationSummary record={latest} />
          <DatasetSourceBox record={latest} />
          <TissueBars record={latest} />
        </div>
      </div>
    </Card>
  );
}

function DoctorDashboardScreen({
  patients,
  assessments,
  corrections,
  reminders,
  consultationCases,
  onNavigate,
}: {
  patients: Patient[];
  assessments: AssessmentRecord[];
  corrections: DoctorCorrection[];
  reminders: DailyReminder[];
  consultationCases: CHWConsultationCase[];
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  const pending = assessments.filter((record) => record.reviewStatus === "pending");
  const urgent = assessments.filter((record) => record.riskLevel === "urgent");
  const activeReminders = reminders.filter((item) => item.active);
  const pendingConsultations = consultationCases.filter(
    (item) => item.status === "pending" || item.status === "urgent",
  );

  return (
    <>
      <ScreenHeader title={t("doctorDashboard")} eyebrow={t("appName")}>
        <p>{t("medicalDisclaimer")}</p>
      </ScreenHeader>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("patientList")} value={patients.length} icon={Users} />
        <StatCard label={t("pendingCases")} value={pending.length} icon={Sparkles} tone="warning" />
        <StatCard label={t("urgentCases")} value={urgent.length} icon={Ambulance} tone="danger" />
        <StatCard label={t("correctedCases")} value={corrections.length} icon={Edit3} tone="success" />
      </div>
      <Card className="hidden lg:block">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{t("patientList")}</h2>
            <Button variant="secondary" icon={Search} onClick={() => onNavigate("doctorSearch")}>
              {t("patientTracking")}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-black uppercase tracking-normal text-[var(--muted)]">
                  <th className="py-3 pr-4">{t("patientCode")}</th>
                  <th className="py-3 pr-4">{t("maskedCitizenId")}</th>
                  <th className="py-3 pr-4">{t("latestPhase")}</th>
                  <th className="py-3 pr-4">{t("latestRisk")}</th>
                  <th className="py-3 pr-4">{t("lastUpdate")}</th>
                  <th className="py-3 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const latestRecord = latestAssessmentFor(patient.id, assessments);
                  return (
                    <tr key={patient.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="py-3 pr-4 font-black">{patient.patientCode}</td>
                      <td className="py-3 pr-4 text-[var(--muted)]">{patient.citizenIdMasked}</td>
                      <td className="py-3 pr-4">{latestRecord ? <PhaseBadge phase={latestRecord.clinicalPhase} /> : "-"}</td>
                      <td className="py-3 pr-4">{latestRecord ? <RiskBadge risk={latestRecord.riskLevel} /> : "-"}</td>
                      <td className="py-3 pr-4 text-[var(--muted)]">
                        {latestRecord ? formatDate(latestRecord.createdAt, language) : "-"}
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" icon={Search} onClick={() => onNavigate("doctorSearch")}>
                            {t("viewDetails")}
                          </Button>
                          <Button icon={Edit3} onClick={() => onNavigate("aiPendingReview")}>
                            {t("aiReview")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      <Card className="border-amber-400/40 bg-amber-400/10">
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">{t("chwCasesPending")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                {t("chwConsultationNotice")}
              </p>
            </div>
            <Badge tone="warning">{pendingConsultations.length}</Badge>
          </div>
          <Button variant="secondary" icon={Upload} onClick={() => onNavigate("doctorChwCases")}>
            {t("chwCases")}
          </Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button icon={Search} onClick={() => onNavigate("doctorSearch")}>
          {t("patientTracking")}
        </Button>
        <Button variant="secondary" icon={Sparkles} onClick={() => onNavigate("aiPendingReview")}>
          {t("aiPendingReview")}
        </Button>
        <Button variant="secondary" icon={UserPlus} onClick={() => onNavigate("addPatient")}>
          {t("addAnotherPatient")}
        </Button>
        <Button variant="secondary" icon={Database} onClick={() => onNavigate("datasetReference")}>
          {t("datasetReference")}
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card>
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black">{t("afterWorkReview")}</h2>
            <Badge tone="warning">{pending.length}</Badge>
          </div>
          {pending.slice(0, 3).map((record) => (
            <AssessmentCard
              key={record.id}
              record={record}
              corrections={corrections}
              patient={patients.find((patient) => patient.id === record.patientId)}
              action={
                <Button icon={Edit3} onClick={() => onNavigate("aiCorrection")}>
                  {t("aiCorrection")}
                </Button>
              }
            />
          ))}
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <InfoCell label={t("activeReminders")} value={activeReminders.length} />
          <InfoCell
            label={t("missedFollowUp")}
            value={activeReminders.reduce((sum, item) => sum + item.missedDays, 0)}
          />
        </div>
      </Card>
      </div>
    </>
  );
}

function PatientTrackingScreen({
  role,
  patients,
  assessments,
  selectedPatient,
  onFound,
  onNavigate,
}: {
  role: RoleId;
  patients: Patient[];
  assessments: AssessmentRecord[];
  selectedPatient?: Patient;
  onFound: (patient: Patient) => void;
  onNavigate: (page: AppPage) => void;
}) {
  const { t } = useLanguage();
  const latest = latestAssessmentFor(selectedPatient?.id, assessments);

  return (
    <>
      <ScreenHeader title={t("patientTracking")}>
        <p>{t("addPatientCitizenFirst")}</p>
      </ScreenHeader>
      <PatientSearchBox patients={patients} onFound={onFound} />
      {selectedPatient ? (
        <PatientIdentityBanner
          patient={selectedPatient}
          latest={latest}
          onOpenHistory={() =>
            onNavigate(role === "doctor" ? "patientProfile" : "communityPatientList")
          }
          onAddRecord={() =>
            onNavigate(role === "doctor" ? "clinicInterview" : "addCommunityVisit")
          }
          onAddAnother={() => onNavigate(role === "doctor" ? "addPatient" : "chwSearch")}
        />
      ) : null}
    </>
  );
}

function DoctorChwCasesScreen({
  cases,
  patients,
  assessments,
  corrections,
  setConsultationCases,
  setCorrections,
  setAssessments,
}: {
  cases: CHWConsultationCase[];
  patients: Patient[];
  assessments: AssessmentRecord[];
  corrections: DoctorCorrection[];
  setConsultationCases: Dispatch<SetStateAction<CHWConsultationCase[]>>;
  setCorrections: Dispatch<SetStateAction<DoctorCorrection[]>>;
  setAssessments: Dispatch<SetStateAction<AssessmentRecord[]>>;
}) {
  const { t } = useLanguage();
  const sortedCases = [...cases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <>
      <ScreenHeader title={t("chwCases")} eyebrow={t("doctorSystemLabel")}>
        <p>{t("chwConsultationNotice")}</p>
      </ScreenHeader>
      {sortedCases.length ? (
        <div className="grid gap-3">
          {sortedCases.map((caseItem) => (
            <DoctorChwCaseCard
              key={caseItem.id}
              caseItem={caseItem}
              patient={patients.find((patient) => patient.id === caseItem.patientId)}
              assessment={assessments.find((record) => record.id === caseItem.assessmentId)}
              corrections={corrections}
              setConsultationCases={setConsultationCases}
              setCorrections={setCorrections}
              setAssessments={setAssessments}
            />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-[var(--muted)]">{t("selectPatientFirst")}</p>
        </Card>
      )}
    </>
  );
}

function DoctorChwCaseCard({
  caseItem,
  patient,
  assessment,
  corrections,
  setConsultationCases,
  setCorrections,
  setAssessments,
}: {
  caseItem: CHWConsultationCase;
  patient?: Patient;
  assessment?: AssessmentRecord;
  corrections: DoctorCorrection[];
  setConsultationCases: Dispatch<SetStateAction<CHWConsultationCase[]>>;
  setCorrections: Dispatch<SetStateAction<DoctorCorrection[]>>;
  setAssessments: Dispatch<SetStateAction<AssessmentRecord[]>>;
}) {
  const { language, t } = useLanguage();
  const existingCorrection = getCorrection(caseItem.assessmentId, corrections);
  const [status, setStatus] = useState<CHWConsultationCase["status"]>(caseItem.status);
  const [phase, setPhase] = useState<ClinicalPhase>(
    caseItem.doctorCorrectedPhase ?? existingCorrection?.correctedClinicalPhase ?? caseItem.aiPhase,
  );
  const [risk, setRisk] = useState<RiskLevel>(
    caseItem.doctorCorrectedRiskLevel ?? existingCorrection?.correctedRiskLevel ?? caseItem.aiRiskLevel,
  );
  const [response, setResponse] = useState(caseItem.doctorResponse ?? "");
  const [advice, setAdvice] = useState(caseItem.doctorTreatmentAdvice ?? "");
  const [message, setMessage] = useState("");

  const save = () => {
    const now = new Date().toISOString();
    setConsultationCases((previous) =>
      previous.map((item) =>
        item.id === caseItem.id
          ? {
              ...item,
              status,
              doctorResponse: response,
              doctorTreatmentAdvice: advice,
              doctorCorrectedPhase: phase,
              doctorCorrectedRiskLevel: risk,
              reviewedAt: now,
            }
          : item,
      ),
    );
    if (assessment && patient) {
      const correction: DoctorCorrection = {
        id: existingCorrection?.id ?? `correction-${caseItem.id}`,
        patientId: patient.id,
        assessmentId: assessment.id,
        correctedBy: DEFAULT_DOCTOR_ID,
        originalAiPhase: existingCorrection?.originalAiPhase ?? assessment.clinicalPhase,
        correctedClinicalPhase: phase,
        originalRiskLevel: existingCorrection?.originalRiskLevel ?? assessment.riskLevel,
        correctedRiskLevel: risk,
        originalGranulationPercent: assessment.granulationPercent,
        originalFibrinPercent: assessment.fibrinPercent,
        originalCallusPercent: assessment.callusPercent,
        originalNecroticPercent: assessment.necroticPercent,
        correctedGranulationPercent: assessment.granulationPercent,
        correctedFibrinPercent: assessment.fibrinPercent,
        correctedCallusPercent: assessment.callusPercent,
        correctedNecroticPercent: assessment.necroticPercent,
        doctorNote: text(response || t("chwCases"), response || t("chwCases")),
        treatmentAdvice: text(advice || t("treatmentAdvice"), advice || t("treatmentAdvice")),
        notifyPatient: true,
        createdAt: now,
      };
      setCorrections((previous) => [
        ...previous.filter((item) => item.assessmentId !== assessment.id),
        correction,
      ]);
      setAssessments((previous) =>
        previous.map((record) =>
          record.id === assessment.id
            ? {
                ...record,
                reviewStatus: "corrected",
                doctorNote: correction.doctorNote,
                treatmentAdvice: correction.treatmentAdvice,
                updatedAt: now,
              }
            : record,
        ),
      );
    }
    setMessage(t("saved"));
  };

  return (
    <Card className="border-[var(--line)]">
      <div className="grid gap-4">
        <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
          <MockWoundPhoto imageDataUrl={caseItem.woundImageUrl} className="aspect-square" />
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge tone={caseItem.status === "urgent" ? "danger" : "warning"}>
                {caseItem.status}
              </Badge>
              <Badge tone="primary">{t("chwCases")}</Badge>
            </div>
            <h2 className="mt-2 font-black">{caseItem.patientCode}</h2>
            <p className="text-xs font-semibold text-[var(--muted)]">
              {caseItem.citizenIdMasked}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
          {t("chwConsultationNotice")}
        </div>
        {assessment ? (
          <AssessmentCard record={assessment} corrections={corrections} patient={patient} />
        ) : null}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
          <p className="text-xs font-black text-[var(--muted)]">{t("chwNote")}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
            {caseItem.chwNote}
          </p>
          <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
            {caseItem.chwName} / {caseItem.rhpcName} / {formatDateTime(caseItem.createdAt, language)}
          </p>
        </div>
        <div className="grid gap-3">
          <SelectField
            label={t("caseStatus")}
            value={status}
            onChange={setStatus}
            options={[
              { value: "pending", label: "pending" },
              { value: "reviewed", label: "reviewed" },
              { value: "referred", label: "referred" },
              { value: "urgent", label: "urgent" },
            ]}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label={t("phase")}
              value={phase}
              onChange={setPhase}
              options={Object.keys(PHASE_COPY).map((value) => ({
                value: value as ClinicalPhase,
                label: `${t("phase")} ${PHASE_COPY[value as ClinicalPhase].number}`,
              }))}
            />
            <SelectField
              label={t("riskLevel")}
              value={risk}
              onChange={setRisk}
              options={Object.keys(RISK_COPY).map((value) => ({
                value: value as RiskLevel,
                label: localize(RISK_COPY[value as RiskLevel].label, language),
              }))}
            />
          </div>
          <TextArea
            label={t("doctorResponse")}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
          />
          <TextArea
            label={t("treatmentAdvice")}
            value={advice}
            onChange={(event) => setAdvice(event.target.value)}
          />
          <Button icon={CheckCircle2} onClick={save}>
            {t("save")}
          </Button>
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>
      </div>
    </Card>
  );
}

function PatientProfileScreen({
  patient,
  assessments,
  corrections,
  onNavigate,
}: {
  patient: Patient;
  assessments: AssessmentRecord[];
  corrections: DoctorCorrection[];
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  const records = patientAssessments(patient.id, assessments).reverse();
  const latest = records[0];

  return (
    <>
      <ScreenHeader title={t("patientProfile")} eyebrow={patient.patientCode} />
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <PatientSummaryPanel patient={patient} latest={latest} />
      </div>
      <div className="grid gap-4">
      <div className="lg:hidden">
      <PatientIdentityBanner
        patient={patient}
        latest={latest}
        onAddRecord={() => onNavigate("clinicInterview")}
        onAddAnother={() => onNavigate("addPatient")}
      />
      </div>
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCell label={t("assignedDoctor")} value={patient.assignedDoctor ?? "-"} />
          <InfoCell label={t("assignedCHW")} value={patient.assignedCHW ?? "-"} />
          <InfoCell label={t("diabetesYears")} value={`${patient.diabetesYears ?? "-"} ${t("years")}`} />
          <InfoCell label={t("woundLocation")} value={localize(patient.woundLocation, language)} />
        </div>
      </Card>
      <div className="grid gap-3">
        {records.map((record) => (
          <AssessmentCard
            key={record.id}
            record={record}
            corrections={corrections}
            patient={patient}
            action={
              <Button variant="secondary" icon={Edit3} onClick={() => onNavigate("aiCorrection")}>
                {t("aiCorrection")}
              </Button>
            }
          />
        ))}
      </div>
      </div>
      </div>
    </>
  );
}

function ClinicalRecordForm({
  patient,
  role,
  titleKey,
  visitType,
  onSave,
}: {
  patient: Patient;
  role: RoleId;
  titleKey: TranslationKey;
  visitType: AssessmentRecord["visitType"];
  onSave: (record: AssessmentRecord) => Promise<void>;
}) {
  const { language, t } = useLanguage();
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [symptoms, setSymptoms] = useState<SymptomForm>(initialSymptoms);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const record = createAssessmentFromSymptoms({
      patient,
      role,
      visitType,
      imageDataUrl: imageDataUrl || `mock-new-${Date.now()}`,
      symptoms,
      language,
    });
    setMessage(t("loading"));
    try {
      await onSave({
        ...record,
        note: text(note || localize(record.note, "th"), note || localize(record.note, "en")),
      });
      setMessage(t("formSaved"));
    } catch (error) {
      setMessage(`${t("failedToSave")}: ${formatSupabaseError(error)}`);
    }
  };

  return (
    <>
      <ScreenHeader title={t(titleKey)} eyebrow={patient.patientCode}>
        <p>{role === "chw" ? t("primaryCareSystemLabel") : t("addPatientCitizenFirst")}</p>
      </ScreenHeader>
      <PatientIdentityBanner patient={patient} latest={undefined} />
      <Card className={role === "chw" ? "border-[var(--primary)] bg-[var(--surface)]" : ""}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <PhotoCapture value={imageDataUrl} onChange={setImageDataUrl} />
          <SymptomChecklist symptoms={symptoms} setSymptoms={setSymptoms} />
          <TextArea
            label={role === "doctor" ? t("doctorNote") : t("chwNote")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Button type="submit" icon={CheckCircle2}>
            {t("save")}
          </Button>
          {role === "chw" ? (
            <Button type="submit" variant="secondary" icon={Upload}>
              {t("sendToDoctorReview")}
            </Button>
          ) : null}
          {message ? <Badge tone="success">{message}</Badge> : null}
        </form>
      </Card>
    </>
  );
}

function AiPendingReviewScreen({
  patients,
  assessments,
  corrections,
  onSelectPatient,
  onNavigate,
}: {
  patients: Patient[];
  assessments: AssessmentRecord[];
  corrections: DoctorCorrection[];
  onSelectPatient: (patient: Patient, record?: AssessmentRecord) => void;
  onNavigate: (page: AppPage) => void;
}) {
  const { t } = useLanguage();
  const pending = assessments
    .filter((record) => record.reviewStatus === "pending")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <ScreenHeader title={t("aiPendingReview")}>
        <p>{t("afterWorkReview")}</p>
      </ScreenHeader>
      <div className="grid gap-3">
        {pending.map((record) => {
          const patient = patients.find((item) => item.id === record.patientId);
          return (
            <AssessmentCard
              key={record.id}
              record={record}
              corrections={corrections}
              patient={patient}
              action={
                <Button
                  icon={Edit3}
                  onClick={() => {
                    if (patient) onSelectPatient(patient, record);
                    onNavigate("aiCorrection");
                  }}
                >
                  {t("aiCorrection")}
                </Button>
              }
            />
          );
        })}
      </div>
    </>
  );
}

function AiCorrectionScreen({
  patient,
  assessment,
  corrections,
  setCorrections,
  setAssessments,
}: {
  patient?: Patient;
  assessment?: AssessmentRecord;
  corrections: DoctorCorrection[];
  setCorrections: Dispatch<SetStateAction<DoctorCorrection[]>>;
  setAssessments: Dispatch<SetStateAction<AssessmentRecord[]>>;
}) {
  const { language, t } = useLanguage();
  const existing = getCorrection(assessment?.id, corrections);
  const [phase, setPhase] = useState<ClinicalPhase>(
    existing?.correctedClinicalPhase ?? assessment?.clinicalPhase ?? "phase2",
  );
  const [risk, setRisk] = useState<RiskLevel>(
    existing?.correctedRiskLevel ?? assessment?.riskLevel ?? "medium",
  );
  const [doctorNote, setDoctorNote] = useState(localize(existing?.doctorNote, language));
  const [treatmentAdvice, setTreatmentAdvice] = useState(localize(existing?.treatmentAdvice, language));
  const [message, setMessage] = useState("");

  if (!patient || !assessment) {
    return (
      <>
        <ScreenHeader title={t("aiCorrection")} />
        <Card>
          <p className="text-sm text-[var(--muted)]">{t("selectPatientFirst")}</p>
        </Card>
      </>
    );
  }

  const saveCorrection = () => {
    const correction: DoctorCorrection = {
      id: existing?.id ?? `correction-${Date.now()}`,
      patientId: patient.id,
      assessmentId: assessment.id,
      correctedBy: patient.assignedDoctor ?? "DiaWound Track Doctor",
      originalAiPhase: existing?.originalAiPhase ?? assessment.clinicalPhase,
      correctedClinicalPhase: phase,
      originalRiskLevel: existing?.originalRiskLevel ?? assessment.riskLevel,
      correctedRiskLevel: risk,
      originalGranulationPercent:
        existing?.originalGranulationPercent ?? assessment.granulationPercent,
      originalFibrinPercent: existing?.originalFibrinPercent ?? assessment.fibrinPercent,
      originalCallusPercent: existing?.originalCallusPercent ?? assessment.callusPercent,
      originalNecroticPercent:
        existing?.originalNecroticPercent ?? assessment.necroticPercent,
      correctedGranulationPercent: assessment.granulationPercent,
      correctedFibrinPercent: assessment.fibrinPercent,
      correctedCallusPercent: assessment.callusPercent,
      correctedNecroticPercent: assessment.necroticPercent,
      doctorNote: text(doctorNote, doctorNote),
      treatmentAdvice: text(treatmentAdvice, treatmentAdvice),
      notifyPatient: true,
      createdAt: new Date().toISOString(),
    };
    setCorrections((previous) => [
      ...previous.filter((item) => item.assessmentId !== assessment.id),
      correction,
    ]);
    setAssessments((previous) =>
      previous.map((record) =>
        record.id === assessment.id
          ? {
              ...record,
              reviewStatus: "corrected",
              updatedAt: new Date().toISOString(),
              doctorNote: correction.doctorNote,
              treatmentAdvice: correction.treatmentAdvice,
            }
          : record,
      ),
    );
    setMessage(t("saved"));
  };

  return (
    <>
      <ScreenHeader title={t("aiCorrection")} eyebrow={patient.patientCode}>
        <p>{t("medicalDisclaimer")}</p>
      </ScreenHeader>
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
      <Card className="border-[var(--line)]">
        <div className="grid gap-3">
          <h2 className="text-lg font-black">{t("originalAiResult")}</h2>
          <div className="flex flex-wrap gap-2">
            <PhaseBadge phase={assessment.clinicalPhase} />
            <RiskBadge risk={assessment.riskLevel} />
          </div>
          <MockWoundPhoto imageDataUrl={assessment.imageDataUrl} withSegmentation />
          <SensationSummary record={assessment} />
          <DatasetSourceBox record={assessment} />
          <TissueBars record={assessment} />
        </div>
      </Card>
      <Card className="border-[var(--primary)]">
        <div className="grid gap-4">
          <h2 className="text-lg font-black">{t("correctedByDoctor")}</h2>
          <SelectField
            label={t("phase")}
            value={phase}
            onChange={setPhase}
            options={Object.entries(PHASE_COPY).map(([value, copy]) => ({
              value: value as ClinicalPhase,
              label: `${t("phase")} ${copy.number}: ${localize(copy.label, language)}`,
            }))}
          />
          <SelectField
            label={t("riskLevel")}
            value={risk}
            onChange={setRisk}
            options={Object.entries(RISK_COPY).map(([value, copy]) => ({
              value: value as RiskLevel,
              label: localize(copy.label, language),
            }))}
          />
          <TextArea
            label={t("doctorNote")}
            value={doctorNote}
            onChange={(event) => setDoctorNote(event.target.value)}
          />
          <TextArea
            label={t("treatmentAdvice")}
            value={treatmentAdvice}
            onChange={(event) => setTreatmentAdvice(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm font-black">
            <input type="checkbox" defaultChecked />
            <span>{t("notifyPatient")}</span>
          </label>
          <Button icon={CheckCircle2} onClick={saveCorrection}>
            {t("save")}
          </Button>
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>
      </Card>
      </div>
    </>
  );
}

function AddPatientScreen({
  patients,
  setPatients,
  onSelect,
}: {
  patients: Patient[];
  setPatients: Dispatch<SetStateAction<Patient[]>>;
  onSelect: (patient: Patient) => void;
}) {
  const { language, t } = useLanguage();
  const [citizenId, setCitizenId] = useState("");
  const [age, setAge] = useState(60);
  const [message, setMessage] = useState("");

  const savePatient = () => {
    const existing = findPatientByCitizenId(patients, citizenId);
    if (existing) {
      onSelect(existing);
      setMessage(`${t("patientFound")}: ${existing.patientCode}`);
      return;
    }
    const digits = citizenId.replace(/\D/g, "").padEnd(13, "0").slice(0, 13);
    const patient: Patient = {
      id: `patient-${Date.now()}`,
      patientCode: `WS-${1000 + patients.length + 1}`,
      citizenIdMock: digits,
      citizenIdMasked: maskCitizenId(digits),
      age,
      gender: text(language === "th" ? "หญิง" : "หญิง", "Female"),
      diabetesYears: 5,
      underlyingDisease: text("ข้อมูลจำลอง", "Mock data"),
      woundLocation: text("ฝ่าเท้า", "Sole"),
      carePath: "doctor",
      assignedDoctor: DEFAULT_DOCTOR_ID,
      assignedCHW: null,
      preferredClinicId: MOCK_CLINIC_PARTNERS[0]?.id,
      sourceChannel: "clinic",
      createdAt: new Date().toISOString(),
    };
    setPatients((previous) => [...previous, patient]);
    onSelect(patient);
    setMessage(`${t("saved")}: ${patient.patientCode}`);
  };

  return (
    <>
      <ScreenHeader title={t("addAnotherPatient")}>
        <p>{t("addPatientCitizenFirst")}</p>
      </ScreenHeader>
      <Card>
        <div className="grid gap-4">
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {t("prototypeCitizenWarning")}
          </div>
          <TextInput
            label={t("enterCitizenId")}
            inputMode="numeric"
            value={citizenId}
            placeholder={t("citizenPlaceholder")}
            onChange={(event) => setCitizenId(event.target.value)}
          />
          <TextInput
            label={t("age")}
            type="number"
            value={age}
            onChange={(event) => setAge(Number(event.target.value))}
          />
          <Button icon={UserPlus} onClick={savePatient}>
            {t("addAnotherPatient")}
          </Button>
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>
      </Card>
    </>
  );
}

function DatasetReferenceScreen({
  dataMode,
  onDataModeChange,
  onNavigate,
}: {
  dataMode: DataMode;
  onDataModeChange: (mode: DataMode) => void;
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  const source = DATASET_SOURCES[0];
  return (
    <>
      <ScreenHeader title={t("datasetReference")} eyebrow={source.name}>
        <p>{t("datasetExplanation")}</p>
      </ScreenHeader>
      <MedicalDisclaimerBox />
      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
          <MockWoundPhoto imageDataUrl="mock-dataset-reference" withSegmentation />
          <div className="grid content-start gap-4">
            <div className="grid gap-2">
              <h2 className="text-lg font-black">{t("datasetMainName")}</h2>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                {t("datasetWarning")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-black text-[var(--ink)]"
                href={source.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("github")}
              </a>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-black text-[var(--ink)]"
                href={source.paperUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("paper")}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              {source.mainClasses.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <h2 className="text-lg font-black">{t("datasetPreviewTesting")}</h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {t("datasetPreviewTestingCopy")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCell label={t("previewSampleCount")} value={`${DFUTISSUE_SAMPLE_ITEMS.length}/${DFUTISSUE_SAMPLE_TARGET}`} />
            <InfoCell label={t("dataMode")} value={t(dataMode === "real_dataset_preview" ? "realDatasetPreviewMode" : "mockDataMode")} />
          </div>
          <DataModeSwitcher mode={dataMode} onChange={onDataModeChange} />
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {localize(DERIVED_PHASE_NOTICE, language)}
          </div>
          <Button variant="secondary" icon={Camera} onClick={() => onNavigate("realDatasetSamples")}>
            {t("realDatasetSamples")}
          </Button>
        </div>
      </Card>
    </>
  );
}

function RealDatasetSamplesScreen() {
  const { language, t } = useLanguage();
  const [tissueFilter, setTissueFilter] = useState<"all" | DFUTissueLabel>("all");
  const [phaseFilter, setPhaseFilter] = useState<"all" | ClinicalPhase>("all");
  const [splitFilter, setSplitFilter] = useState<"all" | DFUTissueSampleItem["split"]>("all");

  const tissueOptions = useMemo(() => {
    const labels = Array.from(
      new Set(DFUTISSUE_SAMPLE_ITEMS.flatMap((sample) => sample.realTissueLabels)),
    ).sort();
    return [
      { value: "all" as const, label: t("all") },
      ...labels.map((label) => ({ value: label, label })),
    ];
  }, [t]);
  const phaseOptions = useMemo(() => {
    const phases = Array.from(
      new Set(DFUTISSUE_SAMPLE_ITEMS.map((sample) => sample.derivedPrototypePhase)),
    ).sort();
    return [
      { value: "all" as const, label: t("all") },
      ...phases.map((phase) => ({
        value: phase,
        label: `${t("phase")} ${PHASE_COPY[phase].number}`,
      })),
    ];
  }, [t]);
  const splitOptions: Array<{ value: "all" | DFUTissueSampleItem["split"]; label: string }> = [
    { value: "all", label: t("all") },
    { value: "train", label: language === "th" ? "train" : "train" },
    { value: "validation", label: language === "th" ? "validation" : "validation" },
    { value: "test", label: language === "th" ? "test" : "test" },
  ];

  const filteredSamples = DFUTISSUE_SAMPLE_ITEMS.filter((sample) => {
    const matchesTissue =
      tissueFilter === "all" || sample.realTissueLabels.includes(tissueFilter);
    const matchesPhase =
      phaseFilter === "all" || sample.derivedPrototypePhase === phaseFilter;
    const matchesSplit = splitFilter === "all" || sample.split === splitFilter;
    return matchesTissue && matchesPhase && matchesSplit;
  });

  return (
    <>
      <ScreenHeader title={t("realDatasetSamples")} eyebrow={t("datasetPreviewTesting")}>
        <p>{t("datasetPreviewTestingCopy")}</p>
      </ScreenHeader>
      <Card>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoCell label={t("previewSampleCount")} value={`${DFUTISSUE_SAMPLE_ITEMS.length}/${DFUTISSUE_SAMPLE_TARGET}`} />
            <InfoCell label={t("datasetSplit")} value={`${filteredSamples.length}`} />
          </div>
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {localize(DERIVED_PHASE_NOTICE, language)}
          </div>
          <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-[var(--ink)]">
            {t("realDatasetPrototypeFlowNote")}
          </p>
          <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
            {localize(DFUTISSUE_PHASE_COVERAGE_NOTE, language)}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField
              label={t("filterByTissue")}
              value={tissueFilter}
              onChange={setTissueFilter}
              options={tissueOptions}
            />
            <SelectField
              label={t("filterByPhase")}
              value={phaseFilter}
              onChange={setPhaseFilter}
              options={phaseOptions}
            />
            <SelectField
              label={t("filterBySplit")}
              value={splitFilter}
              onChange={setSplitFilter}
              options={splitOptions}
            />
          </div>
        </div>
      </Card>

      {filteredSamples.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {filteredSamples.map((sample) => {
            const tissue = estimatedTissuePercents(sample);
            const tissueRows = Object.entries(tissue).filter(([, value]) => value > 0);
            const derivedPhaseLabel =
              language === "th" ? sample.derivedPhaseLabelTh : sample.derivedPhaseLabelEn;
            const derivedReason =
              language === "th" ? sample.derivedPhaseReasonTh : sample.derivedPhaseReasonEn;
            return (
              <Card key={sample.id}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
                    <MockWoundPhoto imageDataUrl={sample.imagePath} className="aspect-square" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="success">{t("realDatasetImage")}</Badge>
                        <Badge>{sample.split}</Badge>
                      </div>
                      <h2 className="mt-2 truncate text-base font-black">
                        {sample.id.replace("dfutissue-", "DFU ")}
                      </h2>
                      <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
                        {sample.datasetName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoCell label={t("mainTissueLabel")} value={tissueLabelText(sample.primaryTissueLabel, t)} />
                    <InfoCell label={t("datasetSplit")} value={sample.split} />
                    <InfoCell
                      label={t("derivedPrototypePhase")}
                      value={<PhaseBadge phase={sample.derivedPrototypePhase} />}
                    />
                    <InfoCell label={t("reviewStatus")} value={derivedPhaseLabel} />
                  </div>

                  <div className="grid gap-2">
                    <p className="text-xs font-black text-[var(--muted)]">
                      {t("realTissueLabels")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sample.realTissueLabels.length ? (
                        sample.realTissueLabels.map((label) => (
                          <Badge key={label} tone="primary">
                            {tissueLabelText(label, t)}
                          </Badge>
                        ))
                      ) : (
                        <Badge tone="warning">{t("labelPending")}</Badge>
                      )}
                    </div>
                  </div>

                  {tissueRows.length ? (
                    <div className="grid gap-2">
                      {tissueRows.map(([label, value]) => (
                        <div key={label} className="grid gap-1">
                          <div className="flex justify-between gap-2 text-xs font-black">
                            <span>{label}</span>
                            <span>{value}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
                            <div
                              className="h-full rounded-full bg-[var(--primary)]"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                    <p className="text-xs font-black text-[var(--primary)]">
                      {t("derivedPrototypePhase")}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                      {derivedReason}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-black text-[var(--ink)]"
                      href={sample.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("github")}
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-black text-[var(--ink)]"
                      href={sample.paperUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("paper")}
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-[var(--muted)]">{t("realDatasetEmpty")}</p>
        </Card>
      )}
    </>
  );
}

function DoctorDatasetManagementScreen({
  entries,
  setEntries,
}: {
  entries: DoctorDatasetEntry[];
  setEntries: Dispatch<SetStateAction<DoctorDatasetEntry[]>>;
}) {
  const { t } = useLanguage();
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [sourceType, setSourceType] = useState<DoctorDatasetEntry["sourceType"]>("doctor_added");
  const [woundType, setWoundType] = useState<DoctorDatasetEntry["woundType"]>("diabetic_foot");
  const [woundLocation, setWoundLocation] = useState("toe");
  const [mainLabel, setMainLabel] = useState<DoctorDatasetEntry["mainLabel"]>("granulation");
  const [clinicalPhase, setClinicalPhase] = useState<ClinicalPhase>("phase2");
  const [limbThreatLevel, setLimbThreatLevel] = useState<DoctorDatasetEntry["limbThreatLevel"]>("moderate");
  const [severityLevel, setSeverityLevel] = useState<DoctorDatasetEntry["severityLevel"]>("moderate");
  const [description, setDescription] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [message, setMessage] = useState("");

  const save = () => {
    const entry: DoctorDatasetEntry = {
      id: `dataset-entry-${Date.now()}`,
      imageDataUrl: imageDataUrl || `mock-dataset-${Date.now()}`,
      sourceType,
      woundType,
      woundLocation,
      mainLabel,
      clinicalPhase,
      limbThreatLevel,
      severityLevel,
      description: text(description || "ข้อมูลจำลองที่แพทย์เพิ่ม", description || "Doctor-added mock data"),
      doctorNote: text(doctorNote || "บันทึกจำลอง", doctorNote || "Mock note"),
      addedBy: MOCK_DOCTORS[0]?.name ?? "DiaWound Track Doctor",
      createdAt: new Date().toISOString(),
    };
    setEntries((previous) => [entry, ...previous]);
    setMessage(t("saved"));
  };

  return (
    <>
      <ScreenHeader title={t("doctorDatasetManagement")}>
        <p>{t("datasetWarning")}</p>
      </ScreenHeader>
      <MedicalDisclaimerBox />
      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <PhotoCapture value={imageDataUrl} onChange={setImageDataUrl} />
          <SelectField
            label={t("sourceType")}
            value={sourceType}
            onChange={setSourceType}
            options={[
              { value: "dfutissue_reference", label: "DFUTissue reference" },
              { value: "doctor_added", label: "Doctor added data" },
              { value: "community_field", label: "Community field data" },
              { value: "other", label: "Other" },
            ]}
          />
          <SelectField
            label={t("woundType")}
            value={woundType}
            onChange={setWoundType}
            options={[
              { value: "diabetic_foot", label: "diabetic foot ulcer" },
              { value: "pressure_ulcer", label: "pressure ulcer" },
              { value: "chronic_wound", label: "chronic wound" },
              { value: "other", label: "other" },
            ]}
          />
          <SelectField
            label={t("woundLocation")}
            value={woundLocation}
            onChange={setWoundLocation}
            options={[
              { value: "toe", label: "toe" },
              { value: "sole", label: "sole" },
              { value: "heel", label: "heel" },
              { value: "dorsum of foot", label: "dorsum of foot" },
              { value: "other", label: "other" },
            ]}
          />
          <SelectField
            label={t("mainTissueLabel")}
            value={mainLabel}
            onChange={setMainLabel}
            options={[
              { value: "granulation", label: "granulation" },
              { value: "fibrin", label: "fibrin" },
              { value: "callus", label: "callus" },
              { value: "necrotic", label: "necrotic" },
              { value: "eschar", label: "eschar" },
              { value: "dressing", label: "dressing" },
              { value: "other", label: "other" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label={t("phase")}
              value={clinicalPhase}
              onChange={setClinicalPhase}
              options={Object.keys(PHASE_COPY).map((value) => ({
                value: value as ClinicalPhase,
                label: value,
              }))}
            />
            <SelectField
              label={t("limbThreatLevel")}
              value={limbThreatLevel}
              onChange={setLimbThreatLevel}
              options={[
                { value: "low", label: "low" },
                { value: "moderate", label: "moderate" },
                { value: "high", label: "high" },
                { value: "urgent", label: "urgent" },
              ]}
            />
          </div>
          <SelectField
            label={t("severityLevel")}
            value={severityLevel}
            onChange={setSeverityLevel}
            options={[
              { value: "mild", label: "mild" },
              { value: "moderate", label: "moderate" },
              { value: "severe", label: "severe" },
            ]}
          />
          <TextArea
            label={t("doctorExplanation")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <TextArea
            label={t("doctorNote")}
            value={doctorNote}
            onChange={(event) => setDoctorNote(event.target.value)}
          />
          <Button icon={CheckCircle2} onClick={save}>
            {t("saveToDataset")}
          </Button>
          {message ? <Badge tone="success">{message}</Badge> : null}
        </div>
      </Card>
      <div className="grid gap-3 xl:grid-cols-2">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
              <MockWoundPhoto imageDataUrl={entry.imageDataUrl} className="aspect-square" />
              <div>
                <div className="flex flex-wrap gap-2">
                  <PhaseBadge phase={entry.clinicalPhase} />
                  <Badge>{entry.mainLabel}</Badge>
                </div>
                <h3 className="mt-2 font-black">{entry.woundLocation}</h3>
                <p className="text-sm text-[var(--muted)]">{entry.addedBy}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ClinicManagementScreen({ clinics }: { clinics: ClinicPartner[] }) {
  const { language, t } = useLanguage();
  return (
    <>
      <ScreenHeader title={t("partnerClinicManagement")}>
        <p>{t("mockClinicManagementDesc")}</p>
      </ScreenHeader>
      <div className="grid gap-3">
        {clinics.map((clinic) => (
          <Card key={clinic.id}>
            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black">{clinic.name}</h2>
                <Badge tone={clinic.usesDiaWoundTrack ? "success" : "neutral"}>
                  {clinic.usesDiaWoundTrack ? t("usesDiaWoundTrack") : clinic.type}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoCell label={t("distance")} value={`${clinic.distanceKm} km`} />
                <InfoCell label={t("phone")} value={clinic.phone} />
                <InfoCell label={t("address")} value={localize(clinic.address, language)} />
                <InfoCell label={t("openingHours")} value={localize(clinic.openingHours, language)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function RoleSettingsScreen() {
  const { language, t } = useLanguage();
  const rows = [
    { role: ROLE_COPY.patient.title, access: text("ดูผลและถ่ายรูป", "Photo and result access") },
    { role: ROLE_COPY.doctor.title, access: text("ตรวจ แก้ไข และจัดการข้อมูล", "Review, correct, and manage data") },
    { role: ROLE_COPY.chw.title, access: text("บันทึกเยี่ยมและส่งเคส", "Record visits and send cases") },
  ];
  return (
    <>
      <ScreenHeader title={t("userRoleSettings")}>
        <p>{t("mockRoleSettingsDesc")}</p>
      </ScreenHeader>
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={localize(row.role, "en")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black">{localize(row.role, language)}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {localize(row.access, language)}
                </p>
              </div>
              <Badge tone="primary">{t("saved")}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ChwDashboardScreen({
  patients,
  assessments,
  consultationCases,
  reminders,
  onNavigate,
}: {
  patients: Patient[];
  assessments: AssessmentRecord[];
  consultationCases: CHWConsultationCase[];
  reminders: DailyReminder[];
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useLanguage();
  const waitingForDoctor = consultationCases.filter(
    (item) => item.status === "pending",
  );
  const doctorResponded = consultationCases.filter(
    (item) => item.status === "reviewed" || Boolean(item.doctorResponse),
  );
  const urgentCases = consultationCases.filter((item) => item.status === "urgent").length +
    assessments.filter((record) => record.riskLevel === "urgent").length;
  const missedFollowUp = reminders.reduce((sum, item) => sum + item.missedDays, 0);
  const staff = MOCK_CHWS[0];
  const workflow = [
    {
      step: 1,
      title: t("patientListWorkflow"),
      description: t("patientListWorkflowDesc"),
      icon: Users,
      page: "communityPatientList" as AppPage,
    },
    {
      step: 2,
      title: t("woundPhotoWorkflow"),
      description: t("woundPhotoWorkflowDesc"),
      icon: Camera,
      page: "addCommunityVisit" as AppPage,
    },
    {
      step: 3,
      title: t("aiResultWorkflow"),
      description: t("aiResultWorkflowDesc"),
      icon: Sparkles,
      page: "chwSearch" as AppPage,
    },
    {
      step: 4,
      title: t("sendDoctorWorkflow"),
      description: t("sendDoctorWorkflowDesc"),
      icon: Upload,
      page: "sendDoctorReview" as AppPage,
    },
    {
      step: 5,
      title: t("followUpWorkflow"),
      description: t("followUpWorkflowDesc"),
      icon: LineChartIcon,
      page: "chwSearch" as AppPage,
    },
  ];

  return (
    <>
      <Card className="border-[var(--primary)] bg-[var(--surface-soft)]">
        <div className="grid gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-ink)]">
              <HeartPulse size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-normal text-[var(--primary)]">
                {t("primaryCareSystemLabel")}
              </p>
              <h1 className="text-2xl font-black leading-tight">{t("primaryCareDashboard")}</h1>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                {localize(staff.area, language)}
              </p>
            </div>
            <Badge tone="success">{t("online")}</Badge>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="text-xs font-black text-[var(--muted)]">{t("primaryCareRoleLong")}</p>
              <p className="mt-1 text-base font-black text-[var(--ink)]">{staff.name}</p>
              <p className="text-xs font-semibold text-[var(--muted)]">{staff.phone}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">
              <Search size={17} />
              <span>{t("patientSearchPlaceholder")}</span>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t("patientsUnderCare")} value={patients.length} icon={Users} />
        <StatCard label={t("waitingForDoctor")} value={waitingForDoctor.length} icon={Upload} tone="warning" />
        <StatCard label={t("doctorResponded")} value={doctorResponded.length} icon={FileText} tone="success" />
        <StatCard label={t("urgentCases")} value={urgentCases} icon={Ambulance} tone="danger" />
        <StatCard label={t("missedFollowUpShort")} value={missedFollowUp} icon={Bell} tone="primary" />
      </div>
      <ChwAlertStrip
        urgentCount={urgentCases}
        waitingCount={waitingForDoctor.length}
        missedCount={missedFollowUp}
      />
      <div className="grid gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-[var(--primary)]">
            {t("publicHealthWorkflow")}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {workflow.map((item) => (
            <ChwWorkflowCard
              key={item.title}
              step={item.step}
              title={item.title}
              description={item.description}
              icon={item.icon}
              onClick={() => onNavigate(item.page)}
            />
          ))}
        </div>
      </div>
      <Card className="bg-[var(--surface)]">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="font-black">{t("followUpArea")}</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[var(--muted)]">
              {t("followUpAreaNote")}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

function CommunityPatientListScreen({
  patients,
  assessments,
  onSelect,
}: {
  patients: Patient[];
  assessments: AssessmentRecord[];
  onSelect: (patient: Patient) => void;
}) {
  const { language, t } = useLanguage();
  const communityPatients = patients.filter(
    (patient) => patient.sourceChannel === "chw" || patient.sourceChannel === "rhpc",
  );
  return (
    <>
      <ScreenHeader title={t("communityPatientList")} eyebrow={t("primaryCareSystemLabel")} />
      <div className="grid gap-3 lg:hidden">
        {communityPatients.map((patient) => {
          const latest = latestAssessmentFor(patient.id, assessments);
          return (
            <Card key={patient.id}>
              <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
                <MockWoundPhoto imageDataUrl={latest?.imageDataUrl} className="aspect-square" />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-black">{patient.patientCode}</h2>
                      <p className="truncate text-sm text-[var(--muted)]">
                        {patient.citizenIdMasked} / {localize(patient.woundLocation, language)}
                      </p>
                    </div>
                    {latest ? <RiskBadge risk={latest.riskLevel} /> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {latest ? <PhaseBadge phase={latest.clinicalPhase} /> : null}
                    {latest ? <Badge tone="primary">{formatDate(latest.createdAt, language)}</Badge> : null}
                  </div>
                  <Button
                    variant="secondary"
                    icon={ChevronRight}
                    onClick={() => onSelect(patient)}
                    className="mt-3 w-full"
                  >
                    {t("viewDetails")}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs font-black uppercase tracking-normal text-[var(--muted)]">
                <th className="py-3 pr-4">{t("patientCode")}</th>
                <th className="py-3 pr-4">{t("maskedCitizenId")}</th>
                <th className="py-3 pr-4">{t("woundLocation")}</th>
                <th className="py-3 pr-4">{t("latestPhase")}</th>
                <th className="py-3 pr-4">{t("latestRisk")}</th>
                <th className="py-3 pr-0 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {communityPatients.map((patient) => {
                const latest = latestAssessmentFor(patient.id, assessments);
                return (
                  <tr key={patient.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-3 pr-4 font-black">{patient.patientCode}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{patient.citizenIdMasked}</td>
                    <td className="py-3 pr-4 text-[var(--muted)]">{localize(patient.woundLocation, language)}</td>
                    <td className="py-3 pr-4">{latest ? <PhaseBadge phase={latest.clinicalPhase} /> : "-"}</td>
                    <td className="py-3 pr-4">{latest ? <RiskBadge risk={latest.riskLevel} /> : "-"}</td>
                    <td className="py-3 pr-0">
                      <div className="flex justify-end">
                        <Button variant="secondary" icon={ChevronRight} onClick={() => onSelect(patient)}>
                          {t("viewDetails")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function SendDoctorReviewScreen({
  patient,
  assessments,
  consultationCases,
  setConsultationCases,
  setAssessments,
}: {
  patient: Patient;
  assessments: AssessmentRecord[];
  consultationCases: CHWConsultationCase[];
  setConsultationCases: Dispatch<SetStateAction<CHWConsultationCase[]>>;
  setAssessments: Dispatch<SetStateAction<AssessmentRecord[]>>;
}) {
  const { language, t } = useLanguage();
  const records = patientAssessments(patient.id, assessments).reverse();
  const [message, setMessage] = useState("");
  const reasonOptions: TranslationKey[] = [
    "woundAppearsWorse",
    "patientMissedFollowUp",
    "aiHighRiskReason",
    "needDoctorAssessment",
    "possibleReferralNeeded",
  ];
  const [reasonKey, setReasonKey] = useState<TranslationKey>("needDoctorAssessment");

  const send = (record: AssessmentRecord) => {
    const now = new Date().toISOString();
    const chwId = patient.assignedCHW ?? DEFAULT_CHW_ID;
    const chwName = MOCK_CHWS.find((chw) => chw.id === chwId)?.name;
    const status: CHWConsultationCase["status"] =
      record.riskLevel === "urgent" ||
      record.clinicalPhase === "phase4" ||
      record.clinicalPhase === "phase5"
        ? "urgent"
        : "pending";
    const baseNote = localize(record.chwNote ?? record.note, language) || t("sendToDoctorReview");
    const existingCase = consultationCases.find(
      (caseItem) => caseItem.patientId === patient.id && caseItem.assessmentId === record.id,
    );
    const consultationCase: CHWConsultationCase = {
      ...existingCase,
      id: existingCase?.id ?? `consult-${patient.id}-${record.id}`,
      patientId: patient.id,
      patientCode: patient.patientCode,
      citizenIdMasked: patient.citizenIdMasked,
      chwId,
      chwName: chwName ?? chwId,
      rhpcName: patient.preferredClinicId ?? "RHPC",
      assessmentId: record.id,
      woundImageUrl: record.imageDataUrl,
      aiPhase: record.clinicalPhase,
      aiRiskLevel: record.riskLevel,
      chwNote: `${baseNote} / ${t("sendReason")}: ${t(reasonKey)}`,
      status,
      createdAt: existingCase?.createdAt ?? now,
    };
    setAssessments((previous) =>
      previous.map((item) =>
        item.id === record.id ? { ...item, reviewStatus: "pending" } : item,
      ),
    );
    setConsultationCases((previous) => {
      const others = previous.filter(
        (caseItem) => !(caseItem.patientId === patient.id && caseItem.assessmentId === record.id),
      );
      return [consultationCase, ...others];
    });
    setMessage(t("sendDoctorDone"));
  };

  return (
    <>
      <ScreenHeader title={t("sendToDoctorReview")} eyebrow={patient.patientCode}>
        <p>{t("medicalDisclaimer")}</p>
      </ScreenHeader>
      <PatientIdentityBanner patient={patient} latest={records[0]} />
      <ChwSectionCard title={t("sendReason")} icon={ShieldAlert}>
        <div className="grid gap-3">
          <p className="text-sm font-semibold leading-relaxed text-[var(--muted)]">
            {t("sendDoctorWorkflowDesc")}
          </p>
          <div className="flex flex-wrap gap-2">
            {reasonOptions.map((option) => (
              <ToggleChip
                key={option}
                active={reasonKey === option}
                onClick={() => setReasonKey(option)}
              >
                {t(option)}
              </ToggleChip>
            ))}
          </div>
        </div>
      </ChwSectionCard>
      <div className="grid gap-3">
        {records.slice(0, 5).map((record) => {
          const caseItem = consultationCases.find(
            (item) => item.patientId === patient.id && item.assessmentId === record.id,
          );
          const status = chwConsultationStatusView(caseItem, t);

          return (
            <div key={record.id} className="grid gap-3">
              <div className="grid gap-3">
                <AssessmentCard
                  record={record}
                  corrections={[]}
                  patient={patient}
                  action={
                    <Button icon={Upload} onClick={() => send(record)}>
                      {t("sendCaseToDoctor")}
                    </Button>
                  }
                />
                <div className="grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-[var(--muted)]">
                      {t("consultationStatus")}
                    </span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  {caseItem?.doctorResponse ? (
                    <div className="grid gap-1">
                      <p className="text-xs font-black text-[var(--muted)]">
                        {t("doctorResponse")}
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--ink)]">
                        {caseItem.doctorResponse}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">{t("noDoctorResponseYet")}</p>
                  )}
                  {caseItem?.doctorTreatmentAdvice ? (
                    <div className="grid gap-1">
                      <p className="text-xs font-black text-[var(--muted)]">
                        {t("treatmentAdvice")}
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--muted)]">
                        {caseItem.doctorTreatmentAdvice}
                      </p>
                    </div>
                  ) : null}
                  {caseItem?.doctorCorrectedPhase || caseItem?.doctorCorrectedRiskLevel ? (
                    <div className="flex flex-wrap gap-2">
                      {caseItem.doctorCorrectedPhase ? <PhaseBadge phase={caseItem.doctorCorrectedPhase} /> : null}
                      {caseItem.doctorCorrectedRiskLevel ? <RiskBadge risk={caseItem.doctorCorrectedRiskLevel} /> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {message ? <Badge tone="success">{message}</Badge> : null}
    </>
  );
}

function NotificationsScreen({
  patients,
  assessments,
  reminders,
  role,
  onNavigate,
}: {
  patients: Patient[];
  assessments: AssessmentRecord[];
  reminders: DailyReminder[];
  role: RoleId;
  onNavigate: (page: AppPage) => void;
}) {
  const { t } = useLanguage();
  const pending = assessments.filter((record) => record.reviewStatus === "pending").length;
  const urgent = assessments.filter(
    (record) => record.clinicalPhase === "phase4" || record.clinicalPhase === "phase5",
  ).length;
  const missed = reminders.reduce((sum, item) => sum + item.missedDays, 0);
  const notices = [
    { title: t("dailyReminder"), detail: t("dailyReminderCopy"), tone: "primary" as const },
    { title: t("newAiResult"), detail: `${pending} ${t("pendingCases")}`, tone: "warning" as const },
    { title: t("afterWorkReview"), detail: `${pending} ${t("aiPendingReview")}`, tone: "warning" as const },
    { title: t("urgentAlert"), detail: `${urgent} ${t("urgentCases")}`, tone: "danger" as const },
    { title: t("missedFollowUp"), detail: `${missed} ${t("days")}`, tone: "neutral" as const },
    { title: t("appointmentReminder"), detail: patients[0]?.patientCode ?? "-", tone: "primary" as const },
    { title: t("chwFollowUpReminder"), detail: patients[2]?.patientCode ?? "-", tone: "primary" as const },
  ];

  return (
    <>
      <ScreenHeader title={t("notifications")} />
      <div className="grid gap-3">
        {notices.map((notice) => (
          <Card key={notice.title}>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface-soft)] text-[var(--primary)]">
                <Bell size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-black">{notice.title}</h2>
                  <Badge tone={notice.tone}>{notice.tone === "danger" ? t("urgentCases") : t("progress")}</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{notice.detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Button
        icon={ChevronRight}
        onClick={() =>
          onNavigate(
            role === "patient"
              ? "patientPhoto"
              : role === "doctor"
                ? "aiPendingReview"
                : "communityPatientList",
          )
        }
      >
        {t("continue")}
      </Button>
    </>
  );
}

function EmptyPatientState({ onSearch }: { onSearch: () => void }) {
  const { t } = useLanguage();
  return (
    <Card>
      <div className="grid gap-3">
        <h2 className="text-lg font-black">{t("noPatientSelected")}</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {t("selectPatientFirst")}
        </p>
        <Button icon={Search} onClick={onSearch}>
          {t("searchPatient")}
        </Button>
      </div>
    </Card>
  );
}

function DiaWoundTrackApp() {
  const { language } = useLanguage();
  const [theme, setThemeState] = useState<ThemeId>(readTheme);
  const [dataMode, setDataModeState] = useState<DataMode>(getDataMode);
  const [role, setRoleState] = useState<RoleId | null>(readRole);
  const [page, setPage] = useState<AppPage>(() => {
    const initialRole = readRole();
    return initialRole ? defaultPageByRole[initialRole] : "patientHome";
  });
  const [patients, setPatients, resetPatients, patientsSync] = useSupabaseSyncedArray(
    MOCK_PATIENTS,
    patientService,
    "patients",
  );
  const [assessments, setAssessments, resetAssessments, assessmentsSync] = useSupabaseSyncedArray(
    MOCK_ASSESSMENTS,
    assessmentService,
    "assessments",
  );
  const [corrections, setCorrections, resetCorrections, correctionsSync] = useSupabaseSyncedArray(
    MOCK_CORRECTIONS,
    doctorCorrectionService,
    "doctor corrections",
  );
  const [reminders, setReminders, resetReminders, remindersSync] = useSupabaseSyncedArray(
    MOCK_DAILY_REMINDERS,
    reminderService,
    "daily reminders",
  );
  const [consultationCases, setConsultationCases, resetConsultationCases, consultationCasesSync] =
    useSupabaseSyncedArray(
      MOCK_CHW_CONSULTATION_CASES,
      consultationCaseService,
      "CHW consultation cases",
    );
  const [clinics, setClinics, resetClinics, clinicsSync] = useSupabaseSyncedArray(
    MOCK_CLINIC_PARTNERS,
    clinicService,
    "clinic partners",
  );
  const [datasetEntries, setDatasetEntries, resetDatasetEntries, datasetEntriesSync] =
    useSupabaseSyncedArray(
      MOCK_DATASET_ENTRIES,
      doctorDatasetService,
      "doctor dataset entries",
    );
  const [patientAppointments, setPatientAppointments] = useState(INITIAL_PATIENT_APPOINTMENTS);
  const [patientChatContacts, setPatientChatContacts] = useState(INITIAL_PATIENT_CHAT_CONTACTS);
  const [patientChatThreads, setPatientChatThreads] = useState(INITIAL_PATIENT_CHAT_THREADS);
  const [selectedPatientId, setSelectedPatientId] = useState(
    localStorage.getItem(STORAGE_KEYS.selectedPatient) ?? "P001",
  );
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | undefined>();
  const [pendingPatientCameraImage, setPendingPatientCameraImage] = useState("");
  const [pendingPatientCameraError, setPendingPatientCameraError] = useState<TranslationKey | "">("");
  const [history, setHistory] = useState<AppPage[]>([]);
  const syncStates = [
    patientsSync,
    assessmentsSync,
    correctionsSync,
    remindersSync,
    consultationCasesSync,
    clinicsSync,
    datasetEntriesSync,
  ];
  const activeAssessments = useMemo(
    () =>
      dataMode === "real_dataset_preview"
        ? applyRealDatasetPreview(assessments)
        : assessments,
    [assessments, dataMode],
  );
  const doctorPatients = useMemo(
    () => getDoctorPatients(DEFAULT_DOCTOR_ID, patients),
    [patients],
  );
  const chwPatients = useMemo(
    () => getCHWPatients(DEFAULT_CHW_ID, patients),
    [patients],
  );
  const doctorConsultationCases = useMemo(
    () => getDoctorConsultationCases(DEFAULT_DOCTOR_ID, consultationCases),
    [consultationCases],
  );
  const chwConsultationCases = useMemo(
    () => getCHWConsultationCases(DEFAULT_CHW_ID, consultationCases),
    [consultationCases],
  );
  const doctorAssessments = useMemo(() => {
    const ownedIds = new Set(doctorPatients.map((patient) => patient.id));
    return activeAssessments.filter((record) => ownedIds.has(record.patientId));
  }, [activeAssessments, doctorPatients]);
  const chwAssessments = useMemo(() => {
    const ownedIds = new Set(chwPatients.map((patient) => patient.id));
    return activeAssessments.filter((record) => ownedIds.has(record.patientId));
  }, [activeAssessments, chwPatients]);

  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];
  const currentRolePatient =
    role === "doctor"
      ? doctorPatients.find((patient) => patient.id === selectedPatientId) ?? doctorPatients[0]
      : role === "chw"
        ? chwPatients.find((patient) => patient.id === selectedPatientId) ?? chwPatients[0]
        : selectedPatient;
  const latest = latestAssessmentFor(currentRolePatient?.id, activeAssessments);
  const activeAssessment =
    activeAssessments.find(
      (record) =>
        record.id === activeAssessmentId && record.patientId === currentRolePatient?.id,
    ) ?? latest;

  const setTheme = (nextTheme: ThemeId) => {
    setThemeState(nextTheme);
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  };

  const setDataMode = (nextMode: DataMode) => {
    setDataModeState(nextMode);
    persistDataMode(nextMode);
  };

  const selectRole = (nextRole: RoleId) => {
    localStorage.setItem(STORAGE_KEYS.role, nextRole);
    setRoleState(nextRole);
    const defaultPatientId =
      nextRole === "doctor" ? "P001" : nextRole === "chw" ? "P003" : "P001";
    setSelectedPatientId(defaultPatientId);
    localStorage.setItem(STORAGE_KEYS.selectedPatient, defaultPatientId);
    setActiveAssessmentId(undefined);
    setPendingPatientCameraImage("");
    setPendingPatientCameraError("");
    setHistory([]);
    setPage(defaultPageByRole[nextRole]);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.role);
    setRoleState(null);
    setPendingPatientCameraImage("");
    setPendingPatientCameraError("");
    setHistory([]);
  };

  const navigate = (nextPage: AppPage) => {
    setHistory((previous) => [...previous, page]);
    setPage(nextPage);
  };

  const goBack = () => {
    setHistory((previous) => {
      const next = [...previous];
      const previousPage = next.pop();
      setPage(previousPage ?? (role ? defaultPageByRole[role] : "patientHome"));
      return next;
    });
  };

  const selectPatient = (patient: Patient, record?: AssessmentRecord) => {
    setSelectedPatientId(patient.id);
    localStorage.setItem(STORAGE_KEYS.selectedPatient, patient.id);
    if (record) setActiveAssessmentId(record.id);
  };

  const createAssessment = async (record: AssessmentRecord) => {
    const parentPatient = patients.find((patient) => patient.id === record.patientId);
    if (parentPatient) await patientService.upsert(parentPatient);
    const imageDataUrl = await uploadWoundImageFromDataUrl({
      dataUrl: record.imageDataUrl,
      patientId: record.patientId,
      recordId: record.id,
    });
    const syncedRecord = { ...record, imageDataUrl, updatedAt: record.updatedAt ?? new Date().toISOString() };
    await assessmentService.upsert(syncedRecord);
    setAssessments((previous) => [syncedRecord, ...previous]);
    setActiveAssessmentId(syncedRecord.id);
    navigate(role === "patient" ? "patientAiResult" : role === "doctor" ? "patientProfile" : "sendDoctorReview");
  };

  const importLocalDemoDataToSupabase = async () => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const nextPatients = readJsonArray<Patient>(STORAGE_KEYS.patients, []).length
      ? readJsonArray<Patient>(STORAGE_KEYS.patients, [])
      : patients.length
        ? patients
        : MOCK_PATIENTS;
    const localAssessments = readJsonArray<AssessmentRecord>(STORAGE_KEYS.assessments, []);
    const nextAssessments = await uploadAssessmentImagesForCloud(
      localAssessments.length ? localAssessments : assessments.length ? assessments : MOCK_ASSESSMENTS,
    );
    const nextCorrections = readJsonArray<DoctorCorrection>(STORAGE_KEYS.doctorCorrections, []).length
      ? readJsonArray<DoctorCorrection>(STORAGE_KEYS.doctorCorrections, [])
      : corrections.length
        ? corrections
        : MOCK_CORRECTIONS;
    const nextReminders = readJsonArray<DailyReminder>(STORAGE_KEYS.dailyReminders, []).length
      ? readJsonArray<DailyReminder>(STORAGE_KEYS.dailyReminders, [])
      : reminders.length
        ? reminders
        : MOCK_DAILY_REMINDERS;
    const nextConsultationCases = readJsonArray<CHWConsultationCase>(STORAGE_KEYS.chwConsultationCases, []).length
      ? readJsonArray<CHWConsultationCase>(STORAGE_KEYS.chwConsultationCases, [])
      : consultationCases.length
        ? consultationCases
        : MOCK_CHW_CONSULTATION_CASES;
    const nextClinics = readJsonArray<ClinicPartner>(STORAGE_KEYS.clinicPartners, []).length
      ? readJsonArray<ClinicPartner>(STORAGE_KEYS.clinicPartners, [])
      : clinics.length
        ? clinics
        : MOCK_CLINIC_PARTNERS;
    const localDatasetEntries = readJsonArray<DoctorDatasetEntry>(STORAGE_KEYS.doctorDataset, []);
    const nextDatasetEntries = await uploadDatasetImagesForCloud(
      localDatasetEntries.length ? localDatasetEntries : datasetEntries.length ? datasetEntries : MOCK_DATASET_ENTRIES,
    );

    await patientService.upsertMany(nextPatients);
    await assessmentService.upsertMany(nextAssessments);
    await doctorCorrectionService.upsertMany(nextCorrections);
    await reminderService.upsertMany(nextReminders);
    await clinicService.upsertMany(nextClinics);
    await doctorDatasetService.upsertMany(nextDatasetEntries);
    await consultationCaseService.upsertMany(nextConsultationCases);

    setPatients(nextPatients);
    setAssessments(nextAssessments);
    setCorrections(nextCorrections);
    setReminders(nextReminders);
    setConsultationCases(nextConsultationCases);
    setClinics(nextClinics);
    setDatasetEntries(nextDatasetEntries);
  };

  const resetMockData = () => {
    resetPatients();
    resetAssessments();
    resetCorrections();
    resetReminders();
    resetConsultationCases();
    resetClinics();
    resetDatasetEntries();
    setPatientAppointments(INITIAL_PATIENT_APPOINTMENTS);
    setPatientChatContacts(INITIAL_PATIENT_CHAT_CONTACTS);
    setPatientChatThreads(INITIAL_PATIENT_CHAT_THREADS);
    setSelectedPatientId("P001");
    setActiveAssessmentId(undefined);
  };

  const loginScreen = (
    <LoginScreen
      theme={theme}
      onThemeChange={setTheme}
      onSelectRole={selectRole}
    />
  );

  const renderPatientPage = (currentPatient: Patient) => {
    if (page === "patientOnboarding") return <OnboardingScreen onNavigate={navigate} />;
    if (page === "patientPhoto") {
      return (
        <TakeWoundPhotoScreen
          patient={currentPatient}
          latest={latest}
          onCreateAssessment={createAssessment}
          onNavigate={navigate}
          initialCapturedImage={pendingPatientCameraImage}
          cameraErrorKey={pendingPatientCameraError}
          onInitialCaptureConsumed={() => setPendingPatientCameraImage("")}
          onCameraErrorConsumed={() => setPendingPatientCameraError("")}
        />
      );
    }
    if (page === "patientAiResult") {
      return (
        <AiResultScreen
          record={activeAssessment}
          patient={currentPatient}
          corrections={corrections}
          onNavigate={navigate}
        />
      );
    }
    if (page === "patientAppointments") {
      return (
        <PatientAppointmentsScreen
          patient={currentPatient}
          appointments={patientAppointments}
          setAppointments={setPatientAppointments}
        />
      );
    }
    if (page === "patientOwnProfile") {
      return (
        <PatientOwnProfileScreen
          patient={currentPatient}
          latest={latest}
          reminders={reminders}
          clinics={clinics}
          onNavigate={navigate}
          onLogout={logout}
        />
      );
    }
    if (page === "patientChat") {
      return (
        <PatientChatScreen
          contacts={patientChatContacts}
          setContacts={setPatientChatContacts}
          threads={patientChatThreads}
          setThreads={setPatientChatThreads}
          onNavigate={navigate}
        />
      );
    }
    if (page === "partnerClinics") return <PartnerClinicsScreen clinics={clinics} />;
    if (page === "contactChw") return <ContactChwScreen patient={currentPatient} />;
    if (page === "dailyReminder") {
      return (
        <DailyReminderScreen
          patient={currentPatient}
          reminders={reminders}
          setReminders={setReminders}
        />
      );
    }
    if (page === "patientProgress") {
      return (
        <TreatmentProgressScreen
          patient={currentPatient}
          records={activeAssessments}
          corrections={corrections}
        />
      );
    }
    return (
      <PatientHomeScreen
        patient={currentPatient}
        latest={latest}
        assessments={activeAssessments}
        corrections={corrections}
        reminders={reminders}
        onNavigate={navigate}
      />
    );
  };

  const renderDoctorPage = (currentPatient: Patient | undefined) => {
    if (page === "doctorSearch" && currentPatient) {
      return (
        <DoctorPatientTrackingScreen
          key={`doctorSearch-${currentPatient.id}`}
          patient={currentPatient}
          patients={doctorPatients}
          assessments={doctorAssessments}
          corrections={corrections}
          reminders={reminders}
          onNavigate={navigate}
          onSelectPatient={selectPatient}
        />
      );
    }
    if (page === "patientProfile" && currentPatient) {
      return (
        <PatientProfileScreen
          patient={currentPatient}
          assessments={doctorAssessments}
          corrections={corrections}
          onNavigate={navigate}
        />
      );
    }
    if (page === "clinicInterview" && currentPatient) {
      return (
        <ClinicalRecordForm
          patient={currentPatient}
          role="doctor"
          visitType="clinic"
          titleKey="clinicInterviewForm"
          onSave={createAssessment}
        />
      );
    }
    if (page === "aiPendingReview") {
      return (
        <AiPendingReviewScreen
          patients={doctorPatients}
          assessments={doctorAssessments}
          corrections={corrections}
          onSelectPatient={selectPatient}
          onNavigate={navigate}
        />
      );
    }
    if (page === "doctorChwCases") {
      return (
        <DoctorChwCasesScreen
          cases={doctorConsultationCases}
          patients={patients}
          assessments={activeAssessments}
          corrections={corrections}
          setConsultationCases={setConsultationCases}
          setCorrections={setCorrections}
          setAssessments={setAssessments}
        />
      );
    }
    if (page === "aiCorrection") {
      return (
        <AiCorrectionScreen
          patient={currentPatient}
          assessment={activeAssessment}
          corrections={corrections}
          setCorrections={setCorrections}
          setAssessments={setAssessments}
        />
      );
    }
    if (page === "doctorProgress" && currentPatient) {
      return (
        <TreatmentProgressScreen
          patient={currentPatient}
          records={doctorAssessments}
          corrections={corrections}
        />
      );
    }
    if (page === "addPatient") {
      return (
        <AddPatientScreen
          patients={patients}
          setPatients={setPatients}
          onSelect={selectPatient}
        />
      );
    }
    if (page === "datasetReference") {
      return (
        <DatasetReferenceScreen
          dataMode={dataMode}
          onDataModeChange={setDataMode}
          onNavigate={navigate}
        />
      );
    }
    if (page === "realDatasetSamples") return <RealDatasetSamplesScreen />;
    if (page === "doctorDataset") {
      return (
        <DoctorDatasetManagementScreen
          entries={datasetEntries}
          setEntries={setDatasetEntries}
        />
      );
    }
    if (page === "partnerClinicManagement") {
      return <ClinicManagementScreen clinics={clinics} />;
    }
    if (page === "roleSettings") return <RoleSettingsScreen />;
    if (page !== "doctorDashboard" && !currentPatient) {
      return <EmptyPatientState onSearch={() => navigate("doctorSearch")} />;
    }
    return (
      <DoctorDashboardScreen
        patients={doctorPatients}
        assessments={doctorAssessments}
        corrections={corrections}
        reminders={reminders}
        consultationCases={doctorConsultationCases}
        onNavigate={navigate}
      />
    );
  };

  const renderChwPage = (currentPatient: Patient | undefined) => {
    if (page === "chwSearch" && currentPatient) {
      return (
        <ChwPatientTrackingScreen
          patient={currentPatient}
          patients={chwPatients}
          assessments={chwAssessments}
          consultationCases={chwConsultationCases}
          reminders={reminders.filter((item) =>
            chwPatients.some((patient) => patient.id === item.patientId),
          )}
          onNavigate={navigate}
          onSelectPatient={selectPatient}
        />
      );
    }
    if (page === "communityPatientList") {
      return (
        <CommunityPatientListScreen
          patients={chwPatients}
          assessments={chwAssessments}
          onSelect={(patient) => {
            selectPatient(patient);
            navigate("chwSearch");
          }}
        />
      );
    }
    if ((page === "addCommunityVisit" || page === "uploadWoundPhoto") && currentPatient) {
      return (
        <ClinicalRecordForm
          patient={currentPatient}
          role="chw"
          visitType={page === "addCommunityVisit" ? "home" : "rhpc"}
          titleKey={page === "addCommunityVisit" ? "addCommunityVisit" : "uploadWoundPhoto"}
          onSave={createAssessment}
        />
      );
    }
    if (page === "sendDoctorReview" && currentPatient) {
      return (
        <SendDoctorReviewScreen
          patient={currentPatient}
          assessments={chwAssessments}
          consultationCases={chwConsultationCases}
          setConsultationCases={setConsultationCases}
          setAssessments={setAssessments}
        />
      );
    }
    if (page !== "chwDashboard" && !currentPatient) {
      return <EmptyPatientState onSearch={() => navigate("chwSearch")} />;
    }
    return (
      <ChwDashboardScreen
        patients={chwPatients}
        assessments={chwAssessments}
        consultationCases={chwConsultationCases}
        reminders={reminders.filter((item) =>
          chwPatients.some((patient) => patient.id === item.patientId),
        )}
        onNavigate={navigate}
      />
    );
  };

  const renderPage = () => {
    if (!role) return null;
    if (page === "notifications") {
      return (
        <NotificationsScreen
          patients={role === "doctor" ? doctorPatients : role === "chw" ? chwPatients : patients}
          assessments={role === "doctor" ? doctorAssessments : role === "chw" ? chwAssessments : activeAssessments}
          reminders={reminders}
          role={role}
          onNavigate={navigate}
        />
      );
    }
    if (page === "emergency") return <EmergencyScreen patient={currentRolePatient} />;
    if (page === "settings") {
      return (
        <SettingsScreen
          role={role}
          theme={theme}
          dataMode={dataMode}
          onThemeChange={setTheme}
          onDataModeChange={setDataMode}
          onLogout={logout}
          onReset={resetMockData}
          onImportLocalDemoData={importLocalDemoDataToSupabase}
          onNavigate={navigate}
        />
      );
    }
    if (page === "datasetReference") {
      return (
        <DatasetReferenceScreen
          dataMode={dataMode}
          onDataModeChange={setDataMode}
          onNavigate={navigate}
        />
      );
    }
    if (role === "patient" && selectedPatient) return renderPatientPage(selectedPatient);
    if (role === "doctor") return renderDoctorPage(currentRolePatient);
    return renderChwPage(currentRolePatient);
  };

  const shell = role ? (
    <AppShell
      theme={theme}
      role={role}
      page={page}
      canGoBack={history.length > 0}
      onBack={goBack}
      onSettings={() => navigate("settings")}
      onNotifications={() => navigate("notifications")}
      onLogout={logout}
      onNavigate={navigate}
      showMedicalDisclaimer={
        role === "doctor" ||
        role === "chw" ||
        page === "patientAiResult" ||
        page === "datasetReference" ||
        page === "doctorDataset"
      }
      showPatientChat={role === "patient" && page !== "patientChat"}
      onPatientChat={() => navigate("patientChat")}
      onPatientCameraCapture={(dataUrl) => {
        setPendingPatientCameraError("");
        setPendingPatientCameraImage(dataUrl);
      }}
      onPatientCameraError={(messageKey) => {
        setPendingPatientCameraImage("");
        setPendingPatientCameraError(messageKey);
      }}
    >
      <CloudSyncBanner states={syncStates} />
      {renderPage()}
    </AppShell>
  ) : null;

  return (
    <AuthGuard role={role} login={loginScreen}>
      {shell}
      <span className="sr-only">{language}</span>
    </AuthGuard>
  );
}

export default function App() {
  return <DiaWoundTrackApp />;
}
