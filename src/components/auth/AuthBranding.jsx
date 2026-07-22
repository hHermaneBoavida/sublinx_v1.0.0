import React from "react";

export default function AuthBranding({ subtitle }) {
  return (
    <div className="flex flex-col items-center mt-8">
      <img
        src="https://media.base44.com/images/public/68a70ee66a1156f1068d2903/a1612e3df_Capturadetela2025-08-01215926.png"
        alt="SUBLINX"
        className="w-28 h-28 object-contain"
      />
      <h1 className="text-4xl font-black tracking-[0.15em] mt-6" style={{ color: "#8A2BE2" }}>
        SUBLINX
      </h1>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}