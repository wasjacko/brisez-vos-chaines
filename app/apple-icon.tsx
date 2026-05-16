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
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eaeaf0" />
              <stop offset="55%" stopColor="#7a7a82" />
              <stop offset="100%" stopColor="#2a2a30" />
            </linearGradient>
            <linearGradient id="gb" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#e0e0e6" />
              <stop offset="55%" stopColor="#6a6a72" />
              <stop offset="100%" stopColor="#22222a" />
            </linearGradient>
          </defs>
          <ellipse
            cx="62"
            cy="88"
            rx="26"
            ry="48"
            stroke="url(#ga)"
            strokeWidth="15"
            fill="none"
          />
          <ellipse
            cx="118"
            cy="92"
            rx="48"
            ry="26"
            stroke="url(#gb)"
            strokeWidth="15"
            fill="none"
          />
        </svg>
      </div>
    ),
    size,
  );
}
