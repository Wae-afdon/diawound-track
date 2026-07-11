import { isSupabaseConfigured, requireSupabase } from "../lib/supabase";

const WOUND_IMAGE_BUCKET = "wound-images";

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}

export async function uploadWoundImageFromDataUrl({
  dataUrl,
  patientId,
  recordId,
}: {
  dataUrl: string;
  patientId: string;
  recordId: string;
}) {
  if (!isSupabaseConfigured || !dataUrl.startsWith("data:image")) return dataUrl;

  const extension = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);/)?.[1]?.replace("jpeg", "jpg") ?? "png";
  const filePath = `${patientId}/${recordId}-${Date.now()}.${extension}`;
  const file = dataUrlToFile(dataUrl, filePath.split("/").pop() ?? "wound.png");

  const client = requireSupabase();
  const { error } = await client.storage
    .from(WOUND_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
  if (error) throw error;

  const { data } = client.storage.from(WOUND_IMAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
