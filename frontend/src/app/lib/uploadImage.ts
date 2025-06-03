// lib/uploadImage.ts

export async function uploadImage(
  file: File,
  pageType: string,
  pageName: string,
  customFileName?: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pageType", pageType);
  formData.append("pageName", pageName);
  if (customFileName) formData.append("customFileName", customFileName);

  const res = await fetch("/api/uploadImage", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const { url } = await res.json();
  return url;
}