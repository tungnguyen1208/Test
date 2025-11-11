import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, type LessonItem, type ReadingDocDetailResponse } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, BookOpen, Clock } from "lucide-react";

interface QuizQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation?: string | null;
}

interface ReadingLessonProps {
  lessonId?: string | null;
}

const formatDuration = (seconds?: number | null): string => {
  if (!seconds || Number.isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins} phút${secs ? ` ${secs}s` : ""}`;
};

const ReadingLesson = ({ lessonId }: ReadingLessonProps) => {
  const navigate = useNavigate();

  const [resolvedLessonId, setResolvedLessonId] = useState<string | null>(lessonId ?? null);
  const [lesson, setLesson] = useState<LessonItem | null>(null);
  const [docDetail, setDocDetail] = useState<ReadingDocDetailResponse | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [answeredState, setAnsweredState] = useState<Record<number, { evaluated: boolean; isCorrect: boolean }>>({});

  // Update when page param/prop changes
  useEffect(() => {
    setResolvedLessonId(lessonId ?? null);
  }, [lessonId]);

  // If no lessonId provided, fallback to first lesson
  useEffect(() => {
    if (resolvedLessonId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.getLessons();
        if (ignore) return;
        const candidate = res.data?.find(item => (item.baiDocs?.length ?? 0) > 0) ?? res.data?.[0];
        setResolvedLessonId(candidate?.maBai ?? null);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách bài học");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [resolvedLessonId]);

  // Fetch lesson detail
  useEffect(() => {
    if (!resolvedLessonId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await apiService.getLessonDetail(resolvedLessonId);
        if (ignore) return;
        const lessonData = detail?.data ?? (detail as any)?.data ?? detail;
        setLesson(lessonData);
        const docCandidate = lessonData?.baiDocs?.[0];
        if (docCandidate?.maBaiDoc) {
          const doc = await apiService.getReadingDocDetail(docCandidate.maBaiDoc);
          if (!ignore) {
            setDocDetail(doc);
          }
        } else {
          setDocDetail(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu bài học");
          setLesson(null);
          setDocDetail(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [resolvedLessonId]);

  // Map reading questions
  useEffect(() => {
    if (!docDetail?.cauHois?.length) {
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setIsCorrect(null);
      setScore(0);
      return;
    }

    const mapped: QuizQuestion[] = docDetail.cauHois
      .map((item) => {
        const options = (item.dapAns ?? []).map((answer) => ({
          key: answer.nhanDapAn || String(answer.maDapAn ?? ""),
          text: answer.noiDungDapAn || "",
        }));
        const correctKey = (item.dapAns ?? []).find((answer) => answer.laDapAnDung)?.nhanDapAn ?? "";
        return {
          id: item.maCauHoi,
          text: item.noiDungCauHoi,
          options,
          correctKey,
          explanation: item.giaiThich ?? null,
        };
      })
      .filter((q) => q.text && q.options.length >= 2 && q.correctKey);

    setQuestions(mapped);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setIsCorrect(null);
    setScore(0);
  }, [docDetail]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handleSelectOption = (key: string) => {
    if (showExplanation) return; // khóa lựa chọn sau khi đã xem đáp án
    setSelectedOption(key);
    setShowExplanation(false);
    setIsCorrect(null);
  };

  const evaluateCurrentQuestion = (displayExplanation: boolean): boolean | null => {
    if (!currentQuestion || !selectedOption) {
      if (displayExplanation) {
        setShowExplanation(true);
        setIsCorrect(false);
      }
      return null;
    }

    const previouslyAnswered = answeredState[currentIndex];
    const result = selectedOption === currentQuestion.correctKey;

    if (!previouslyAnswered?.evaluated) {
      if (result) {
        setScore((prev) => prev + 1);
      }
      setAnsweredState((prev) => ({
        ...prev,
        [currentIndex]: { evaluated: true, isCorrect: result },
      }));
    }

    const finalResult = previouslyAnswered?.evaluated ? previouslyAnswered.isCorrect : result;

    if (displayExplanation) {
      setIsCorrect(finalResult);
      setShowExplanation(true);
    } else {
      setIsCorrect(null);
      setShowExplanation(false);
    }

    return finalResult;
  };

  const handleCheckAnswer = () => {
    evaluateCurrentQuestion(true);
  };

  const handleNextQuestion = () => {
    // Đánh giá câu hiện tại (nếu chưa đánh giá)
    evaluateCurrentQuestion(false);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setIsCorrect(null);
    }
  };

  const lessonTag = lesson?.maLoTrinh || "Lesson";
  const docVideoUrl =
    docDetail?.duongDanFileTxt && /^https?:\/\//i.test(docDetail.duongDanFileTxt)
      ? docDetail.duongDanFileTxt
      : null;
  const videoUrl = lesson?.videos?.[0]?.duongDanVideo || docVideoUrl;
  const videoDurationLabel = formatDuration(lesson?.videos?.[0]?.thoiLuongGiay);
  const readingPassage = docDetail?.noiDung || docDetail?.duongDanFileTxt || "";

  if (loading) {
    return <div className="p-6 text-center text-sm text-slate-500">Đang tải bài học...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (!lesson) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <section className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6 border-l-4 border-l-blue-600">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </button>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-3 py-1">
            {lessonTag}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">{lesson.tenBai}</h1>
        {lesson.moTa && <p className="mt-2 text-sm text-slate-500">{lesson.moTa}</p>}
      </section>

      <section className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Nội dung bài học
          </span>
          {(videoDurationLabel || docDetail?.doKho) && (
            <span className="text-xs text-slate-500 flex items-center gap-2">
              {videoDurationLabel && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {videoDurationLabel}
                </span>
              )}
              {docDetail?.doKho && (
                <Badge variant="outline" className="text-[10px]">
                  {docDetail.doKho}
                </Badge>
              )}
            </span>
          )}
        </div>
        {videoUrl ? (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-tr from-sky-100 to-blue-50">
            <div className="relative pt-[56.25%]">
              <iframe
                src={videoUrl}
                title={lesson.tenBai}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : readingPassage ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-line">
            {readingPassage}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có nội dung hiển thị.</p>
        )}
      </section>

      {currentQuestion ? (
        <section className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 border-t-4 border-t-blue-600 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-slate-900">Bài tập</span>
            <span className="text-xs text-slate-500">
              Câu {currentIndex + 1}/{totalQuestions}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-4" />
          <p className="font-semibold mb-4 text-slate-900">{currentQuestion.text}</p>
          <div className="flex flex-col gap-2 mb-4">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.key;
              const isOptionCorrect = showExplanation && opt.key === currentQuestion.correctKey;
              const isWrongSelected = showExplanation && isSelected && opt.key !== currentQuestion.correctKey;

              let optionClasses = "flex items-center gap-3 px-3 py-2 rounded-xl border text-sm cursor-pointer transition";
              if (isOptionCorrect) optionClasses += " border-green-500 bg-green-50 text-green-900";
              else if (isWrongSelected) optionClasses += " border-red-500 bg-red-50 text-red-900";
              else if (isSelected) optionClasses += " border-blue-600 bg-blue-50 text-slate-900";
              else optionClasses += " border-slate-200 text-slate-800 hover:border-blue-500 hover:bg-blue-50";

              return (
                <label key={opt.key} className={optionClasses}>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={opt.key}
                    checked={isSelected}
                    onChange={() => handleSelectOption(opt.key)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm">
                    <strong className="mr-1">{opt.key}.</strong>
                    {opt.text}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex gap-2">
              <Button onClick={handleCheckAnswer} className="rounded-full px-4">
                Kiểm tra đáp án
              </Button>
              {currentIndex < totalQuestions - 1 && (
                <Button type="button" variant="outline" className="rounded-full" onClick={handleNextQuestion}>
                  Câu tiếp theo
                </Button>
              )}
            </div>
            <span className="text-xs text-slate-500">Điểm: {score}/{totalQuestions}</span>
          </div>
          {showExplanation && (
            <div
              className={`mt-2 rounded-xl border-l-4 px-4 py-3 text-sm ${
                isCorrect ? "border-l-green-600 bg-green-50 text-green-900" : "border-l-red-600 bg-red-50 text-red-900"
              }`}
            >
              <p className="font-semibold mb-1">Giải thích:</p>
              <p>{currentQuestion.explanation || "Chưa có giải thích chi tiết."}</p>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-white rounded-2xl shadow border border-slate-200 p-6 text-sm text-slate-500">
          Bài học này chưa có câu hỏi đọc hiểu. Vui lòng quay lại sau.
        </section>
      )}
    </div>
  );
};

export default ReadingLesson;
