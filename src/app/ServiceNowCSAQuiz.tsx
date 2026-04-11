'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Moon, Sun, Clock, ArrowLeft, GripVertical } from 'lucide-react'
import Image from 'next/image'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Question = {
  domain?: string
  question: string
  options: string[]
  correctAnswer?: string
  correctAnswers?: string[]
  explanation: string
  questionType?: 'multiple-choice' | 'drag-drop'
  dragDropItems?: {
    id: string
    content: string
    targetId: string
  }[]
  dragDropTargets?: {
    id: string
    content: string
    correctItemId: string
  }[]
}

function Markdown({ value }: { value: string }) {
  return (
    <div className="quiz-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {value}
      </ReactMarkdown>
    </div>
  )
}

type Mode = 'track-menu' | 'menu' | 'study' | 'exam' | 'short-simulate'
type Track = 'CSA' | 'DATA'

const splitIntoSimulados = (questions: Question[], size: number = 15) => {
  const simulados: Question[][] = []
  for (let i = 0; i < questions.length; i += size) {
    simulados.push(questions.slice(i, i + size))
  }
  return simulados
}

const domainClass: Record<string, string> = {
  Configuration: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300",
  Ingest: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-300",
  Govern: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-200",
  Insight: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300",
  "CSDM Fundamentals": "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-300",
}

function DomainBadge({ domain }: { domain?: string }) {
  if (!domain) return null
  const cls = domainClass[domain] ?? "bg-muted text-foreground border-border"
  return (
    <div className="mb-3">
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
        {domain}
      </span>
    </div>
  )
}

