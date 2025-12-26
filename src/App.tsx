import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Cabinet from "./pages/Cabinet";
import Passenger from "./pages/Passenger";
import Thanks from "./pages/Thanks";
import { ConnectionStatus } from "./components/ConnectionStatus";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans">
        <ConnectionStatus />
        <Routes>
          {/* Главная страница — landing page о сервисе */}
          <Route path="/" element={<Home />} />
          
          {/* Страница входа/регистрации */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Личный кабинет водителя с плеером и QR */}
          <Route path="/cabinet" element={<Cabinet />} />
          
          {/* Страница пассажира, куда он попадает через QR (по имени водителя) */}
          <Route path="/passenger/:username" element={<Passenger />} />
          
          {/* Страница благодарности */}
          <Route path="/thanks" element={<Thanks />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;