'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Moon, Sun } from 'lucide-react'

type Question = {
  question: string
  options: string[]
  correctAnswer?: string
  correctAnswers: string[]
  explanation: string
}

export default function ServiceNowCSAQuiz() {
  const [baseQuestions, setBaseQuestions] = useState<Question[]>([])
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)

  // Dark mode automático
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
  }

  const shuffleArray = (array: Question[]) => {
    return array
      .map((q) => ({ q, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ q }) => q)
  }

  // Carregar salvo ou buscar perguntas
  useEffect(() => {
    const savedProgress = localStorage.getItem('ServiceNowCSAQuiz')
    if (savedProgress) {
      const data = JSON.parse(savedProgress)
      setBaseQuestions(data.baseQuestions)
      setShuffledQuestions(data.shuffledQuestions)
      setCurrentQuestionIndex(data.currentQuestionIndex)
      setScore(data.score)
      setSelectedAnswers(data.selectedAnswers)
      setQuizCompleted(data.quizCompleted)
      setQuestionsAnswered(data.questionsAnswered)
      setShowFeedback(data.showFeedback)
      return
    }

    const fetchQuestions = async () => {
      const response = await fetch('/questions.json')
      const data: Question[] = await response.json()
      const normalized = data.map(q => ({
        ...q,
        correctAnswers: q.correctAnswers ?? [q.correctAnswer]
      }))
      setBaseQuestions(normalized)
      setShuffledQuestions(shuffleArray(normalized))
    }
    fetchQuestions()
  }, [])

  // Persistir progresso
  useEffect(() => {
    if (shuffledQuestions.length > 0) {
      localStorage.setItem('ServiceNowCSAQuiz', JSON.stringify({
        baseQuestions,
        shuffledQuestions,
        currentQuestionIndex,
        score,
        selectedAnswers,
        quizCompleted,
        questionsAnswered,
        showFeedback
      }))
    }
  }, [baseQuestions, shuffledQuestions, currentQuestionIndex, score, selectedAnswers, quizCompleted, questionsAnswered, showFeedback])

  const toggleAnswer = useCallback((option: string) => {
    if (showFeedback) return
    setSelectedAnswers(prev =>
      prev.includes(option) ? prev.filter(ans => ans !== option) : [...prev, option]
    )
  }, [showFeedback])

  const checkAnswers = useCallback((singleSelection?: string) => {
    const current = shuffledQuestions[currentQuestionIndex]
    const correct = current.correctAnswers
    const selected = correct.length > 1 ? selectedAnswers : [singleSelection ?? '']

    const selectedSet = new Set(selected)
    const correctSet = new Set(correct)
    const isCorrect = selectedSet.size === correctSet.size && [...selectedSet].every(ans => correctSet.has(ans))

    if (isCorrect) setScore(s => s + 1)
    setShowFeedback(true)
    setQuestionsAnswered(q => q + 1)
  }, [shuffledQuestions, currentQuestionIndex, selectedAnswers])

  const moveToNextQuestion = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1)
      setShowFeedback(false)
      setSelectedAnswers([])
    } else {
      setQuizCompleted(true)
    }
  }

  const resetQuiz = () => {
    setShuffledQuestions(shuffleArray(baseQuestions))
    setCurrentQuestionIndex(0)
    setScore(0)
    setShowFeedback(false)
    setSelectedAnswers([])
    setQuizCompleted(false)
    setQuestionsAnswered(0)
    localStorage.removeItem('ServiceNowCSAQuiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calculatePercentage = useMemo(() => {
    return () => Math.round((score / shuffledQuestions.length) * 100)
  }, [score, shuffledQuestions])

  if (shuffledQuestions.length === 0) return null

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl text-center">Quiz Results</CardTitle>
          <div className="flex gap-2">
            <Button onClick={resetQuiz} size="sm" variant="outline">Restart Quiz</Button>
            <Button onClick={toggleDarkMode} size="icon" variant="ghost">
              <Moon className="dark:hidden" />
              <Sun className="hidden dark:inline" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-4xl font-bold mb-2">{calculatePercentage()}%</p>
            <p className="text-lg">
              Você acertou {score} de {shuffledQuestions.length} questões
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
              <p className="font-semibold text-green-800 dark:text-green-200">Corretas</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{score}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
              <p className="font-semibold text-red-800 dark:text-red-200">Erradas</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{shuffledQuestions.length - score}</p>
            </div>
          </div>
          <div className="text-center">
            <Button onClick={resetQuiz} className="w-full">Restart Quiz</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const current = shuffledQuestions[currentQuestionIndex]
  const isMultipleChoice = current.correctAnswers.length > 1

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-2xl">CSA | ServiceNow</CardTitle>
        <div className="flex gap-2">
          <Button onClick={resetQuiz} size="sm" variant="outline">Restart Quiz</Button>
          <Button onClick={toggleDarkMode} size="icon" variant="ghost">
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:inline" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <p>Pergunta {currentQuestionIndex + 1} de {shuffledQuestions.length}</p>
          <p>Score: {score}</p>
        </div>

        <h2 className="text-xl font-semibold">{current.question}</h2>

        <div className="grid grid-cols-1 gap-3">
          {current.options.map((option) => {
            const isSelected = selectedAnswers.includes(option)
            const isCorrect = current.correctAnswers.includes(option)
            const isWrongSelection = isSelected && !isCorrect

            return (
              <Button
                key={option}
                onClick={() => {
                  if (isMultipleChoice) {
                    toggleAnswer(option)
                  } else {
                    setSelectedAnswers([option])
                    checkAnswers(option)
                  }
                }}
                variant={
                  showFeedback
                    ? isCorrect
                      ? 'default'
                      : isWrongSelection
                      ? 'destructive'
                      : 'outline'
                    : isSelected
                    ? 'secondary'
                    : 'outline'
                }
                disabled={showFeedback}
                className="w-full px-4 py-4 sm:py-5 text-left justify-start whitespace-normal break-words leading-relaxed text-sm sm:text-base"
              >
                {isMultipleChoice && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="mr-2"
                  />
                )}
                {option}
              </Button>
            )
          })}
        </div>

        {!showFeedback && isMultipleChoice && (
          <Button
            onClick={() => checkAnswers()}
            className="mt-4 w-full"
            disabled={selectedAnswers.length === 0}
          >
            {selectedAnswers.length === 0 ? "Selecione para continuar" : "Confirmar Resposta"}
          </Button>
        )}

        {showFeedback && (
          <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800" aria-live="polite">
            <div className="flex items-start gap-2">
              {new Set(selectedAnswers).size === new Set(current.correctAnswers).size &&
              [...selectedAnswers].every(ans => current.correctAnswers.includes(ans)) ? (
                <Check className="text-green-600 mt-1" />
              ) : (
                <X className="text-red-600 mt-1" />
              )}
              <div>
                <p className="font-semibold">
                  {new Set(selectedAnswers).size === new Set(current.correctAnswers).size &&
                  [...selectedAnswers].every(ans => current.correctAnswers.includes(ans))
                    ? 'Correto!'
                    : 'Incorreto!'}
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{current.explanation}</p>
              </div>
            </div>
            <Button onClick={moveToNextQuestion} className="mt-4 w-full">
              {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultados'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
