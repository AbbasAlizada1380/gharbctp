import { useState } from "react";
import Incoming from "./Incoming";
import Outgoing from "./Outgoing";
import ExistingStock from "./ExistingStock";

const Stock = () => {
  const [activeTab, setActiveTab] = useState("incoming");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold text-cyan-800 mb-6">مدیریت موجودی</h2>

        {/* Navbar / Tabs */}
        <div className="flex  border-gray-300 gap-2">
          <button
            className={`px-4 py-2 font-medium rounded-md ${activeTab === "incoming"
              ? " bg-cyan-800 text-white"
              : "text-white bg-gray-400 hover:bg-gray-500"
              }`}
            onClick={() => setActiveTab("incoming")}
          >
            ورود پلیت
          </button>
          <button
            className={`px-4 py-2 font-medium rounded-md ${activeTab === "outgoing"
              ? "bg-cyan-800 text-white"
              : "text-white bg-gray-400 hover:bg-gray-500"
              }`}
            onClick={() => setActiveTab("outgoing")}
          >
            خروج پلیت
          </button>
          <button
            className={`px-4 py-2 font-medium rounded-md ${activeTab === "existed"
              ? "bg-cyan-800 text-white"
              : "text-white bg-gray-400 hover:bg-gray-500"
              }`}
            onClick={() => setActiveTab("existed")}
          >
            موجودی پلیت
          </button>
        </div>

        {/* Active Tab Content */}
        <div>
          {activeTab === "incoming" && <Incoming />}
          {activeTab === "outgoing" && <Outgoing />}
          {activeTab === "existed" && <ExistingStock />}
        </div>
      </div>
    </div>
  );
};

export default Stock;
