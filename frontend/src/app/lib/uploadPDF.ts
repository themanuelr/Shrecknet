
  export async function uploadPDF(file: File, pageID: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pageID", pageID);
  
    const res = await fetch("/api/uploadPDF", {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) throw new Error("PDF upload failed");
    const { url } = await res.json();
    return url;
  }
  