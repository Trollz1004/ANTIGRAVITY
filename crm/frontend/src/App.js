import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import CityAnalytics from "@/pages/CityAnalytics";
import ContentGenerator from "@/pages/ContentGenerator";
import LeadManagement from "@/pages/LeadManagement";
import GroupsAnalytics from "@/pages/GroupsAnalytics";
import EmailCampaigns from "@/pages/EmailCampaigns";
import SocialCapture from "@/pages/SocialCapture";
import Automation from "@/pages/Automation";
import LandingPages from "@/pages/LandingPages";
import PlatformHub from "@/pages/PlatformHub";
import Layout from "@/components/Layout";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="cities" element={<CityAnalytics />} />
            <Route path="content" element={<ContentGenerator />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="groups" element={<GroupsAnalytics />} />
            <Route path="campaigns" element={<EmailCampaigns />} />
            <Route path="social" element={<SocialCapture />} />
            <Route path="automation" element={<Automation />} />
            <Route path="landing-pages" element={<LandingPages />} />
            <Route path="platforms" element={<PlatformHub />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
