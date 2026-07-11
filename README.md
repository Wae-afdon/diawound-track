# DiaWound Track

DiaWound Track: แอปพลิเคชันติดตามแผลเท้าเบาหวานด้วย AI

แอปพลิเคชันที่ช่วยผู้ป่วยติดตามแผลเท้าเบาหวานผ่านการถ่ายภาพแผลรายวัน การคัดกรองเบื้องต้นด้วย AI และการตรวจติดตามโดยแพทย์หรือ อสม.

## English

DiaWound Track: An AI-Assisted Diabetic Foot Wound Monitoring Application

A mobile application that helps patients track diabetic foot wounds through daily wound photos, preliminary AI screening, and doctor-reviewed follow-up.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Database for synced records
- Supabase Storage for wound photos

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm run dev
```

Fill `.env` with your Supabase project values:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Confirm the `wound-images` Storage bucket exists.
5. For prototype testing, the schema creates public read/upload policies for `wound-images`.

The app stores synced medical data in:

- `patients`
- `assessments`
- `doctor_corrections`
- `daily_reminders`
- `clinic_partners`
- `doctor_dataset_entries`
- `chw_consultation_cases`

The original prototype used `localStorage` for mock data. Current synced medical data now goes to Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Local storage is still used for UI preferences such as role, theme, language, data mode, and selected patient.

## Import Old Demo Data

Open the app, go to Settings, and click:

```text
Import local demo data to Supabase
```

This temporary helper reads old localStorage demo arrays, uploads any local wound-photo data URLs to Supabase Storage, and inserts the records into Supabase.

## Vercel Deploy

In Vercel Project Settings > Environment Variables, add:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Then deploy with:

```text
Install Command: pnpm install
Build Command: pnpm run build
Output Directory: dist
```

## Security Note

This is still a prototype. For real production use with patient data, you must add:

- Supabase Auth
- Row Level Security policies for every table
- role-based permissions for patient, doctor, and CHW users
- secure image access, preferably signed URLs instead of public buckets
- patient privacy, consent, audit, retention, and access-control rules

Do not use the prototype anon-key policies for real medical deployment.

## Dataset อ้างอิง

อ้างอิงแนวคิดจาก DFUTissueSegNet / DFUTissue Dataset

- GitHub: https://github.com/uwm-bigdata/DFUTissueSegNet
- Paper: https://arxiv.org/abs/2406.16012
