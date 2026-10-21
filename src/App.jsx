import React from "react";
import Config from "./components/Config";
import useApiConnection from "./hooks/useApiConnection";

const App = () => {
  const {
    status,
    checkApiKeyStatus,
    logoUrl,
    pendingConnection,
    clearPendingConnection,
  } = useApiConnection();
  return (
    <div className="p-6 bg-[#0e0f0f] light:bg-[#f9fbfd] min-h-screen flex flex-col items-center">
      <img src={logoUrl} alt="AnythingLLM Logo" className="w-40 mb-6" />
      <div className="bg-zinc-900 light:bg-white border border-zinc-800 light:border-slate-300 p-6 rounded-[16px] w-full max-w-md">
        <p className="text-zinc-300 light:text-slate-700 text-sm mb-6">
          Right click on any page and send selected text or entire pages to
          AnythingLLM.
        </p>
        <Config
          status={status}
          onStatusChange={checkApiKeyStatus}
          pendingConnection={pendingConnection}
          onPendingConnectionHandled={clearPendingConnection}
        />
      </div>
    </div>
  );
};

export default App;
