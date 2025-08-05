"use client";

import { Upload } from "lucide-react";
import * as React from "react";

const FileUploadComponent: React.FC = () => {
  const handleFileUploadButtonClick = () => {
    const fileInputElement = document.createElement("input");
    fileInputElement.setAttribute("type", "file");
    fileInputElement.setAttribute("accept", "application/pdf");
    fileInputElement.addEventListener("change", (e) => {
      console.log(fileInputElement.files);
      if (fileInputElement.files && fileInputElement.files.length > 0) {
        const file = fileInputElement.files.item(0);
        if (file) {
          const formData = new FormData();
          formData.append("pdf", file);

          fetch("http://localhost:8000/upload/pdf", {
            method: "POST",
            body: formData,
          });
        }
      }
    });
    fileInputElement.click();
  };
  return (
    <div className="bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4 rounded-lg border-white border-2">
      <div
        onClick={handleFileUploadButtonClick}
        className="flex justify-center items-center flex-col"
      >
        <h3>Upload PDF File</h3>
        <Upload />
      </div>
    </div>
  );
};

export default FileUploadComponent;
