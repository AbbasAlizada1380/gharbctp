// import Customer from "./pages/ServiceManger";
import Dashboard from "./pages/dashboard";
// import S_Transaction from "./pages/RentManager";
import Report from "./pages/reports";
import Orders from "./pages/Orders";
import AddUser from "./pages/AddUser";
import Customers from "./pages/Customers";
import Stock from "./pages/Stock";
import ExpenseManager from "./pages/expense/ExpenseManages";
import StaffManager from "./pages/StaffManager";
const MainContent = ({ activeComponent }) => {
  const renderContent = () => {
    switch (activeComponent) {
      case "dashboard":
        return <Dashboard />;
      case "ActiveAthletes":
        return <ActiveAthletes />;
      case "Customers":
        return <Customers />;
      case "user managements":
        return <UserManagement />;
      case "report":
        return <Report />;
      case "Salaries":
        return <Salaries />;
      case "StaffManager":
        return <StaffManager />;
      case "Stock":
        return <Stock />;
      case "ExpenseManager":
        return <ExpenseManager />;
      case "Orders":
        return <Orders />;
      case "AddUser":
        return <AddUser />;

      default:
        return <Dashboard />;
    }
  };

  return <div className="min-h-[90vh]">{renderContent()}</div>;
};

export default MainContent;
