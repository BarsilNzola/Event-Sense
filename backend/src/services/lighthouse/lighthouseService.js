import lighthouse from "@lighthouse-web3/sdk";
import dotenv from "dotenv";
dotenv.config();

export const uploadToLighthouse = async (data) => {
  try {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const file = new File([blob], "summary.json");

    const output = await lighthouse.upload(file, process.env.LIGHTHOUSE_API_KEY);
    console.log("📦 Uploaded to Lighthouse:", output.data.Hash);
    return output.data.Hash; // CID
  } catch (err) {
    console.error("Lighthouse upload error:", err);
    return null;
  }
};
