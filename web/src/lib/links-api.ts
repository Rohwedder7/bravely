import { api } from "./api"
import type { LinkItem } from "../types/link"

// Normaliza a resposta caso o backend use "shortUrl" em vez de "short", etc.
type LinkPayload = {
  id?: string
  originalUrl?: string
  url?: string
  original?: string
  short?: string
  shortUrl?: string
  slug?: string
  clicks?: number | string
  accessCount?: number | string
  visits?: number | string
  createdAt?: string
}

function normalizeLink(x: LinkPayload): LinkItem {
  return {
    id: x.id ?? "",
    originalUrl: x.originalUrl ?? x.url ?? x.original ?? "",
    short: x.short ?? x.shortUrl ?? x.slug ?? "",
    clicks: Number(x.clicks ?? x.accessCount ?? x.visits ?? 0),
    createdAt: x.createdAt,
  }
}

export async function listLinks(): Promise<LinkItem[]> {
  const { data } = await api.get("/links")
  const raw = Array.isArray(data) ? data : (data?.links ?? [])
  return (Array.isArray(raw) ? raw : []).map(normalizeLink)
}

export async function createLink(payload: { originalUrl: string; short: string }): Promise<LinkItem> {
  const body = { originalUrl: payload.originalUrl, customShortUrl: payload.short }

  const { data } = await api.post("/links", body)
  return normalizeLink(data)
}

export async function deleteLink(id: string): Promise<void> {
  await api.delete(`/links/${id}`)
}

export async function getByShort(short: string): Promise<LinkItem> {
  const { data } = await api.get(`/links/resolve/${short}`)
  return normalizeLink(data)
}
