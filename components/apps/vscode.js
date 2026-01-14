import React from "react";

export default function VsCode() {
  return (
    <iframe
      src="https://stackblitz.com/edit/js?embed=1&file=index.html&theme=dark"
      frameBorder="0"
      title="VsCode"
      className="h-full w-full bg-ub-cool-grey"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking; clipboard-read; clipboard-write"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads allow-pointer-lock"
    ></iframe>
  );
}

export const displayVsCode = () => {
  return <VsCode />;
};
