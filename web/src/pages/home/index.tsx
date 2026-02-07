import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createLink, deleteLink, listLinks } from "../../lib/links-api"
import { env } from "../../lib/env"
import { Link2, Copy, ExternalLink, Trash2, Download } from "lucide-react"

const schema = z.object({
  originalUrl: z.string().url("Informe uma URL válida (com http/https)."),
  short: z
    .string()
    .min(3, "Mínimo 3 caracteres.")
    .max(40, "Máximo 40 caracteres.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, _ e -."),
})

type FormData = z.infer<typeof schema>

export default function Home() {
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["links"],
    queryFn: listLinks,
  })

  const links = useMemo(() => data ?? [], [data])

  const createMut = useMutation({
    mutationFn: createLink,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["links"] })
      reset()
    },
  })

  const [deleteError, setDeleteError] = useState<string | null>(null)

  const deleteMut = useMutation({
    mutationFn: deleteLink,
    onSuccess: async () => {
      setDeleteError(null)
      await qc.invalidateQueries({ queryKey: ["links"] })
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number; data?: { message?: string } } }).response?.data?.message
          : null
      setDeleteError(msg ?? "Erro ao deletar o link. Tente novamente.")
    },
  })

  const exportCsvUrl = `${env.BACKEND_URL}/links/export`

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormData) {
    try {
      await createMut.mutateAsync(values)
    } catch (e: unknown) {
      let status: number | undefined
      let msg = "Erro ao criar link."

      if (typeof e === "object" && e && "response" in e) {
        const response = (e as { response?: { status?: number; data?: { message?: string } } }).response
        status = response?.status
        msg = response?.data?.message ?? msg
      }

      if (status === 409) setError("short", { message: msg })
      else setError("originalUrl", { message: msg })
    }
  }

  function shortFull(short: string) {
    return `${env.FRONTEND_URL}/${short}`
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-logo">
          Brev.<span>ly</span>
        </h1>
        <p className="app-subtitle">Encurte seus links de forma simples e rápida</p>
      </header>

      <div className="home-layout">
        <section className="card home-form-card">
          <h2 className="card-title">Novo link encurtado</h2>
          <form id="create-link-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="originalUrl">
                URL original
              </label>
              <input
                id="originalUrl"
                {...register("originalUrl")}
                placeholder="https://exemplo.com/pagina"
                className={`input ${errors.originalUrl ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.originalUrl && (
                <p className="error-message">{errors.originalUrl.message}</p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="short">
                Link Encurtado
              </label>
              <input
                id="short"
                {...register("short")}
                placeholder="meu-link"
                className={`input ${errors.short ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.short && (
                <p className="error-message">{errors.short.message}</p>
              )}
            </div>
          </form>
          <div className="form-actions">
            <button
              type="submit"
              form="create-link-form"
              className="btn btn-primary"
              disabled={isSubmitting || createMut.isPending}
            >
              <Link2 size={18} />
              {isSubmitting || createMut.isPending ? "Criando..." : "Criar link"}
            </button>
            <form
              method="POST"
              action={exportCsvUrl}
              target="_blank"
              className="form-csv"
            >
              <button type="submit" className="btn btn-secondary">
                <Download size={18} />
                Baixar CSV
              </button>
            </form>
          </div>
        </section>

        <section className="home-links-panel">
          <div className="section-header">
            <h2 className="section-title">Seus links</h2>
            <span className="section-count">
              {links.length} {links.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {isLoading && (
            <div className="loading-state">Carregando links...</div>
          )}
          {isError && (
            <div className="error-state">Erro ao carregar os links. Tente novamente.</div>
          )}

          {!isLoading && !isError && links.length === 0 && (
            <div className="empty-state">
              <p>Nenhum link ainda. Crie o primeiro ao lado.</p>
            </div>
          )}

          {deleteError && (
            <div
              className="error-state"
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span>{deleteError}</span>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setDeleteError(null)}
              >
                Fechar
              </button>
            </div>
          )}

          {!isLoading && !isError && links.length > 0 && (
            <div className="links-grid">
              {links.map((l) => (
                <div key={l.id} className="link-item">
                  <div className="link-item-inner">
                    <div className="link-item-text">
                      <p className="link-item-url">{shortFull(l.short)}</p>
                      <p className="link-item-original">{l.originalUrl}</p>
                      <p className="link-item-meta">
                        {l.clicks} {l.clicks === 1 ? "acesso" : "acessos"}
                      </p>
                    </div>
                    <div className="link-item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigator.clipboard.writeText(shortFull(l.short))}
                        title="Copiar"
                      >
                        <Copy size={16} />
                        Copiar
                      </button>
                      <a href={shortFull(l.short)} target="_blank" rel="noreferrer">
                        <button type="button" className="btn btn-secondary btn-sm">
                          <ExternalLink size={16} />
                          Abrir
                        </button>
                      </a>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={deleteMut.isPending}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (l.id) deleteMut.mutate(l.id)
                        }}
                        title="Deletar"
                      >
                        <Trash2 size={16} />
                        {deleteMut.isPending ? "..." : "Deletar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
