import React from "react";
import ReactDOM from "react-dom/client";
import { LegalPage, type LegalPageId } from "./legal/LegalPages";
import "./index.css";

// Legal pages are static: no wallet libraries load here.
const root = document.getElementById("root")!;
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <LegalPage page={root.dataset.page as LegalPageId} />
  </React.StrictMode>
);
