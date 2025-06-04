export async function uploadFile(file, folder, filename) {
    // Compose the upload endpoint; you may want to adjust this to your API route
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("filename", filename);
  
    // Example: POST /api/upload (update as needed)
    const res = await fetch("/api/uploadFile", {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) {
      const msg = await res.text();
      throw new Error("File upload failed: " + msg);
    }
  
    const data = await res.json();
    // data.url should be the /uploads path of the uploaded file
    return data.url;
  }