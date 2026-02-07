import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="page-cover">
      <div className="card">
        <h1 className="app-logo" style={{ marginBottom: 8 }}>
          Brev.<span>ly</span>
        </h1>
        <h2 className="section-title" style={{ marginTop: 24, marginBottom: 12 }}>
          Página não encontrada
        </h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>
          O endereço não existe ou o encurtamento informado não foi encontrado.
        </p>
        <Link to="/">
          <button type="button" className="btn btn-primary">
            Voltar ao início
          </button>
        </Link>
      </div>
    </div>
  )
}
