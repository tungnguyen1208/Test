import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Headphones, ArrowRight, FileText } from "lucide-react";
import { apiService, type LessonDetailResponse, type BaiDocItem, type BaiNgheItem } from "@/services/api";

const LessonOverviewPage = () => {
  const { maBai } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<LessonDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!maBai) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getLessonDetail(maBai);
        setData(res.data);
      } catch (e: any) {
        setError(e?.message || "Không thể tải chi tiết bài học.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [maBai]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!data) return null;

  const baiDocs: BaiDocItem[] = data.baiDocs || [];
  const baiNghes: BaiNgheItem[] = data.baiNghes || [];

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Ngày {data.soThuTu}: {data.tenBai.trim()}</h1>
        <p className="text-muted-foreground">{data.moTa}</p>
      </div>

      {/* Bỏ phần video ở trang này */}

      {baiDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5"/>Bài đọc</CardTitle>
            <CardDescription>Chọn 1 bài để bắt đầu</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {baiDocs.map((bd) => (
              <div key={bd.maBaiDoc} className="flex items-center justify-between p-4 rounded border">
                <div>
                  <div className="font-medium flex items-center gap-2"><FileText className="w-4 h-4"/>{bd.tieuDe.trim()}</div>
                  <div className="text-sm text-muted-foreground">{bd.doKho || ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{new Date(bd.ngayTao).toLocaleDateString()}</Badge>
                  <Button size="sm" onClick={() => navigate(`/reading-doc/${bd.maBaiDoc}`)}>
                    <ArrowRight className="w-4 h-4 mr-2"/>Học ngay
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {baiNghes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Headphones className="w-5 h-5"/>Bài nghe</CardTitle>
            <CardDescription>Chọn 1 bài để bắt đầu</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {baiNghes.map((bn) => (
              <div key={bn.maBaiNghe} className="flex items-center justify-between p-4 rounded border">
                <div>
                  <div className="font-medium">{bn.tieuDe}</div>
                  <div className="text-sm text-muted-foreground">{bn.doKho || ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{new Date(bn.ngayTao).toLocaleDateString()}</Badge>
                  <Button size="sm" onClick={() => navigate(`/listening-item/${bn.maBaiNghe}`)}>
                    <ArrowRight className="w-4 h-4 mr-2"/>Học ngay
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {baiDocs.length === 0 && baiNghes.length === 0 && (
        <div className="text-center text-muted-foreground">Bài học chưa có nội dung.</div>
      )}
    </div>
  );
};

export default LessonOverviewPage;
