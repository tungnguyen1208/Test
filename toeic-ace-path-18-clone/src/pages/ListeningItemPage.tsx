import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, ExternalLink } from "lucide-react";
import { apiService, type ListeningDocDetail, type CauHoiItem } from "@/services/api";

function isDirectAudio(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp3|wav|ogg)(\?.*)?$/i.test(url);
}

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    return null;
  } catch { return null; }
}

const ListeningItemPage = () => {
  const { maBaiNghe } = useParams();
  const [data, setData] = useState<ListeningDocDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!maBaiNghe) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getListeningDetail(maBaiNghe);
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Không thể tải bài nghe.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [maBaiNghe]);

  const ytId = useMemo(() => extractYouTubeId(data?.duongDanAudio || data?.duongDanFile || null), [data]);
  const directAudio = useMemo(() => isDirectAudio(data?.duongDanAudio || data?.duongDanFile || undefined), [data]);
  const createdAt = useMemo(() => {
    if (!data?.ngayTao) return undefined;
    try {
      const d = new Date(data.ngayTao);
      if (isNaN(d.getTime())) return undefined;
      return d.toLocaleDateString();
    } catch {
      return undefined;
    }
  }, [data]);

  // Always render page container to avoid a completely blank screen

  const audioUrl = data?.duongDanAudio || data?.duongDanFile || undefined;
  const onSelect = (maCauHoi: string, nhanDapAn: string) => {
    setAnswers(prev => ({ ...prev, [maCauHoi]: nhanDapAn }));
  };
  const score = useMemo(() => {
    if (!data?.cauHois) return 0;
    let s = 0;
    data.cauHois.forEach(q => {
      const ans = answers[q.maCauHoi];
      const correct = q.dapAns.find(d => d.laDapAnDung)?.nhanDapAn;
      if (ans && correct && ans === correct) s += (q.diem || 1);
    });
    return s;
  }, [answers, data]);

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* DEV banner */}
      <div className="text-xs text-muted-foreground">Trang nghe | maBaiNghe: {maBaiNghe} | loading: {String(loading)} | error: {error ?? 'none'}</div>

      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Đang tải...</CardTitle>
          </CardHeader>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi tải dữ liệu</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loading && !error && !data && (
        <Card>
          <CardHeader>
            <CardTitle>Không tìm thấy dữ liệu</CardTitle>
            <CardDescription>
              {maBaiNghe ? `Không tìm thấy bài nghe: ${maBaiNghe}` : 'Thiếu mã bài nghe.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()}>Quay lại</Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
      <>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Headphones className="w-6 h-6"/>{data.tieuDe}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{data.doKho || 'Mức độ'}</Badge>
          <span>{createdAt ?? 'Không rõ ngày tạo'}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nghe</CardTitle>
          <CardDescription>Phát audio hoặc mở liên kết nguồn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {directAudio && audioUrl && (
            <audio controls className="w-full">
              <source src={audioUrl} />
            </audio>
          )}
          {!directAudio && ytId && (
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}`}
                title="YouTube audio"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
          {!directAudio && !ytId && audioUrl && (
            <Button asChild>
              <a href={audioUrl} target="_blank" rel="noreferrer">
                Mở trang nghe <ExternalLink className="w-4 h-4 ml-2"/>
              </a>
            </Button>
          )}

          {data.banGhiAm && (
            <div className="p-4 rounded border bg-background">
              <div className="text-sm text-muted-foreground mb-1">Bản ghi âm (Transcript)</div>
              <pre className="whitespace-pre-wrap text-sm">{data.banGhiAm}</pre>
            </div>
          )}

          <div className="pt-2">
            <button
              className="text-xs text-muted-foreground underline"
              onClick={() => setShowRaw(v => !v)}
            >
              {showRaw ? 'Ẩn JSON thô' : 'Xem JSON thô (debug)'}
            </button>
            {showRaw && (
              <pre className="mt-2 p-3 rounded border bg-muted/30 text-xs overflow-auto max-h-64">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      {Array.isArray(data.cauHois) && data.cauHois.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Câu hỏi</CardTitle>
            <CardDescription>
              Tổng {data.tongCauHoi ?? data.cauHois.length} câu. Chọn đáp án đúng cho mỗi câu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.cauHois
              .slice()
              .sort((a,b)=>a.thuTuHienThi-b.thuTuHienThi)
              .map((q: CauHoiItem) => (
              <div key={q.maCauHoi} className="p-4 border rounded-lg space-y-3">
                <div className="font-medium">{q.thuTuHienThi}. {q.noiDungCauHoi}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {q.dapAns.slice().sort((a,b)=>a.thuTuHienThi-b.thuTuHienThi).map((a) => {
                    const selected = answers[q.maCauHoi] === a.nhanDapAn;
                    const isCorrect = submitted && a.laDapAnDung;
                    const isWrong = submitted && selected && !a.laDapAnDung;
                    return (
                      <button
                        key={a.maDapAn}
                        className={`text-left p-3 rounded border transition ${selected ? 'border-blue-500' : ''} ${isCorrect ? 'bg-green-50 border-green-400' : ''} ${isWrong ? 'bg-red-50 border-red-400' : ''}`}
                        onClick={() => !submitted && onSelect(q.maCauHoi, a.nhanDapAn)}
                      >
                        <span className="font-medium mr-2">{a.nhanDapAn}.</span>{a.noiDungDapAn}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.giaiThich && (
                  <div className="text-sm text-muted-foreground">Giải thích: {q.giaiThich}</div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              {!submitted ? (
                <Button onClick={() => setSubmitted(true)}>Nộp bài</Button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-green-700 font-medium">Điểm của bạn: {score}</div>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setAnswers({}); }}>Làm lại</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có câu hỏi</CardTitle>
            <CardDescription>Bài nghe này hiện chưa có câu hỏi trắc nghiệm.</CardDescription>
          </CardHeader>
        </Card>
      )}
      </>
      )}
    </div>
  );
};

export default ListeningItemPage;
