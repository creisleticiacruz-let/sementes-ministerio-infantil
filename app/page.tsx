export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-3xl font-bold text-emerald-600 mb-2">
          Sementes
        </h1>
        <p className="text-gray-600 mb-6">
          Plataforma do Ministério Infantil
        </p>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-sm font-medium text-emerald-800">
            Sistema publicado e conectado com sucesso! 🎉
          </p>
        </div>
      </div>
    </main>
  );
}