import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ListingDesk from "./pages/ListingDesk";
import Exceptions from "./pages/Exceptions";
import Profiles from "./pages/Profiles";
import Controls from "./pages/Controls";
import Inventory from "./pages/Inventory";
import Credits from "./pages/Credits";
import ActivityLedger from "./pages/ActivityLedger";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/catalog"} component={Catalog} />
      <Route path={"/inventory"} component={Inventory} />
      <Route path={"/credits"} component={Credits} />
      <Route path={"/activity"} component={ActivityLedger} />
      <Route path={"/listings"} component={ListingDesk} />
      <Route path={"/exceptions"} component={Exceptions} />
      <Route path={"/profiles"} component={Profiles} />
      <Route path={"/controls"} component={Controls} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
