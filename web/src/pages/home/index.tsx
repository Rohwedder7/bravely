import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createLink, deleteLink, listLinks } from "../../lib/links-api"
import { env } from "../../lib/env"
import { Copy, Trash2, Download } from "lucide-react"

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

  const { data, isLoading, isError, refetch } = useQuery({
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
          <span className="app-logo-icon" aria-hidden>@</span>
          brev.ly
        </h1>
      </header>

      <div className="home-layout">
        <section className="card home-form-card">
          <h2 className="card-title">Novo link</h2>
          <form id="create-link-form" onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="originalUrl">
                Link original
              </label>
              <input
                id="originalUrl"
                {...register("originalUrl")}
                placeholder="linkedin.com/in/myprofile"
                className={`input ${errors.originalUrl ? "input-error" : ""}`}
                disabled={isSubmitting}
              />
              {errors.originalUrl && (
                <p className="error-message">{errors.originalUrl.message}</p>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="short">
                Link encurtado
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

            <div className="form-actions">
              <button
                type="submit"
                form="create-link-form"
                className="btn btn-primary"
                disabled={isSubmitting || createMut.isPending}
              >
                {isSubmitting || createMut.isPending ? "Salvando..." : "Salvar link"}
              </button>
            </div>
          </form>
        </section>

        <section className="card home-links-panel">
          <div className="meus-links-header">
            <h2 className="meus-links-title">Meus links</h2>
            <form
              method="POST"
              action={exportCsvUrl}
              target="_blank"
              style={{ display: "inline-block" }}
            >
              <button type="submit" className="btn btn-secondary btn-sm">
                <Download size={16} style={{ flexShrink: 0 }} />
                Baixar CSV
              </button>
            </form>
          </div>

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

          {isLoading && (
            <div className="loading-state">Carregando links...</div>
          )}
          {isError && (
            <div className="error-state" style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
              <span>Erro ao carregar os links. Verifique se a API está rodando e se o banco está acessível.</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetch()}>
                Tente novamente
              </button>
            </div>
          )}

          {!isLoading && !isError && links.length === 0 && (
            <div className="empty-state">
              <p>Nenhum link ainda. Crie o primeiro ao lado.</p>
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
                    </div>
                    <div className="link-item-actions">
                      <span className="link-item-meta">
                        {l.clicks} {l.clicks === 1 ? "acesso" : "acessos"}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={() => navigator.clipboard.writeText(shortFull(l.short))}
                        title="Copiar"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-icon"
                        disabled={deleteMut.isPending}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (l.id) deleteMut.mutate(l.id)
                        }}
                        title="Deletar"
                      >
                        <Trash2 size={18} />
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
