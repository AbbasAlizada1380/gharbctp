import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { signOutSuccess } from "../../state/userSlice/userSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaHome,
  FaUsers,
  FaWallet,
  FaMoneyBillWave,
  FaChartPie,
  FaSignOutAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import {
  MdOutlineDashboardCustomize,
  MdKeyboardArrowDown,
  MdOutlineAssessment,
  MdOutlinePayments,
} from "react-icons/md";
import { PiUsersThree } from "react-icons/pi";
import { GiTakeMyMoney } from "react-icons/gi";
import { BiSolidReport } from "react-icons/bi";

const Sidebar = ({ setActiveComponent }) => {
  const [selectedC, setSelectedC] = useState("dashboard");
  const [openReportsMenu, setOpenReportsMenu] = useState(false);
  const [lastOpenedMenu, setLastOpenedMenu] = useState(null);

  const sidebarRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const MySwal = withReactContent(Swal);

  // Close all dropdowns except the specified one
  const closeOtherDropdowns = (menuToKeepOpen) => {
    if (menuToKeepOpen !== "reports") setOpenReportsMenu(false);
    setLastOpenedMenu(menuToKeepOpen);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (menuType) => {
    let shouldOpen = false;

    switch (menuType) {
      case "reports":
        shouldOpen = !openReportsMenu;
        setOpenReportsMenu(shouldOpen);
        break;
      default:
        break;
    }

    if (shouldOpen) {
      closeOtherDropdowns(menuType);
    } else {
      setLastOpenedMenu(null);
    }
  };

  // Handle component selection
  const handleComponentSelect = (componentValue) => {
    setSelectedC(componentValue);
    setActiveComponent(componentValue);
    setOpenReportsMenu(false);
  };

  // Handle sub-item click
  const handleSubItemClick = (componentValue, parentMenu) => {
    setSelectedC(componentValue);
    setActiveComponent(componentValue);
    setLastOpenedMenu(parentMenu);

    switch (parentMenu) {
      case "reports":
        setOpenReportsMenu(true);
        break;
      default:
        break;
    }
  };

  const handleSignOut = () => {
    MySwal.fire({
      title: "آیا مطمئن هستید؟",
      text: "شما از سیستم خارج خواهید شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله، خارج شو!",
      cancelButtonText: "لغو",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(signOutSuccess());
        navigate("/sign-in");
      }
    });
  };

  // Main Menu Items for Employee Loan Management System
  const mainMenuItems = [
    {
      name: "داشبورد اصلی",
      value: "dashboard",
      icon: <FaHome />,
      description: "مشاهده آمار و اطلاعات کلی",
    },
    {
      name: "مدیریت کارمندان",
      value: "employees",
      icon: <PiUsersThree />,
      description: "ثبت و مدیریت اطلاعات کارمندان",
    },

    {
      name: "مدیریت قرضه‌ها",
      value: "loans",
      icon: <GiTakeMyMoney />,
      description: "مشاهده و مدیریت قرضه‌های فعال و بسته شده",
    },
  ];

  // Report Sub-menu Items
  const reportItems = [
    {
      name: "گزارش کلی شرکت",
      value: "companyReport",
      icon: <MdOutlineAssessment />,
      description: "گزارش کلی از وضعیت مالی شرکت",
    },
    {
      name: "گزارش کارمندان",
      value: "employeeReport",
      icon: <FaChartPie />,
      description: "گزارش قرضه‌های هر کارمند",
    },
  
  ];

  // Add scroll event listener
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      const isScrollable = sidebar.scrollHeight > sidebar.clientHeight;
      if (isScrollable) {
        sidebar.classList.add("has-scroll");
      }
    }
  }, []);

  return (
    <div className="h-full w-64 relative flex flex-col bg-slate-900 text-white overflow-hidden shadow-2xl">
      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-2 border-b border-gray-700">
        <div className="flex items-center justify-center p-1 bg-white rounded-full">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-teal-500">
             مدیریت قرضه
          </span>
          <span className="text-xs text-gray-400">کارمندان</span>
        </div>
      </header>

      {/* Scrollable Menu Area */}
      <div
        ref={sidebarRef}
        className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar"
      >
        <ul className="space-y-1">
          {/* Main Menu Items */}
          {mainMenuItems.map((item, index) => (
            <li key={index} className="relative group">
              <button
                onClick={() => handleComponentSelect(item.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  selectedC === item.value
                    ? "bg-teal-700 text-white shadow-lg "
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
                title={item.description}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-right text-sm font-medium">
                  {item.name}
                </span>
              </button>
            </li>
          ))}

          {/* Reports Dropdown Menu */}
          <li className="relative group mt-2">
            <div>
              {/* Main Reports button */}
              <button
                onClick={() => handleDropdownToggle("reports")}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  openReportsMenu
                    ? "bg-teal-700 text-white shadow-lg "
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    <BiSolidReport />
                  </span>
                  <span className="text-sm font-medium">گزارش‌ها</span>
                </div>
                <MdKeyboardArrowDown
                  size={20}
                  className={`transition-transform duration-300 ${
                    openReportsMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Reports Sub Menu */}
              {openReportsMenu && (
                <ul className="mt-1 mr-6 space-y-1 border-r-2 border-teal-700 pr-2">
                  {reportItems.map((report, index) => (
                    <li key={index}>
                      <button
                        onClick={() =>
                          handleSubItemClick(report.value, "reports")
                        }
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-300 ${
                          selectedC === report.value
                            ? "bg-teal-700 text-white"
                            : "text-gray-400 hover:bg-gray-700 hover:text-white"
                        }`}
                        title={report.description}
                      >
                        <span className="text-base">{report.icon}</span>
                        <span className="text-right">{report.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>

          {/* Sign Out Button */}
          {currentUser && (
            <li className="absolute bottom-4 left-3 right-3">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-300 hover:bg-red-600 hover:text-white"
              >
                <span className="text-xl">
                  <FaSignOutAlt />
                </span>
                <span className="text-sm font-medium">خروج از سیستم</span>
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #06b6d4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0891b2;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
