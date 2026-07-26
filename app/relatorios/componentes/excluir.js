'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// Botão de excluir, com confirmação que mostra o que será perdido.
//
// É Client Component — precisa de estado e de fetch. Por isso não importa nada
// que dependa do gabarito: a ficha inteira é servidor justamente para manter
// lib/gabarito-servidor.js longe do bundle, e um import descuidado aqui
// desfaria isso (o build quebraria, que é a proteção funcionando).
//
// A exclusão é definitiva. O diálogo diz isso com todas as letras e lista o
// que vai junto, porque depois do clique não há de onde voltar.

export default function Excluir({
  id,
  nome,
  email,
  escopo = 'tentativa',
  totalTentativas = 1,
  rotuloTentativa,
  aoConcluir = '/relatorios',
  className = '',
}) {
  const router = useRouter()
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  const oCandidatoInteiro = escopo === 'candidato'

  const excluir = async () => {
    setExcluindo(true)
    setErro(null)

    try {
      const resposta = await fetch(`/api/admin/resultados/${id}?escopo=${escopo}`, {
        method: 'DELETE',
      })

      if (!resposta.ok) {
        const { erro } = await resposta.json().catch(() => ({}))
        throw new Error(erro || `Erro ${resposta.status}`)
      }

      // Apagar a tentativa que está sendo exibida deixaria a pessoa numa
      // página que não existe mais, então saímos para onde ainda há conteúdo.
      router.push(aoConcluir)
      router.refresh()
    } catch (e) {
      setErro(e.message)
      setExcluindo(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={`inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-700 transition-colors ${className}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        {oCandidatoInteiro ? 'Excluir candidato' : 'Excluir'}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {oCandidatoInteiro ? `Excluir ${nome}?` : `Excluir ${rotuloTentativa ?? 'esta tentativa'}?`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p className="text-gray-800 break-all">{email}</p>

              {oCandidatoInteiro ? (
                <p>
                  Isso apaga{' '}
                  <strong className="text-gray-900">
                    {totalTentativas === 1
                      ? 'a única tentativa'
                      : `as ${totalTentativas} tentativas`}
                  </strong>{' '}
                  deste candidato — respostas, pontuação, classificação e dados de contato.
                </p>
              ) : (
                <p>
                  Isso apaga só esta tentativa.{' '}
                  {totalTentativas === 2 ? (
                    <>A outra do candidato continua.</>
                  ) : (
                    <>
                      As outras{' '}
                      <strong className="text-gray-900">{totalTentativas - 1}</strong> do candidato
                      continuam.
                    </>
                  )}
                  {/* Só a primeira tentativa alimenta a nota e as médias, então
                      apagá-la promove a seguinte — que tem efeito de prática. */}
                  {rotuloTentativa?.startsWith('1') && totalTentativas > 1 && (
                    <>
                      {' '}
                      <span className="text-amber-800">
                        Como é a primeira, a tentativa seguinte passa a ser a que vale — e ela já
                        teve contato com as matrizes.
                      </span>
                    </>
                  )}
                </p>
              )}

              <p className="font-medium text-red-700">Não dá para desfazer.</p>

              {erro && <p className="text-red-700">Falhou: {erro}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // Sem isto o Radix fecha o diálogo no clique e a mensagem de erro
              // nunca chega a aparecer.
              e.preventDefault()
              excluir()
            }}
            disabled={excluindo}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {excluindo && <Loader2 className="w-4 h-4 animate-spin" />}
            {excluindo ? 'Excluindo…' : 'Excluir definitivamente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