// Componente Drag and Drop
function DragDropQuestion({ 
  question, 
  onAnswer, 
  showFeedback 
}: { 
  question: Question
  onAnswer: (answers: Record<string, string>) => void
  showFeedback: boolean
}) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [droppedItems, setDroppedItems] = useState<Record<string, string>>({})
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  const shuffle = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5)
}

  const items = useMemo(
  () => shuffle(question.dragDropItems || []),
  [question]
)

  const targets = useMemo(
  () => shuffle(question.dragDropTargets || []),
  [question]
)

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverTarget(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (targetId: string) => {
    setDragOverTarget(targetId)
  }

  const handleDragLeave = () => {
    setDragOverTarget(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedItem) {
      const newDroppedItems = { ...droppedItems }
      
      // Remove item from previous target if exists
      Object.keys(newDroppedItems).forEach(key => {
        if (newDroppedItems[key] === draggedItem) {
          delete newDroppedItems[key]
        }
      })
      
      // Add to new target
      newDroppedItems[targetId] = draggedItem
      setDroppedItems(newDroppedItems)
      onAnswer(newDroppedItems)
    }
    setDragOverTarget(null)
  }

  const handleRemoveFromTarget = (targetId: string) => {
    const newDroppedItems = { ...droppedItems }
    delete newDroppedItems[targetId]
    setDroppedItems(newDroppedItems)
    onAnswer(newDroppedItems)
  }

  const getAvailableItems = () => {
    const usedItems = Object.values(droppedItems)
    return items.filter(item => !usedItems.includes(item.id))
  }

  const isCorrect = (targetId: string) => {
    const target = targets.find(t => t.id === targetId)
    return target && droppedItems[targetId] === target.correctItemId
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna da esquerda - Itens para arrastar */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Respostas</h3>
          <div className="space-y-2">
            {getAvailableItems().map((item) => (
              <div
                key={item.id}
                draggable={!showFeedback}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`
                  p-4 bg-white dark:bg-gray-800 border-2 border-dashed 
                  border-gray-300 dark:border-gray-600 rounded-lg
                  cursor-move hover:border-gray-400 dark:hover:border-gray-500
                  transition-colors flex items-center gap-2
                  ${showFeedback ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{item.content}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna da direita - Alvos para drop */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Destinos</h3>
          <div className="space-y-3">
            {targets.map((target) => {
              const droppedItemId = droppedItems[target.id]
              const droppedItem = items.find(item => item.id === droppedItemId)
              const isTargetCorrect = isCorrect(target.id)
              
              return (
                <div
                  key={target.id}
                  onDragOver={handleDragOver}
                  onDragEnter={() => handleDragEnter(target.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, target.id)}
                  className={`
                    p-4 min-h-[80px] border-2 border-dashed rounded-lg
                    transition-colors
                    ${dragOverTarget === target.id 
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                    ${showFeedback && droppedItemId
                      ? isTargetCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : ''
                    }
                  `}
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {target.content}
                  </div>
                  
                  {droppedItem ? (
                    <div className={`
                      p-2 bg-white dark:bg-gray-700 border rounded
                      flex items-center justify-between gap-2
                      ${showFeedback && isTargetCorrect 
                        ? 'border-green-500 text-green-700 dark:text-green-300' 
                        : showFeedback && !isTargetCorrect
                        ? 'border-red-500 text-red-700 dark:text-red-300'
                        : 'border-gray-300 dark:border-gray-600'
                      }
                    `}>
                      <span className="text-sm">{droppedItem.content}</span>
                      {!showFeedback && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromTarget(target.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">
                      Arraste uma resposta aqui
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuizApp() {
  const [mode, setMode] = useState<Mode>('track-menu')
  const [track, setTrack] = useState<Track | null>(null)

  const [baseQuestions, setBaseQuestions] = useState<Question[]>([])
  const [simulados, setSimulados] = useState<Question[][]>([])
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [dragDropAnswers, setDragDropAnswers] = useState<Record<string, string>>({})
  const [quizCompleted, setQuizCompleted] = useState(false)
  // eslint-disable-next-line @typescript-eslint/ni-unused-vars
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedSimuladoIndex, setSelectedSimuladoIndex] = useState<number | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
  }

  const shuffleArray = (array: Question[]) => {
    return [...array]
      .map(q => ({
        ...q,
        options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : []
      }))
      .sort(() => Math.random() - 0.5)
  }

  useEffect(() => {
    if (!track) return

    const fetchQuestions = async () => {
      setIsLoading(true)
      setLoadError(null)

      const file =
        track === 'CSA'
          ? '/questions.json'
          : '/questions-data-foundation.json'

      try {
        const response = await fetch(file, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Falha ao carregar ${file} (HTTP ${response.status})`)
        }

        const data: Question[] = await response.json()

        const normalized: Question[] = data.map(q => {
          const correctAnswers =
            q.correctAnswers?.filter(Boolean) ??
            (q.correctAnswer ? [q.correctAnswer] : [])

          return {
            ...q,
            correctAnswers,
            questionType: q.questionType || 'multiple-choice'
          }
        })

        setBaseQuestions(normalized)
        setSimulados(splitIntoSimulados(normalized, 15))
      } catch (err: any) {
        console.error(err)
        setBaseQuestions([])
        setSimulados([])
        setLoadError(err?.message ?? 'Erro desconhecido ao carregar JSON')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [track])

  const startTrack = (selectedTrack: Track) => {
    setTrack(selectedTrack)
    setMode('menu')

    // limpa estado do quiz ao trocar trilha
    setShuffledQuestions([])
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswers([])
    setDragDropAnswers({})
    setShowFeedback(false)
    setQuizCompleted(false)
    setTimeLeft(0)
    setSelectedSimuladoIndex(null)
  }

  const startQuiz = (selectedMode: Mode, simuladoIndex?: number) => {
    // ✅ evita iniciar sem perguntas carregadas
    if (baseQuestions.length === 0) {
      setLoadError(loadError ?? 'As questões ainda não foram carregadas. Verifique o JSON em /public e tente novamente.')
      return
    }

    setMode(selectedMode)
    setQuizCompleted(false)
    setCurrentQuestionIndex(0)
    setScore(0)
    setQuestionsAnswered(0)
    setSelectedAnswers([])
    setDragDropAnswers({})
    setShowFeedback(false)
    setTimeLeft(0)
    setSelectedSimuladoIndex(null)

    let questionsToUse: Question[] = []

    if (selectedMode === 'study') {
      questionsToUse = shuffleArray(baseQuestions)
    }

    if (selectedMode === 'exam') {
      questionsToUse = shuffleArray(baseQuestions).slice(0, 60)
      setTimeLeft(90 * 60)
    }

    if (selectedMode === 'short-simulate' && simuladoIndex !== undefined) {
      setSelectedSimuladoIndex(simuladoIndex)
      questionsToUse = (simulados[simuladoIndex] || []).map(q => ({
        ...q,
        options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : []
      }))
      setTimeLeft(30 * 60)
    }

    setShuffledQuestions(questionsToUse)
  }

  useEffect(() => {
    if ((mode !== 'exam' && mode !== 'short-simulate') || quizCompleted) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [mode, quizCompleted])

  useEffect(() => {
    if ((mode === 'exam' || mode === 'short-simulate') && timeLeft === 0 && !quizCompleted) {
      setQuizCompleted(true)
    }
  }, [timeLeft, mode, quizCompleted])

  const toggleAnswer = useCallback((option: string) => {
    if (showFeedback) return
    setSelectedAnswers(prev =>
      prev.includes(option)
        ? prev.filter(a => a !== option)
        : [...prev, option]
    )
  }, [showFeedback])

  const handleDragDropAnswer = useCallback((answers: Record<string, string>) => {
    if (showFeedback) return
    setDragDropAnswers(answers)
  }, [showFeedback])

  const checkAnswers = useCallback((single?: string) => {
    const current = shuffledQuestions[currentQuestionIndex]
    if (!current) return

    if (current.questionType === 'drag-drop') {
      // Verificar respostas do drag and drop
      const targets = current.dragDropTargets || []
      const allCorrect = targets.every(target => 
        dragDropAnswers[target.id] === target.correctItemId
      )
      
      if (allCorrect && Object.keys(dragDropAnswers).length === targets.length) {
        setScore(s => s + 1)
      }
    } else {
      // Lógica original para múltipla escolha
      const correct = current.correctAnswers ?? []
      const selected = correct.length > 1 ? selectedAnswers : [single ?? '']

      const selectedSet = new Set(selected)
      const correctSet = new Set(correct)

      if (
        selectedSet.size === correctSet.size &&
        [...selectedSet].every(a => correctSet.has(a))
      ) {
        setScore(s => s + 1)
      }
    }

    setShowFeedback(true)
    setQuestionsAnswered(q => q + 1)
  }, [shuffledQuestions, currentQuestionIndex, selectedAnswers, dragDropAnswers])

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1)
      setSelectedAnswers([])
      setDragDropAnswers({})
      setShowFeedback(false)
      return
    }
    setQuizCompleted(true)
  }

  const resetQuiz = () => {
    // ✅ volta pro menu, mas NÃO apaga as perguntas carregadas
    setMode('menu')
    setShuffledQuestions([])
    setScore(0)
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setSelectedAnswers([])
    setDragDropAnswers({})
    setShowFeedback(false)
    setTimeLeft(0)
    setSelectedSimuladoIndex(null)
  }

  const goBackToMain = () => {
    setMode('track-menu')
    setTrack(null)
    setSelectedSimuladoIndex(null)

    setBaseQuestions([])
    setSimulados([])
    setShuffledQuestions([])
    setLoadError(null)
  }

  const percentage = useMemo(() => {
    if (shuffledQuestions.length === 0) return 0
    return Math.round((score / shuffledQuestions.length) * 100)
  }, [score, shuffledQuestions.length])

  if (mode === 'track-menu') {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 px-4">
        <Card className="relative w-full p-6 rounded-2xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 text-center">
          <button
            onClick={toggleDarkMode}
            className="absolute top-4 right-4 p-2 bg-transparent border-none outline-none focus:outline-none focus:ring-0 hover:bg-muted dark:hover:bg-muted/50 rounded-full transition"
          >
            <Moon className="dark:hidden w-5 h-5" />
            <Sun className="hidden dark:inline w-5 h-5" />
          </button>

          <div className="mb-8">
            <Image src="/images/ServiceNowBlackPT.png" alt="ServiceNow logo"
              width={600} height={60}
              unoptimized
              className="mx-auto max-w-[80%] h-auto dark:hidden" />
            <Image src="/images/ServiceNowWhitePT.png" alt="ServiceNow logo"
              width={600} height={60}
              unoptimized
              className="mx-auto max-w-[80%] h-auto hidden dark:block" />
          </div>

          <div className="space-y-4">
            <Button className="w-full" onClick={() => startTrack('CSA')}>
              ServiceNow CSA
            </Button>
            <Button className="w-full" onClick={() => startTrack('DATA')}>
              ServiceNow Data Foundation
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (mode === 'menu') {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 px-4">
        <Card className="relative w-full p-6 rounded-2xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 text-center">
          <button
            onClick={goBackToMain}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted dark:hover:bg-muted/50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={toggleDarkMode}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted dark:hover:bg-muted/50 transition"
          >
            <Moon className="dark:hidden w-5 h-5" />
            <Sun className="hidden dark:inline w-5 h-5" />
          </button>

          <div className="mb-8">
            {track === 'DATA' ? (
              <>
                <Image
                  src="/images/ServiceNowBlackDF.png"
                  alt="ServiceNow logo"
                  width={600}
                  height={60}
                  className="mx-auto max-w-[80%] h-auto dark:hidden"
                />
                <Image
                  src="/images/ServiceNowWhiteDF.png"
                  alt="ServiceNow logo"
                  width={600}
                  height={60}
                  className="mx-auto max-w-[80%] h-auto hidden dark:block"
                />
              </>
            ) : (
              <>
                <Image
                  src="/images/ServiceNowBlack.png"
                  alt="ServiceNow logo"
                  width={600}
                  height={60}
                  className="mx-auto max-w-[80%] h-auto dark:hidden"
                />
                <Image
                  src="/images/ServiceNowWhite.png"
                  alt="ServiceNow logo"
                  width={600}
                  height={60}
                  className="mx-auto max-w-[80%] h-auto hidden dark:block"
                />
              </>
            )}
          </div>

          {loadError && (
            <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-200 text-sm text-left">
              {loadError}
              <div className="mt-2 opacity-80">
                Dica: verifique se o arquivo existe em <code>/public</code> e se abre em <code>/questions.json</code>.
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-6 text-sm text-gray-600 dark:text-gray-400">
              Carregando questões...
            </div>
          ) : (
            <>
              {selectedSimuladoIndex === null ? (
                <div className="space-y-4">
                  <Button className="w-full" onClick={() => startQuiz('study')} disabled={baseQuestions.length === 0}>
                    Study Mode
                  </Button>
                  <Button className="w-full" onClick={() => startQuiz('exam')} disabled={baseQuestions.length === 0}>
                    Exam Simulation Mode
                  </Button>
                  <Button className="w-full" onClick={() => setSelectedSimuladoIndex(-1)} disabled={baseQuestions.length === 0}>
                    Short Practice Tests (15 questions)
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-4">Select a short simulate:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {simulados.map((_, idx) => (
                      <Button
                        key={idx}
                        className="w-full"
                        onClick={() => startQuiz('short-simulate', idx)}
                        disabled={baseQuestions.length === 0}
                      >
                        Simulado {idx + 1}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={() => setSelectedSimuladoIndex(null)} className="mt-4 w-full" variant="outline">
                    Back to Menu
                  </Button>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl text-center">Results</CardTitle>
          <Button onClick={toggleDarkMode} size="icon" variant="ghost">
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:inline" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-4xl font-bold mb-2">{percentage}%</p>
          <p className="text-lg">
            You answered {score} out of {shuffledQuestions.length} questions correctly!
          </p>
          {(mode === 'exam' || mode === 'short-simulate') && (
            percentage >= 75 ? (
              <p className="text-green-600 font-bold">✅ Passed!</p>
            ) : (
              <p className="text-red-600 font-bold">❌ Failed</p>
            )
          )}
          <Button onClick={resetQuiz} className="w-full">Restart</Button>
        </CardContent>
      </Card>
    )
  }

  const current = shuffledQuestions[currentQuestionIndex]
  const isMultipleChoice = (current?.correctAnswers?.length ?? 0) > 1
  const isDragDrop = current?.questionType === 'drag-drop'

  if (!current) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 px-4 text-sm text-gray-600 dark:text-gray-400">
        Loading questions...
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="flex justify-between items-center">
        <div className="h-8 flex items-center">
          {track === 'DATA' ? (
            <>
              <Image
                src="/images/ServiceNowBlackDF.png"
                alt="ServiceNow logo"
                width={150}
                height={32}
                unoptimized
                className="dark:hidden block"
              />
              <Image
                src="/images/ServiceNowWhiteDF.png"
                alt="ServiceNow logo"
                width={150}
                height={32}
                unoptimized
                className="hidden dark:block"
              />
            </>
          ) : (
            <>
              <Image
                src="/images/ServiceNowBlack.png"
                alt="ServiceNow logo"
                width={150}
                height={32}
                unoptimized
                className="dark:hidden block"
              />
              <Image
                src="/images/ServiceNowWhite.png"
                alt="ServiceNow logo"
                width={150}
                height={32}
                unoptimized
                className="hidden dark:block"
              />
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={resetQuiz} size="sm" variant="outline">Restart</Button>
          <Button onClick={toggleDarkMode} size="icon" variant="ghost">
            <Moon className="dark:hidden" />
            <Sun className="hidden dark:inline" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap justify-between items-center text-gray-600 dark:text-gray-400 text-sm sm:text-base gap-y-2">
          <p>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</p>
          {(mode === 'exam' || mode === 'short-simulate') ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          ) : (
            <p>Score: {score}</p>
          )}
        </div>

        {/* Enunciado + flag */}
        <div className="min-w-0">
          <div className="max-h-[50vh] overflow-auto pr-2">
            <DomainBadge domain={current.domain} />
            <Markdown value={current.question} />
          </div>
        </div>

        {/* Renderizar baseado no tipo de questão */}
        {isDragDrop ? (
          <DragDropQuestion
            question={current}
            onAnswer={handleDragDropAnswer}
            showFeedback={showFeedback}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {current.options.map((option) => {
              const isSelected = selectedAnswers.includes(option)
              const isCorrect = (current.correctAnswers ?? []).includes(option)
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
                    ${!showFeedback && isSelected ? 'bg-gray-300 dark:bg-gray-700' : ''}`}
                >
                  {isMultipleChoice && (
                    <input type="checkbox" checked={isSelected} readOnly className="mr-2" />
                  )}
                  {option}
                </Button>
              )
            })}
          </div>
        )}

        {!showFeedback && (
          <Button
            onClick={() => checkAnswers()}
            className="mt-4 w-full"
            disabled={
              isDragDrop 
                ? Object.keys(dragDropAnswers).length !== (current.dragDropTargets?.length || 0)
                : isMultipleChoice 
                ? selectedAnswers.length === 0 
                : selectedAnswers.length === 0
            }
          >
            {isDragDrop 
              ? Object.keys(dragDropAnswers).length === (current.dragDropTargets?.length || 0)
                ? "Confirmar Resposta"
                : "Arraste todas as respostas"
              : isMultipleChoice
              ? selectedAnswers.length === 0 
                ? "Selecione para continuar" 
                : "Confirmar Resposta"
              : "Selecione uma resposta"
            }
          </Button>
        )}

        {showFeedback && (
          <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800" aria-live="polite">
            <div className="flex items-start gap-2">
              {isDragDrop ? (
                (() => {
                  const targets = current.dragDropTargets || []
                  const allCorrect = targets.every(target => 
                    dragDropAnswers[target.id] === target.correctItemId
                  ) && Object.keys(dragDropAnswers).length === targets.length
                  
                  return allCorrect ? (
                    <Check className="text-green-600 mt-1" />
                  ) : (
                    <X className="text-red-600 mt-1" />
                  )
                })()
              ) : (
                (() => {
                  const selectedSet = new Set(selectedAnswers)
                  const correctSet = new Set(current.correctAnswers ?? [])
                  
                  return (
                    selectedSet.size === correctSet.size &&
                    [...selectedSet].every(ans => correctSet.has(ans))
                  ) ? (
                    <Check className="text-green-600 mt-1" />
                  ) : (
                    <X className="text-red-600 mt-1" />
                  )
                })()
              )}
              <div>
                <p className="font-semibold">
                  {isDragDrop ? (
                    (() => {
                      const targets = current.dragDropTargets || []
                      const allCorrect = targets.every(target => 
                        dragDropAnswers[target.id] === target.correctItemId
                      ) && Object.keys(dragDropAnswers).length === targets.length
                      
                      return allCorrect ? 'Correct!' : 'Incorrect!'
                    })()
                  ) : (
                    (() => {
                      const selectedSet = new Set(selectedAnswers)
                      const correctSet = new Set(current.correctAnswers ?? [])
                      
                      return (
                        selectedSet.size === correctSet.size &&
                        [...selectedSet].every(ans => correctSet.has(ans))
                      ) ? 'Correct!' : 'Incorrect!'
                    })()
                  )}
                </p>
                <div className="mt-2 text-gray-700 dark:text-gray-300">
                  <Markdown value={current.explanation} />
                </div>
              </div>
            </div>
            <Button onClick={moveToNextQuestion} className="mt-4 w-full">
              {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next question' : 'View Results'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}