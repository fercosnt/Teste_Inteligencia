import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { ORDEM_PADRAO, DIRECAO_PADRAO, construirHref } from '@/lib/relatorios-query'

// Formulário GET puro: o termo vai parar na URL, então recarregar, favoritar ou
// compartilhar o link preserva a busca — e a tela segue sendo server component,
// sem estado de cliente para manter em sincronia.
export default function Busca({ busca, ordem, direcao, total }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action="/relatorios" method="get" className="flex items-center gap-2 grow sm:grow-0">
        {/* A ordenação vigente viaja junto, senão buscar zeraria a ordem. */}
        {ordem !== ORDEM_PADRAO && <input type="hidden" name="ordem" value={ordem} />}
        {direcao !== DIRECAO_PADRAO && <input type="hidden" name="dir" value={direcao} />}

        <div className="relative grow sm:grow-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Buscar por nome ou email"
            aria-label="Buscar candidato por nome ou email"
            className="w-full sm:w-72 rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
        >
          Buscar
        </button>
      </form>

      {busca && (
        <Link
          href={construirHref({ busca: '', ordem, direcao })}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <X className="w-4 h-4" />
          Limpar busca
        </Link>
      )}

      {busca && total !== null && (
        <span className="text-sm text-gray-500">
          {total} {total === 1 ? 'candidato encontrado' : 'candidatos encontrados'}
        </span>
      )}
    </div>
  )
}
