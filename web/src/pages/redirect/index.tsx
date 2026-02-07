import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getByShort } from "../../lib/links-api"
import NotFound from "../notfound"

export default function RedirectPage() {
  const { short } = useParams()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["linkByShort", short],
    queryFn: () => getByShort(short!),
    enabled: !!short,
    retry: false,
  })

  useEffect(() => {
    if (!data) return

    ;(async () => {
      window.location.href = data.originalUrl
    })()
  }, [data])

  if (isLoading) {
    return (
      <div className="page-cover">
        <div className="card">
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Redirecionando...
          </p>
        </div>
      </div>
    )
  }

  const status = (error as { response?: { status?: number } } | null)?.response?.status
  if (isError && status === 404) return <NotFound />

  if (isError) {
    return (
      <div className="page-cover">
        <div className="error-state">Erro no redirecionamento.</div>
      </div>
    )
  }

  return (
    <div className="page-cover">
      <div className="card">
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          Preparando...
        </p>
      </div>
    </div>
  )
}
