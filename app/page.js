'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro do campo quando usuário digita
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const formatTelefone = (value) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    // Formata (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const handleTelefoneChange = (e) => {
    const formatted = formatTelefone(e.target.value)
    setFormData(prev => ({
      ...prev,
      telefone: formatted
    }))
    if (errors.telefone) {
      setErrors(prev => ({
        ...prev,
        telefone: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Por favor, informe seu nome'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Por favor, informe seu email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Por favor, informe um email válido'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Por favor, informe seu telefone'
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Por favor, informe um telefone válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Armazenar dados no localStorage
      localStorage.setItem('candidato', JSON.stringify(formData))
      // Redirecionar para instruções
      router.push('/instrucoes')
    }
  }

  return (
    <div className="quiz-container bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="quiz-card">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Teste de Raciocínio Lógico
          </h1>
          <p className="text-lg text-gray-600">
            Matrizes Progressivas de Raven
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Antes de começar,</strong> por favor preencha seus dados abaixo.
            Você receberá os resultados do teste por email ao finalizar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite seu nome completo"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleTelefoneChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.telefone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(00) 00000-0000"
              maxLength="15"
            />
            {errors.telefone && (
              <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg"
          >
            Próximo →
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          * Campos obrigatórios
        </p>
      </div>
    </div>
  )
}
