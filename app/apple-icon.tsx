import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#000000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 158,
            height: 158,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 36% 32%, #e8efff 0%, #6486ff 22%, #2a1024 55%, #ff3422 84%, #7a1010 100%)",
            boxShadow:
              "0 0 28px 4px rgba(255, 52, 34, 0.45), inset -10px -16px 22px rgba(0,0,0,0.55)",
          }}
        />
      </div>
    ),
    size,
  );
}
