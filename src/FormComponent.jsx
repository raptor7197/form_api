import React, { useEffect } from "react";

function FormComponent() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center mb-4">Report an Issue</h2>
      <iframe
        data-tally-src="https://tally.so/embed/YOUR_FORM_ID?alignLeft=1&hideTitle=1"
        width="100%"
        height="400"
        frameBorder="0"
        title="Issue Form"
      ></iframe>
    </div>
  );
}

export default FormComponent;
