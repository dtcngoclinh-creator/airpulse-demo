import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FlightDataProvider } from './context/FlightDataContext.jsx';
import { UserDataProvider } from './context/UserDataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Layout from './components/layout/Layout.jsx';
import Home from './pages/Home.jsx';
import Flights from './pages/Flights.jsx';
import FlightDetail from './pages/FlightDetail.jsx';
import Compare from './pages/Compare.jsx';
import Explore from './pages/Explore.jsx';
import DestinationDetail from './pages/DestinationDetail.jsx';
import Saved from './pages/Saved.jsx';
import Account from './pages/Account.jsx';
import About from './pages/About.jsx';
import Research from './pages/Research.jsx';
import ResearchUS from './pages/ResearchUS.jsx';
import ResearchVN from './pages/ResearchVN.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <FlightDataProvider>
        <UserDataProvider>
          <ToastProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/flights" element={<Flights />} />
                <Route path="/flights/:id" element={<FlightDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/explore/:slug" element={<DestinationDetail />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about" element={<About />} />
                <Route path="/research" element={<Research />} />
                <Route path="/research/us" element={<ResearchUS />} />
                <Route path="/research/vietnam" element={<ResearchVN />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ToastProvider>
        </UserDataProvider>
      </FlightDataProvider>
    </BrowserRouter>
  );
}
