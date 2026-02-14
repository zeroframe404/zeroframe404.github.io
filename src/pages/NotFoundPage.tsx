import { Link, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const location = useLocation()

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <h1 className="mb-2 text-6xl font-light text-slate-300">404</h1>
        <div className="mx-auto mb-4 h-0.5 w-16 bg-slate-200" />
        <h2 className="mb-3 text-2xl font-medium text-slate-800">Página no encontrada</h2>
        <p className="mb-6 text-slate-600">
          La página <span className="font-medium text-slate-700">"{location.pathname}"</span> no existe en este sitio.
        </p>
        <Link to="/Home" className="btn-outline">
          Go Home
        </Link>
      </div>
    </div>
  )
}
