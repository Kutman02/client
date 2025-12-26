import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
// Импортируем мутации из нашего обновленного apiSlice
import { useLoginMutation, useRegisterMutation } from "../api/apiSlice";
import { useAppDispatch } from "../redux/hooks";
import { setAuth } from "../redux/slices/authSlice";
import DonationModal from "../components/DonationModal";

interface AuthForm {
  username: string;
  email: string;
  password: string;
}

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [form, setForm] = useState<AuthForm>({ username: "", email: "", password: "" });
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Инициализируем мутации RTK Query
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register, { isLoading: isRegLoading }] = useRegisterMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Выполняем логин через RTK Query (.unwrap() позволяет обработать результат как обычный промис)
        const userData = await login({ email: form.email, password: form.password }).unwrap();
        
        console.group("🔐 Данные от сервера при логине");
        console.log("Username:", userData.username);
        console.log("Has Token:", !!userData.token);
        console.log("Full Data (JSON):", JSON.stringify(userData, null, 2));
        console.groupEnd();
        
        if (userData.token && userData.username) {
          // Проверяем, что username не является email
          if (userData.username.includes('@')) {
            console.error("❌ Сервер вернул email вместо username:", userData.username);
            alert("Ошибка: сервер вернул неверные данные. Попробуйте снова.");
            return;
          }
          
          // Сохраняем в Redux
          dispatch(setAuth({ 
            username: userData.username, 
            token: userData.token 
          }));
          
          console.group("✅ Сохранено в Redux");
          console.log("Username:", userData.username);
          console.log("Has Token:", !!userData.token);
          console.groupEnd();
          navigate("/cabinet");
        } else {
          alert("Ошибка: не получены данные пользователя");
        }
      } else {
        // Выполняем регистрацию
        await register({ username: form.username, email: form.email, password: form.password }).unwrap();
        setIsLogin(true);
        alert("Регистрация успешна! Теперь войдите.");
      }
    } catch (err: unknown) {
      // RTK Query возвращает ошибку в поле data
      const error = err as { data?: { error?: string } };
      alert(error.data?.error || "Произошла ошибка при аутентификации");
    }
  };

  const isLoading = isLoginLoading || isRegLoading;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-linear-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-3xl">🎵</span>
          </div>
          <h1 className="text-3xl font-black mb-2 bg-linear-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Driver's Music
          </h1>
          <p className="text-xs font-medium text-white/40">from KutSoft</p>
          <p className="text-white/60 text-sm">Войдите в свой аккаунт</p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full transition-all"
        >
          <h2 className="text-2xl font-black mb-6 text-center text-white">
            {isLogin ? "Вход для водителя" : "Регистрация"}
          </h2>

        {!isLogin && (
          <input 
            className="w-full mb-4 p-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none transition-colors" 
            placeholder="Имя пользователя (username)" 
            required
            onChange={e => setForm({...form, username: e.target.value})} 
          />
        )}

        <input 
          className="w-full mb-4 p-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none transition-colors" 
          placeholder="Email" 
          type="email"
          required
          onChange={e => setForm({...form, email: e.target.value})} 
        />

        <input 
          className="w-full mb-6 p-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 outline-none transition-colors" 
          type="password" 
          placeholder="Пароль" 
          required
          onChange={e => setForm({...form, password: e.target.value})} 
        />

        <button 
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isLoading 
            ? "bg-gray-700 cursor-not-allowed" 
            : "bg-linear-to-r from-indigo-600 to-blue-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95"
          }`}
        >
          {isLoading ? "Обработка..." : (isLogin ? "Войти" : "Создать аккаунт")}
        </button>

          <p 
            className="mt-6 text-center text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </p>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            ← Вернуться на главную
          </button>
        </div>
      </div>

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

export default Auth;