import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService, type LessonItem } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Brain, Clock, Headphones, PenTool, Sparkles, ArrowRight } from "lucide-react";

type FilterKey = "all" | "reading" | "listening" | "writing" | "speaking";

type FilterConfig = {
  label: string;
  description: string;
  icon: ReactNode;
  predicate?: (lesson: LessonItem) => boolean;
};

const FILTERS: Record<FilterKey, FilterConfig> = {
  all: {
    label: "Bắt đầu cấp độ",
    description: "Tổng hợp tất cả nội dung của lộ trình",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  reading: {
    label: "Bài đọc hiểu",
    description: "Chỉ hiện thị các bài đọc",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    predicate: (lesson) => (lesson.baiDocs?.length ?? 0) > 0,
  },
  listening: {
    label: "Bài luyện nghe",
    description: "Chỉ hiện thị các bài nghe",
    icon: <Headphones className="w-3.5 h-3.5" />,
    predicate: (lesson) => (lesson.baiNghes?.length ?? 0) > 0,
  },
  writing: {
    label: "Bài tập viết",
    description: "Ưu tiên nội dung viết/grammar",
    icon: <PenTool className="w-3.5 h-3.5" />,
    predicate: (lesson) => (lesson.videos?.length ?? 0) > 0,
  },
  speaking: {
    label: "Luyện giao tiếp",
    description: "Các nội dung hội thoại/video",
    icon: <Brain className="w-3.5 h-3.5" />,
    predicate: (lesson) => (lesson.videos?.length ?? 0) > 0,
  },
};

const LESSONS_PER_WEEK = 5;

const getPrimarySkill = (lesson: LessonItem): string => {
  if ((lesson.baiDocs?.length ?? 0) > 0) return "Đọc hiểu";
  if ((lesson.baiNghes?.length ?? 0) > 0) return "Nghe";
  if ((lesson.videos?.length ?? 0) > 0) return "Viết / Video";
  return "Tổng hợp";
};

const getLessonLink = (lesson: LessonItem, filter: FilterKey): string => {
  const doc = lesson.baiDocs?.[0];
  const listening = lesson.baiNghes?.[0];
  if (filter === "reading") return `/lesson/reading/${lesson.maBai}`;
  if (filter === "listening" && listening) return `/listening-item/${listening.maBaiNghe}`;
  if (filter === "writing") return "/lesson/writing";
  if (filter === "speaking") return "/lesson/conversation";
  if (doc) return `/lesson/reading/${lesson.maBai}`;
  if (listening) return `/listening-item/${listening.maBaiNghe}`;
  return `/lesson/overview/${lesson.maBai}`;
};

const RoadmapLessonsPage = () => {
  const navigate = useNavigate();
  const { maLoTrinh, filter: filterParam } = useParams<{ maLoTrinh?: string; filter?: string }>();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedFilter = (filterParam?.toLowerCase() as FilterKey) ?? "all";
  const activeFilter: FilterKey = FILTERS[normalizedFilter] ? normalizedFilter : "all";

  useEffect(() => {
    if (!maLoTrinh) {
      setLessons([]);
      setLoading(false);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getLessons();
        if (ignore) return;
        const items = (res.data ?? []).filter((lesson) => lesson.maLoTrinh === maLoTrinh);
        setLessons(items);
        if (items.length === 0) {
          setError("Chưa tìm thấy bài học cho lộ trình này");
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách bài học");
          setLessons([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [maLoTrinh]);

  const filteredLessons = useMemo(() => {
    const predicate = FILTERS[activeFilter].predicate;
    if (!predicate) return lessons;
    return lessons.filter(predicate);
  }, [lessons, activeFilter]);

  const weeks = useMemo(() => {
    const chunked: LessonItem[][] = [];
    filteredLessons.forEach((lesson, index) => {
      const weekIndex = Math.floor(index / LESSONS_PER_WEEK);
      if (!chunked[weekIndex]) chunked[weekIndex] = [];
      chunked[weekIndex].push(lesson);
    });
    return chunked;
  }, [filteredLessons]);

  const handleFilterChange = (key: FilterKey) => {
    if (!maLoTrinh) return;
    navigate(`/roadmap/${maLoTrinh}/${key}`);
  };

  if (!maLoTrinh) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Thiếu mã lộ trình</AlertTitle>
          <AlertDescription>Vui lòng quay lại trang Lộ trình học để chọn cấp độ.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" className="px-0 text-sm" onClick={() => navigate(-1)}>
          ← Quay lại Lộ trình học
        </Button>
        <h1 className="text-2xl font-bold">Lộ trình {maLoTrinh}</h1>
        <p className="text-sm text-muted-foreground">
          Lựa chọn nội dung theo kỹ năng để tiếp tục học tập. Tổng cộng {filteredLessons.length} bài học phù hợp.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
          <Button
            key={key}
            variant={key === activeFilter ? "default" : "outline"}
            className="rounded-full px-4"
            onClick={() => handleFilterChange(key)}
          >
            <span className="flex items-center gap-2 text-sm">
              {FILTERS[key].icon}
              {FILTERS[key].label}
            </span>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="border border-slate-100">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((__ , row) => (
                  <div key={row} className="flex items-center justify-between">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải dữ liệu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : weeks.length === 0 ? (
        <Card className="border border-slate-200">
          <CardContent className="py-10 text-center text-muted-foreground">
            Không có bài học phù hợp với bộ lọc này.
          </CardContent>
        </Card>
      ) : (
        weeks.map((week, weekIndex) => {
          const startDay = weekIndex * LESSONS_PER_WEEK + 1;
          const endDay = startDay + week.length - 1;
          return (
            <Card key={`week-${weekIndex}`} className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Tuần {weekIndex + 1}</CardTitle>
                  <CardDescription>Ngày {startDay} - {endDay}</CardDescription>
                </div>
                <Badge variant="outline">{week.length} bài học</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {week.map((item, dayIndex) => {
                  const lessonNumber = startDay + dayIndex;
                  const lessonType = getPrimarySkill(item);
                  return (
                    <div
                      key={item.maBai}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Ngày {lessonNumber}: {item.tenBai}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {item.thoiLuongPhut || 30} phút ở {lessonType}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={(lessonNumber / (weeks.length * LESSONS_PER_WEEK)) * 100} className="hidden md:block w-32" />
                        <Button
                          variant="default"
                          className="rounded-full"
                          onClick={() => navigate(getLessonLink(item, activeFilter))}
                        >
                          Học ngay <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default RoadmapLessonsPage;
