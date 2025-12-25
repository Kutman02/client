import { Heart, Coffee } from "lucide-react";

const Thanks: React.FC = () => {
  return (
    <div className="p-6 max-w-md mx-auto h-screen flex flex-col items-center justify-center text-center">
      <div className="bg-green-100 p-5 rounded-full mb-6">
        <Heart className="text-green-600" size={50} fill="currentColor" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Поездка завершена</h1>
      <p className="text-gray-600 mb-8">Спасибо, что слушали музыку вместе с нами!</p>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 w-full">
        <h2 className="font-bold mb-4 flex items-center justify-center gap-2">
          <Coffee className="text-yellow-600" /> Поддержать водителя
        </h2>
        <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-colors">
          Оставить чаевые
        </button>
      </div>
    </div>
  );
};

export default Thanks;