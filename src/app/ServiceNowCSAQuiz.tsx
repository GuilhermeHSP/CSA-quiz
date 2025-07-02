'use client'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from 'lucide-react'

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

  const shuffleArray = (array: Question[]) => {
    return array
      .map((q) => ({ q, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ q }) => q)
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
      setShuffledQuestions(shuffleArray(normalized))
    }

    fetchQuestions()
  }, [])

  const toggleAnswer = (option: string) => {
    if (showFeedback) return

    if (selectedAnswers.includes(option)) {
      setSelectedAnswers(selectedAnswers.filter((ans) => ans !== option))
    } else {
      setSelectedAnswers([...selectedAnswers, option])
    }
  }

  const checkAnswers = (singleSelection?: string) => {
    const current = shuffledQuestions[currentQuestionIndex]
    const correct = current.correctAnswers

    const selected =
      correct.length > 1 ? selectedAnswers : [singleSelection ?? '']

    const isCorrect =
      selected.length === correct.length &&
      selected.every((ans) => correct.includes(ans))

    if (isCorrect) {
      setScore(score + 1)
    }

    setShowFeedback(true)
    setQuestionsAnswered(questionsAnswered + 1)
  }

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
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
  }

  const calculatePercentage = () => {
    return Math.round((score / shuffledQuestions.length) * 100)
  }

  if (shuffledQuestions.length === 0) return null

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-4xl font-bold mb-2">{calculatePercentage()}%</p>
            <p className="text-lg">
              You scored {score} out of {shuffledQuestions.length} questions correctly
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="font-semibold text-green-800">Correct</p>
              <p className="text-2xl font-bold text-green-800">{score}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <p className="font-semibold text-red-800">Incorrect</p>
              <p className="text-2xl font-bold text-red-800">{shuffledQuestions.length - score}</p>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={resetQuiz} className="w-full">
              Start New Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const current = shuffledQuestions[currentQuestionIndex]
  const isMultipleChoice = current.correctAnswers.length > 1

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">ServiceNow CSA Quiz</CardTitle>
        <div className="flex justify-between text-gray-600">
          <p>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</p>
          <p>Score: {score}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
                className="py-7 px-5 text-left justify-start whitespace-normal break-words leading-relaxed"
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
            Confirm Answer
          </Button>
        )}

        {showFeedback && (
          <div className="mt-4 p-4 rounded-lg bg-gray-100">
            <div className="flex items-start gap-2">
              {selectedAnswers.length === current.correctAnswers.length &&
              selectedAnswers.every((ans) => current.correctAnswers.includes(ans)) ? (
                <Check className="text-green-600 mt-1" />
              ) : (
                <X className="text-red-600 mt-1" />
              )}
              <div>
                <p className="font-semibold">
                  {selectedAnswers.length === current.correctAnswers.length &&
                  selectedAnswers.every((ans) => current.correctAnswers.includes(ans))
                    ? 'Correct!'
                    : 'Incorrect!'}
                </p>
                <p className="mt-2 text-gray-700">{current.explanation}</p>
              </div>
            </div>
            <Button onClick={moveToNextQuestion} className="mt-4 w-full">
              {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
