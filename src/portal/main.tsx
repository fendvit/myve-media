import { createRoot } from "react-dom/client";
import PortalApp from "./PortalApp";
import { registerServiceWorker } from "./lib/push";
import "../index.css";

createRoot(document.getElementById("root")!).render(<PortalApp />);

// Registered up front so the browser reports an accurate permission state and
// an already-granted subscription keeps working after a reload. Asking for
// permission stays an explicit user action in settings.
void registerServiceWorker();
