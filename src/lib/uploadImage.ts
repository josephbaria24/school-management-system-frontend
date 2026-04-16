const API = process.env.NEXT_PUBLIC_API_URL;

export async function uploadImageToCloudinary(
  file: File,
  folder = "sms/logos"
): Promise<{ url: string; public_id?: string }> {
  if (!API) throw new Error("NEXT_PUBLIC_API_URL is not set");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch(`${API}/api/upload/image`, {
    method: "POST",
    body: fd,
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
    public_id?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }
  if (!data.url) {
    throw new Error("Upload did not return a URL");
  }

  return { url: data.url, public_id: data.public_id };
}
