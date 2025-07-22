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

type Mode = 'menu' | 'study' | 'exam'

export default function ServiceNowCSAQuiz() {
  const [mode, setMode] = useState<Mode>('menu')
  const [baseQuestions, setBaseQuestions] = useState<Question[]>([])
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)

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
      .map((q) => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5), // embaralha alternativas
        _sortKey: Math.random()
      }))
      .sort((a, b) => a._sortKey - b._sortKey)
      .map(({ _sortKey, ...q }) => q)
  }

  useEffect(() => {
    const fetchQuestions = async () => {
      const response = await fetch('/questions.json')
      const data: Question[] = await response.json()
      const normalized = data.map(q => ({
        ...q,
        correctAnswers: q.correctAnswers ?? [q.correctAnswer]
      }))
      setBaseQuestions(normalized)
    }
    fetchQuestions()
  }, [])

  const startQuiz = (selectedMode: Mode) => {
    setMode(selectedMode)
    if (selectedMode === 'study') {
      const savedProgress = localStorage.getItem('ServiceNowCSAQuiz')
      if (savedProgress) {
        const data = JSON.parse(savedProgress)
        setShuffledQuestions(data.shuffledQuestions)
        setCurrentQuestionIndex(data.currentQuestionIndex)
        setScore(data.score)
        setSelectedAnswers(data.selectedAnswers)
        setQuizCompleted(data.quizCompleted)
        setQuestionsAnswered(data.questionsAnswered)
        setShowFeedback(data.showFeedback)
        return
      }
      setShuffledQuestions(shuffleArray(baseQuestions))
    }
    if (selectedMode === 'exam') {
      setShuffledQuestions(shuffleArray(baseQuestions).slice(0, 60))
      setTimeLeft(90 * 60)
    }
  }

  useEffect(() => {
    if (mode !== 'exam' || quizCompleted) return

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mode, quizCompleted])

  useEffect(() => {
    if (mode === 'exam' && timeLeft === 0 && !quizCompleted) {
      setQuizCompleted(true)
    }
  }, [timeLeft, mode, quizCompleted])

  useEffect(() => {
    if (mode === 'study' && shuffledQuestions.length > 0) {
      localStorage.setItem('ServiceNowCSAQuiz', JSON.stringify({
        shuffledQuestions,
        currentQuestionIndex,
        score,
        selectedAnswers,
        quizCompleted,
        questionsAnswered,
        showFeedback
      }))
    }
  }, [mode, shuffledQuestions, currentQuestionIndex, score, selectedAnswers, quizCompleted, questionsAnswered, showFeedback])

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
    setMode('menu')
    setShuffledQuestions([])
    setCurrentQuestionIndex(0)
    setScore(0)
    setShowFeedback(false)
    setSelectedAnswers([])
    setQuizCompleted(false)
    setQuestionsAnswered(0)
    setTimeLeft(0)
    localStorage.removeItem('ServiceNowCSAQuiz')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calculatePercentage = useMemo(() => {
    return () => Math.round((score / shuffledQuestions.length) * 100)
  }, [score, shuffledQuestions])

  if (mode === 'menu') {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl text-center">CSA | ServiceNow</CardTitle>
          <Button onClick={toggleDarkMode} size="icon" variant="ghost">
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:inline" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <Button className="w-full" onClick={() => startQuiz('study')}>
            Modo Estudo
          </Button>
          <Button className="w-full" onClick={() => startQuiz('exam')}>
            Modo Simulado
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl text-center">Resultados</CardTitle>
          <Button onClick={toggleDarkMode} size="icon" variant="ghost">
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:inline" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-4xl font-bold mb-2">{calculatePercentage()}%</p>
          <p className="text-lg">
            Você acertou {score} de {shuffledQuestions.length} questões
          </p>
          {mode === 'exam' && (
            <>
              {calculatePercentage() >= 70 ? (
                <p className="text-green-600 font-bold">✅ Aprovado!</p>
              ) : (
                <p className="text-red-600 font-bold">❌ Reprovado</p>
              )}
            </>
          )}
          <Button onClick={resetQuiz} className="w-full">Restart</Button>
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
          <Button onClick={resetQuiz} size="sm" variant="outline">Restart</Button>
          <Button onClick={toggleDarkMode} size="icon" variant="ghost">
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:inline" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <p>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</p>
          <p>Score: {score}</p>
        </div>
        {mode === 'exam' && (
          <p className="text-lg text-right">
            Tempo: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </p>
        )}
        <h2 className="text-xl font-semibold">{current.question}</h2>

        <div className="flex flex-col gap-5">
          {current.options.map((option) => {
            const isSelected = selectedAnswers.includes(option)
            const isCorrect = current.correctAnswers.includes(option)
            const isWrongSelection = isSelected && !isCorrect

            return (
              <Button
                key={option}
                style={{ overflowWrap: 'break-word' }}
                onClick={() => {
                  if (isMultipleChoice) {
                    toggleAnswer(option)
                  } else {
                    setSelectedAnswers([option])
                    checkAnswers(option)
                  }
                }}
                disabled={showFeedback}
                className={`w-full max-w-full h-auto px-4 py-5 sm:py-6 
                  text-left whitespace-normal break-words 
                  leading-loose tracking-wide text-sm sm:text-base
                  items-start justify-start
                  ${showFeedback && isCorrect ? 'bg-green-600 text-white' : ''}
                  ${showFeedback && isWrongSelection ? 'bg-red-600 text-white' : ''}
                  ${!showFeedback && isSelected ? 'bg-gray-300 dark:bg-gray-700' : ''}
                `}
              >
                {isMultipleChoice && (
                  <input type="checkbox" checked={isSelected} readOnly className="mr-2" />
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
                    ? 'Correct!'
                    : 'Incorrect!'}
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
