import lighthouse from "@lighthouse-web3/sdk";
import dotenv from "dotenv";
dotenv.config();

export const uploadToLighthouse = async (data) => {
  try {
    console.log('Uploading to Lighthouse...');
    
    // For Node.js environment, we need to write to a temporary file first
    // or use the buffer approach that Lighthouse supports
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    
    // Convert Blob to Buffer for Node.js
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use Lighthouse's uploadBuffer method for Node.js
    const output = await lighthouse.uploadBuffer(buffer, process.env.LIGHTHOUSE_API_KEY);
    
    console.log("Uploaded to Lighthouse. CID:", output.data.Hash);
    return output.data.Hash; // CID
    
  } catch (err) {
    console.error("Lighthouse upload error:", err);
    return null;
  }
};