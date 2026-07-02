import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

// Route segment config
export const runtime = "nodejs";

// Image metadata
export const size = {
  width: 96,
  height: 96,
};
export const contentType = "image/png";

export default async function Icon() {
  try {
    const logoPath = path.join(process.cwd(), "public", "Round Logo.png");
    const logoData = fs.readFileSync(logoPath);
    const base64Logo = logoData.toString("base64");
    const logoSrc = `data:image/png;base64,${base64Logo}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          <img
            src={logoSrc}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
            alt="T-Cloud Eats Logo"
          />
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error("Error generating dynamic favicon:", error);
    // Return empty transparent box fallback
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", background: "transparent" }} />
      ),
      {
        ...size,
      }
    );
  }
}
