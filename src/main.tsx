import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { isExtension, loadExtensionStorage } from "./utils/storageBridge";
import { getSelectedNetwork, setSelectedNetwork } from "./utils/tokenSession";
import { DEFAULT_NETWORKS } from "./config/netwotk";
import "./styles/index.css";

async function bootstrap() {
  if (isExtension()) await loadExtensionStorage();
  if (!getSelectedNetwork()) setSelectedNetwork(DEFAULT_NETWORKS[0]);
  createRoot(document.getElementById("root")!).render(<App />);
}
bootstrap();
