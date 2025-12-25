import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMusic, FaQrcode, FaUsers, FaHeadphones, FaArrowRight, FaShieldAlt, FaMobileAlt, FaClock, FaHeart } from "react-icons/fa";
import DonationModal from "../components/DonationModal";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);

  const handleJoin = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FaMusic className="text-white text-xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black bg-linear-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              Driver's Music
            </span>
            <span className="text-[10px] md:text-xs font-medium text-white/40 leading-tight">from KutSoft</span>
          </div>
        </div>
        <button
          onClick={handleJoin}
          className="px-6 py-2.5 bg-linear-to-r from-indigo-600 to-blue-600 rounded-xl font-bold text-sm hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all active:scale-95 flex items-center gap-2"
        >
          Присоединиться
          <FaArrowRight className="text-xs" />
        </button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Музыка в пути
            </span>
            <br />
            <span className="text-white">для каждого пассажира</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed">
            Driver's Music от KutSoft — инновационный сервис для водителей такси, позволяющий пассажирам выбирать музыку во время поездки
          </p>
          <button
            onClick={handleJoin}
            className="px-10 py-5 bg-linear-to-r from-indigo-600 to-blue-600 rounded-2xl font-black text-lg hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] transition-all active:scale-95 flex items-center gap-3 mx-auto group"
          >
            Присоединиться к сервису
            <FaArrowRight className="text-base group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {/* Feature 1 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
            <div className="w-16 h-16 bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/30">
              <FaQrcode className="text-white text-2xl" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">QR-код доступа</h3>
            <p className="text-white/60 leading-relaxed">
              Пассажиры сканируют QR-код и получают мгновенный доступ к управлению музыкой в вашем автомобиле
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
            <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
              <FaHeadphones className="text-white text-2xl" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">Синхронное воспроизведение</h3>
            <p className="text-white/60 leading-relaxed">
              Все пассажиры слышат одну и ту же музыку в реальном времени, создавая общую атмосферу
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
            <div className="w-16 h-16 bg-linear-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
              <FaUsers className="text-white text-2xl" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-white">Совместный плейлист</h3>
            <p className="text-white/60 leading-relaxed">
              Пассажиры могут добавлять свои любимые треки в общий плейлист, делая поездку более интересной
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-32">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-linear-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Преимущества
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <FaShieldAlt className="text-3xl text-indigo-400 mb-4" />
              <h3 className="text-xl font-black mb-3 text-white">Безопасность</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Код доступа обновляется каждый час, обеспечивая безопасность вашей сессии
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <FaMobileAlt className="text-3xl text-blue-400 mb-4" />
              <h3 className="text-xl font-black mb-3 text-white">Удобство</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Работает на любом устройстве - смартфоне, планшете или компьютере
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
              <FaClock className="text-3xl text-purple-400 mb-4" />
              <h3 className="text-xl font-black mb-3 text-white">Автоматизация</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Плейлист автоматически очищается каждый час, поддерживая актуальность
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            <span className="bg-linear-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Как это работает
            </span>
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Регистрация",
                description: "Водитель создает аккаунт и получает персональный QR-код"
              },
              {
                step: "02",
                title: "Сканирование",
                description: "Пассажир сканирует QR-код и вводит код доступа"
              },
              {
                step: "03",
                title: "Выбор музыки",
                description: "Пассажир ищет и добавляет любимые треки в плейлист"
              },
              {
                step: "04",
                title: "Наслаждение",
                description: "Все слушают синхронизированную музыку во время поездки"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full hover:bg-white/10 transition-all group">
                  <div className="text-5xl font-black text-white/10 mb-4 group-hover:text-white/20 transition-colors">{item.step}</div>
                  <h3 className="text-xl font-black mb-3 text-white">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-white/20">
                    <FaArrowRight className="text-2xl" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <div className="bg-linear-to-r from-indigo-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Готовы начать?
            </h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к Driver's Music от KutSoft и сделайте каждую поездку незабываемой
            </p>
            <button
              onClick={handleJoin}
              className="px-12 py-5 bg-linear-to-r from-indigo-600 to-blue-600 rounded-2xl font-black text-lg hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] transition-all active:scale-95 flex items-center gap-3 mx-auto group"
            >
              Начать сейчас
              <FaArrowRight className="text-base group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
          <p>© 2024 Driver's Music from KutSoft. Все права защищены.</p>
        </div>
      </footer>

      {/* Фиксированная иконка доната */}
      <button
        onClick={() => setIsDonationModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-linear-to-br from-pink-600 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Поддержать проект"
      >
        <FaHeart className="text-white text-lg md:text-xl" />
      </button>

      {/* Модальное окно доната */}
      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
      />
    </div>
  );
};

export default Home;

