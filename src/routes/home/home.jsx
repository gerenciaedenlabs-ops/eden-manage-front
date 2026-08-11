import Img from "@assets/logo/manage_logo_removebg_big.png";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const threshold = 12;

  const handleMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setTilt({ x: y * -threshold, y: x * threshold });
  };
  return (
    <div className="w-full h-full flex justify-center items-center bg-slate-100">
      <div
        className="rounded-xl shadow-xl overflow-hidden transition-transform duration-200 ease-out cursor-pointer max-w-80 bg-white"
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <img
          src={Img}
          alt="EdenLabs Manage"
          className="w-full h-52 object-contain"
        />
        <h3 className="mt-3 px-4 pt-3 mb-1 text-lg font-semibold text-gray-800">
          EdenLabs Manage
        </h3>
        <p className="text-sm px-4 pb-6 text-gray-600 w-5/6">
          EdenLabs Manage es una aplicación web que sirve para planear, organizar y
          distribuir el trabajo para nuestra empresa @Eden Labs - Construimos tu futuro
        </p>
        <div className="flex justify-center p-6 pt-2 gap-7">
          <Link
            to={"/login"}
            className="min-w-32  rounded-md bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
