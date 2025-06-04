import JSZip from "jszip";

// Helper: upload a file to your uploads directory
export async function uploadImageFile(fileBlob, folder, filename) {
  const formData = new FormData();
  formData.append("file", fileBlob, filename);
  formData.append("folder", folder);
  formData.append("filename", filename.replace(/\.[^/.]+$/, "")); // Remove extension if present, add it below

  const res = await fetch("/api/uploadFile", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload file " + filename);
  return await res.json(); // { url: "/uploads/..." }
}

// Main function to process import zip
export async function importWorldZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);

  // 1. Upload all images/logos/icons
  const imagePromises = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && /\.(png|jpe?g|gif|svg)$/i.test(relativePath)) {
      const blobPromise = zipEntry.async("blob").then((blob) => {
        // Folder (after /images/) and filename
        const match = relativePath.match(/^images\/(.+)\/([^/]+)$/);
        if (!match) return;
        const folder = match[1];
        const filename = match[2];
        console.log("Upload: " + folder + "/"+filename)
        return uploadImageFile(blob, folder, filename);
      });
      imagePromises.push(blobPromise);
    }
  });
  await Promise.all(imagePromises);

  // 2. Extract world.json
  const worldJsonEntry = zip.file("world.json");
  if (!worldJsonEntry) throw new Error("world.json not found in ZIP");
  const worldJsonString = await worldJsonEntry.async("string");
  return worldJsonString; // Ready to send to backend import API
}