import AdminLayout from "../components/AdminLayout";
import AdminAllVisits from "./AllData";
import { useState } from "react";

const EmployeeStatusPage = () => {
    // This page will render the AdminAllVisits component 
    // but we'll modify AdminAllVisits to accept an initial tab if needed.
    // For now, it defaults to "Visitors", so we might need to update AdminAllVisits.
    
    return (
        <AdminAllVisits initialTab="Employees" hideTabs={true} />
    );
};

export default EmployeeStatusPage;
