const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://tile-comfort-housing-bathrooms.trycloudflare.com/api';
const LOGIN_PATH_ENV = (import.meta as any).env?.VITE_LOGIN_PATH as string | undefined;
const REGISTER_PATH_ENV = (import.meta as any).env?.VITE_REGISTER_PATH as string | undefined;

// Types based on API responses
export interface User {
  id: number;
  username: string;
  email: string;
  streakDays?: number;
  badges?: string[];
  createdAt?: string;
}

export interface Exercise {
  id: number;
  title: string;
  description?: string;
  exerciseType: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  topic: string;
  status?: 'Completed' | 'InProgress' | 'Pending';
  materials?: Material[];
  questions?: Question[];
}

export interface Material {
  id: number;
  materialType: 'Text' | 'Audio' | 'Video';
  content: string;
}

export interface Question {
  id: number;
  questionText: string;
  options: Option[];
}

export interface Option {
  id: number;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Submission {
  id: number;
  score: number;
  isCompleted: boolean;
  submittedAt: string;
}

export interface LearningPlan {
  planId: string;
  lessonId: string | null;
  title: string;
  description?: string | null;
  status: 'Completed' | 'Pending' | 'InProgress';
  startTime: string;
  endTime: string;
  contentType?: string | null;
  progressPercent?: number;
}

export interface Badge {
  badgeId: string;
  badgeName: string;
  description?: string;
  awardedAt: string;
}

export interface DashboardSummary {
  streakDays: number;
  predictedScore: number;
  completedLessons: number;
  totalLessons: number;
  studyTimeHours: number;
}

export interface DashboardProgress {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export interface RecentResult {
  exercise: string;
  score: number;
}

export interface DashboardStats {
  streakDays: number;
  totalScore: number;
  completedExercises: number;
  totalExercises: number;
  studyHours: number;
  progress: DashboardProgress;
  recentResults: RecentResult[];
}

// Auth (VN) types
export interface AuthLoginResponse {
  message?: string;
  token: string;
  user?: any; // Backend returns Vietnamese snake_case fields; keep generic
}

export interface AuthRegisterRequest {
  hoTen: string;
  email: string;
  matKhau: string;
}

// LoTrinh types (from backend response)
export interface LoTrinhItem {
  maLoTrinh: string;
  tenLoTrinh: string;
  moTa: string;
  thoiGianDuKien: string;
  capDo: string; // A1 | A2 | B1 | B2 | ...
  loaiLoTrinh: string; // "Chung" | "Chuyên sâu" | ...
  mucTieuDiem: number;
  tongSoBai: number;
  ngayTao: string;
  kyNangTrongTam?: string | null; // Added optional field
  chuDeBaiHoc?: string | null; // Added optional field
}

export interface LoTrinhResponse {
  message: string;
  total: number;
  data: LoTrinhItem[];
}

// Lessons list and details
export interface VideoItem {
  maVideo: string;
  tieuDeVideo: string;
  duongDanVideo: string;
  thoiLuongGiay: number;
  ngayTao: string;
}

export interface BaiNgheItem {
  maBaiNghe: string;
  maBai: string;
  tieuDe: string;
  doKho?: string | null;
  ngayTao: string;
  duongDanFile?: string | null; // legacy
  duongDanAudio?: string | null; // new
  banGhiAm?: string | null; // transcript
  tongCauHoi?: number;
  cauHois?: CauHoiItem[];
}

export interface BaiDocItem {
  maBaiDoc: string;
  maBai: string;
  tieuDe: string;
  doKho?: string | null;
  ngayTao: string;
  duongDanFileTxt: string;
}

export interface LessonItem {
  maBai: string;
  maLoTrinh: string;
  tenBai: string;
  moTa: string | null;
  thoiLuongPhut: number;
  soThuTu: number;
  ngayTao: string;
  videos: VideoItem[];
  baiNghes: BaiNgheItem[];
  baiDocs: BaiDocItem[];
}

export interface LessonsResponse {
  message: string;
  total: number;
  data: LessonItem[];
}

export interface LessonDetailResponse {
  message: string;
  data: LessonItem;
}

// Reading doc detail
export interface DapAnItem {
  maDapAn: number | string;
  maCauHoi: string;
  nhanDapAn: string; // A/B/C/D
  noiDungDapAn: string;
  thuTuHienThi: number;
  laDapAnDung: boolean;
}

export interface CauHoiItem {
  maCauHoi: string;
  noiDungCauHoi: string;
  giaiThich?: string | null;
  diem: number;
  thuTuHienThi: number;
  dapAns: DapAnItem[];
}

export interface ReadingDocDetailResponse {
  maBaiDoc: string;
  maBai: string;
  tieuDe: string;
  doKho?: string | null;
  noiDung?: string | null;
  duongDanFileTxt: string; // may be YouTube link
  ngayTao: string;
  tongCauHoi: number;
  cauHois: CauHoiItem[];
}

export interface ListeningDocDetail extends BaiNgheItem {
  tongCauHoi?: number;
  cauHois?: CauHoiItem[];
}

export interface ListeningDetailResponse {
  message?: string;
  data?: ListeningDocDetail;
}

// Lessons (Bài học)
// (removed duplicate legacy LessonItem/LessonsResponse definitions)

export interface TopicExercises {
  topic: string;
  exercises: Exercise[];
}

export interface ExercisesByTopicResponse {
  topic: string;
  exercises: Exercise[];
}

// API Service Class
export class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // ---- Authenticated user profile ----
  async getProfile(): Promise<any> {
    // Prefer canonical backend route first
    const candidates = [
      '/NguoiDung/profile',
      '/NguoiDung/thong-tin',
      '/TaiKhoan/profile',
      '/Auth/profile',
      '/users/me',
      '/users/profile',
      '/Users/profile',
      '/Account/profile',
    ];
    return this.requestWithFallback<any>(candidates, { method: 'GET', headers: { 'Accept': '*/*' } });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    // Always re-hydrate token from localStorage in case instance state was lost
    const persisted = localStorage.getItem('authToken');
    if (!this.token && persisted) {
      this.token = persisted;
    }
    const authHeader = this.token ? { Authorization: `Bearer ${this.token}` } : {};
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader, // put earlier
        ...options.headers,
        // ensure Authorization isn't lost if options.headers used different casing
        ...authHeader,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        let errorPayload: unknown = null;
        try {
          if (contentType.includes('application/json')) {
            errorPayload = await response.clone().json();
          } else {
            errorPayload = await response.clone().text();
          }
        } catch {
          // Ignore parse issues; payload stays null
        }

        const bodyMessage =
          (errorPayload && typeof errorPayload === 'object' && 'message' in (errorPayload as Record<string, unknown>))
            ? String((errorPayload as Record<string, unknown>).message)
            : (typeof errorPayload === 'string' && errorPayload.trim().length > 0 ? errorPayload : null);

        const error: any = new Error(bodyMessage || `API Error: ${response.status}`);
        error.status = response.status;
        error.payload = errorPayload;
        error.endpoint = endpoint;
        throw error;
      }

      if (response.status === 204 || response.status === 205) {
        return undefined as T;
      }

      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Try multiple endpoints until one succeeds
  private async requestWithFallback<T>(endpoints: string[], options: RequestInit = {}): Promise<T> {
    let lastErr: any = null;
    for (const ep of endpoints) {
      try {
        // Debug which endpoint is being attempted
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.debug('[API try]', `${API_BASE_URL}${ep}`);
        }
        return await this.request<T>(ep, options);
      } catch (e: any) {
        if (e?.status && e.status !== 404 && e.status !== 405) {
          throw e;
        }
        lastErr = e;
        // Log which endpoint failed for easier debugging
        console.warn('API fallback failed for endpoint:', `${API_BASE_URL}${ep}`, e);
        // continue to next endpoint
      }
    }
    const err = new Error(`All endpoints failed. Tried: ${endpoints.join(', ')}. Last error: ${lastErr?.message || lastErr}`);
    // attach extra field for consumers that want details
    (err as any).endpointsTried = endpoints;
    throw err;
  }

  private normalizePlanStatus(value: any): 'Completed' | 'Pending' | 'InProgress' {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (['completed', 'hoàn thành', 'hoan thanh'].includes(normalized)) {
      return 'Completed';
    }
    if (['inprogress', 'in-progress', 'đang học', 'dang hoc', 'đã mở khóa', 'da mo khoa', 'đã mở khoá', 'da mo khoá'].includes(normalized)) {
      return 'InProgress';
    }
    return 'Pending';
  }

  private normalizeLearningPlan(raw: any): LearningPlan {
    const planId = raw?.planId ?? raw?.PlanId ?? raw?.maLich ?? raw?.MaLich ?? `${Date.now()}`;
    const start = raw?.startTime ?? raw?.StartTime ?? raw?.ngayHoc ?? raw?.NgayHoc;
    const end = raw?.endTime ?? raw?.EndTime;
    return {
      planId: String(planId),
      lessonId: raw?.lessonId ?? raw?.LessonId ?? raw?.maBai ?? raw?.MaBai ?? null,
      title: raw?.title ?? raw?.Title ?? raw?.tenBai ?? raw?.TenBai ?? 'Bài học',
      description: raw?.description ?? raw?.Description ?? raw?.moTa ?? raw?.MoTa ?? null,
      status: this.normalizePlanStatus(raw?.status ?? raw?.Status),
      startTime: typeof start === 'string' && start ? start : new Date().toISOString(),
      endTime: typeof end === 'string' && end ? end : new Date().toISOString(),
      contentType: raw?.contentType ?? raw?.ContentType ?? raw?.loaiNoiDung ?? raw?.LoaiNoiDung ?? null,
      progressPercent: typeof raw?.progressPercent === 'number'
        ? raw.progressPercent
        : (typeof raw?.ProgressPercent === 'number' ? raw.ProgressPercent : undefined),
    };
  }

  // User API
  async register(userData: { username: string; email: string; password: string }): Promise<User> {
    return this.request<User>('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }): Promise<{ token: string; userId: number }> {
    const response = await this.request<{ token: string; userId: number }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        passwordHash: credentials.password
      }),
    });
    
    this.token = response.token;
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userId', response.userId.toString());
    
    return response;
  }

  async getUser(userId: number): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  // Exercise API
  async getAllExercises(): Promise<Exercise[]> {
    return this.request<Exercise[]>('/exercises');
  }

  async getExercisesByTopic(): Promise<ExercisesByTopicResponse[]> {
    return this.request<ExercisesByTopicResponse[]>('/exercises/by-topic');
  }

  async getExercisesByTopicName(topicName: string): Promise<TopicExercises> {
    const allTopics = await this.getExercisesByTopic();
    const topic = allTopics.find(t => t.topic === topicName);
    if (!topic) {
      throw new Error(`Topic ${topicName} not found`);
    }
    return topic;
  }

  async getExerciseById(exerciseId: number): Promise<Exercise> {
    return this.request<Exercise>(`/exercises/${exerciseId}`);
  }

  async getPendingExercises(userId: number): Promise<Exercise[]> {
    return this.request<Exercise[]>(`/users/users/${userId}/exercises/pending`);
  }

  // Submission API
  async submitExercise(submissionData: {
    userId: number;
    exerciseId: number;
    score: number;
    isCompleted: boolean;
    durationMinutes?: number;
  }): Promise<Submission> {
    return this.request<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getUserSubmissions(userId: number): Promise<Submission[]> {
    return this.request<Submission[]>(`/submissions/user/${userId}`);
  }

  // Learning Plan API
  async getLearningPlan(userId?: string): Promise<LearningPlan[]> {
    const targets = [
      '/Dashboard/today',
      '/dashboard/today',
      ...(userId ? [
        `/Dashboard/today/${encodeURIComponent(userId)}`,
        `/dashboard/today/${encodeURIComponent(userId)}`
      ] : [])
    ];
    const raw = await this.requestWithFallback<any>(targets, { method: 'GET', headers: { 'Accept': '*/*' } });
    const payload = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return payload.map((item: any) => this.normalizeLearningPlan(item));
  }

  // Badges API
  async getUserBadges(userId?: string): Promise<Badge[]> {
    const targets = [
      '/Dashboard/badges',
      '/dashboard/badges',
      ...(userId ? [
        `/Dashboard/badges/${encodeURIComponent(userId)}`,
        `/dashboard/badges/${encodeURIComponent(userId)}`
      ] : [])
    ];
    const raw = await this.requestWithFallback<any>(targets, { method: 'GET', headers: { 'Accept': '*/*' } });
    const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return items.map((item: any) => ({
      badgeId: String(item?.badgeId ?? item?.BadgeId ?? crypto.randomUUID?.() ?? `${Date.now()}`),
      badgeName: item?.badgeName ?? item?.BadgeName ?? 'Huy hiệu',
      description: item?.description ?? item?.Description ?? undefined,
      awardedAt: item?.awardedAt ?? item?.AwardedAt ?? new Date().toISOString(),
    }));
  }

  // Dashboard API
  async getDashboardSummary(userId?: string): Promise<DashboardSummary> {
    const targets = [
      '/Dashboard/summary',
      '/dashboard/summary',
      ...(userId ? [
        `/Dashboard/summary/${encodeURIComponent(userId)}`,
        `/dashboard/summary/${encodeURIComponent(userId)}`
      ] : [])
    ];
    const res = await this.requestWithFallback<any>(targets, { method: 'GET', headers: { 'Accept': '*/*' } });
    return (res?.data ?? res) as DashboardSummary;
  }

  async getDashboardProgress(userId?: string): Promise<DashboardProgress> {
    const targets = [
      '/Dashboard/progress',
      '/dashboard/progress',
      ...(userId ? [
        `/Dashboard/progress/${encodeURIComponent(userId)}`,
        `/dashboard/progress/${encodeURIComponent(userId)}`
      ] : [])
    ];
    const res = await this.requestWithFallback<any>(targets, { method: 'GET', headers: { 'Accept': '*/*' } });
    return (res?.data ?? res) as DashboardProgress;
  }

  async getDashboardToday(userId?: string): Promise<LearningPlan[]> {
    return this.getLearningPlan(userId);
  }

  async getDashboardRecentResults(userId?: string): Promise<RecentResult[]> {
    const targets = [
      '/Dashboard/recent-results',
      '/dashboard/recent-results',
      ...(userId ? [
        `/Dashboard/recent-results/${encodeURIComponent(userId)}`,
        `/dashboard/recent-results/${encodeURIComponent(userId)}`
      ] : [])
    ];
    const res = await this.requestWithFallback<any>(targets, { method: 'GET', headers: { 'Accept': '*/*' } });
    const payload = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return payload.map((item: any) => ({
      exercise: item?.exercise ?? item?.Exercise ?? 'Bài tập',
      score: typeof item?.score === 'number' ? item.score : (typeof item?.Score === 'number' ? item.Score : 0),
    }));
  }

  async getDashboardStats(userId?: string): Promise<DashboardStats> {
    // Combine multiple dashboard endpoints
    const [summary, progress, recentResults] = await Promise.all([
      this.getDashboardSummary(userId),
      this.getDashboardProgress(userId),
      this.getDashboardRecentResults(userId)
    ]);

    return {
      streakDays: summary.streakDays,
      totalScore: summary.predictedScore,
      completedExercises: summary.completedLessons,
      totalExercises: summary.totalLessons,
      studyHours: summary.studyTimeHours,
      progress,
      recentResults
    };
  }

  // LoTrinh (Roadmaps)
  async getAvailableRoadmaps(): Promise<LoTrinhResponse> {
    // Some backends might expose different paths, try a few
    return this.requestWithFallback<LoTrinhResponse>([
      '/LoTrinh/co-san',
      '/LoTrinh',
      '/lotrinh/co-san',
      '/lotrinh'
    ], { method: 'GET', headers: { 'Accept': '*/*' } });
  }

  // Lessons APIs
  async getLessons(): Promise<LessonsResponse> {
    return this.requestWithFallback<LessonsResponse>([
      '/BaiHoc/danh-sach',
      '/BaiHoc',
      '/baihoc/danh-sach',
      '/baihoc'
    ], { method: 'GET', headers: { 'Accept': '*/*' } });
  }

  async getLessonDetail(maBai: string): Promise<LessonDetailResponse> {
    return this.requestWithFallback<LessonDetailResponse>([
      `/BaiHoc/chi-tiet/${maBai}`,
      `/BaiHoc/${maBai}`,
      `/baihoc/chi-tiet/${maBai}`,
      `/baihoc/${maBai}`
    ]);
  }

  async getReadingDocDetail(maBaiDoc: string): Promise<ReadingDocDetailResponse> {
    const res = await this.requestWithFallback<any>([
      `/BaiDoc/chi-tiet/${maBaiDoc}`,
      `/BaiDoc/${maBaiDoc}`,
      `/baidoc/chi-tiet/${maBaiDoc}`,
      `/baidoc/${maBaiDoc}`
    ]);
    return res?.data ?? res;
  }

  async getListeningDetail(maBaiNghe: string): Promise<ListeningDocDetail> {
    const res: any = await this.requestWithFallback<any>([
      `/BaiNghe/chi-tiet/${maBaiNghe}`,
      `/BaiNghe/chi-tiet?maBaiNghe=${encodeURIComponent(maBaiNghe)}`,
      `/BaiNghe/${maBaiNghe}`,
      `/bainghe/chi-tiet/${maBaiNghe}`,
      `/bainghe/chi-tiet?maBaiNghe=${encodeURIComponent(maBaiNghe)}`,
      `/bainghe/${maBaiNghe}`
    ]);
    // Unwrap common response envelopes and arrays
    const data = (res && typeof res === 'object') ? (res.data ?? res) : res;
    if (Array.isArray(data)) {
      // Try to find by id or fallback to first
      const found = data.find((it: any) => it?.maBaiNghe === maBaiNghe) ?? data[0];
      return found as ListeningDocDetail;
    }
    // Some APIs may nest again under 'item' or use different casing; keep it simple here
    return data as ListeningDocDetail;
  }

  // (removed duplicate legacy getLessons)

  // Auth (VN) APIs
  async authLogin(email: string, matKhau: string): Promise<AuthLoginResponse> {
    // Send a permissive payload for compatibility across endpoints
    const body = JSON.stringify({ email, matKhau, password: matKhau, passwordHash: matKhau, username: email });
    const candidates = [
      // Env override first
      ...(LOGIN_PATH_ENV ? [LOGIN_PATH_ENV] : []),
      // VN common
      '/Auth/dang-nhap', '/NguoiDung/dang-nhap', '/TaiKhoan/dang-nhap', '/auth/dang-nhap',
      '/Auth/dangnhap', '/NguoiDung/dangnhap', '/TaiKhoan/dangnhap', '/auth/dangnhap',
      // English common
      '/Auth/login', '/auth/login', '/Account/login', '/account/login', '/login', '/Login',
      // Legacy in this repo
      '/users/login', '/Users/login'
    ];
    const res = await this.requestWithFallback<any>(candidates, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': '*/*' }, body });

    const token: string | undefined = res?.token ?? res?.data?.token;
    if (!token) throw new Error('Đăng nhập thất bại: thiếu token');

    this.token = token;
    localStorage.setItem('authToken', token);
    if (res?.user) localStorage.setItem('currentUser', JSON.stringify(res.user));

    return { message: res?.message, token, user: res?.user } as AuthLoginResponse;
  }

  async authRegister(req: AuthRegisterRequest): Promise<any> {
    const body = JSON.stringify({
      hoTen: req.hoTen,
      email: req.email,
      matKhau: req.matKhau,
      // compatibility fields
      username: req.hoTen,
      password: req.matKhau,
      passwordHash: req.matKhau
    });
    const candidates = [
      ...(REGISTER_PATH_ENV ? [REGISTER_PATH_ENV] : []),
      '/Auth/dang-ky', '/NguoiDung/dang-ky', '/TaiKhoan/dang-ky', '/auth/dang-ky',
      '/Auth/dangky', '/NguoiDung/dangky', '/TaiKhoan/dangky', '/auth/dangky',
      '/Auth/register', '/auth/register', '/Account/register', '/account/register', '/register', '/Register',
      '/users/register', '/Users/register'
    ];
    return this.requestWithFallback<any>(candidates, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': '*/*' }, body });
  }

  async updateProfile(profileData: Record<string, unknown>): Promise<any> {
    const body = JSON.stringify(profileData);
    const headers = { 'Content-Type': 'application/json', 'Accept': '*/*' };
    // Keep it tight and aligned with backend:
    // - Primary: PUT /NguoiDung/profile
    // - Secondary: PUT /NguoiDung/cap-nhat
    // - Tertiary: PATCH /NguoiDung/profile
    // - Last resort: POST /NguoiDung/cap-nhat (supported in backend)
    const endpointGroups = [
      { method: 'PUT', endpoints: ['/NguoiDung/profile', '/NguoiDung/cap-nhat'] },
      { method: 'PATCH', endpoints: ['/NguoiDung/profile'] },
      { method: 'POST', endpoints: ['/NguoiDung/cap-nhat'] },
    ];

    let lastError: unknown = null;
    for (const group of endpointGroups) {
      try {
        return await this.requestWithFallback<any>(group.endpoints, {
          method: group.method,
          headers,
          body,
        });
      } catch (error) {
        lastError = error;
        // eslint-disable-next-line no-console
        console.warn('[API updateProfile] failed group', group.method, error);
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('Failed to update profile');
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword?: string): Promise<any> {
    const confirmationValue = confirmPassword ?? newPassword;
    const body = JSON.stringify({
      matKhauHienTai: currentPassword,
      matKhauCu: currentPassword,
      currentPassword,
      matKhauMoi: newPassword,
      newPassword,
      xacNhanMatKhauMoi: confirmationValue,
      confirmPassword: confirmationValue,
    });
    const candidates = [
      '/NguoiDung/doi-mat-khau',
      '/NguoiDung/change-password',
      '/nguoidung/doi-mat-khau',
      '/NguoiDung/doi-matkhau',
      '/Auth/doi-mat-khau',
      '/Auth/change-password',
      '/TaiKhoan/doi-mat-khau',
      '/users/change-password',
      '/Users/change-password',
    ];
    return this.requestWithFallback<any>(candidates, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
      body,
    });
  }

  // Utility methods
  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
  }

  isAuthenticated(): boolean {
    const tok = this.token || localStorage.getItem('authToken');
    return !!tok;
  }

  private extractUserIdentifier(candidate: any): string | null {
    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

  const keys = ['ma_nd', 'maNd', 'maNguoiDung', 'maND', 'userId', 'id'];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(candidate, key)) {
        const value = (candidate as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
        if (typeof value === 'number' && !Number.isNaN(value)) {
          return String(value);
        }
      }
    }

    return null;
  }

  getCurrentUserId(): string {
    try {
      const rawUser = localStorage.getItem('currentUser');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const fromUser = this.extractUserIdentifier(parsed);
        if (fromUser) {
          return fromUser;
        }
      }
    } catch (error) {
      console.warn('Failed to parse currentUser from storage', error);
    }

    const stored = localStorage.getItem('userId');
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }

    throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
  }
}

// Export singleton instance
export const apiService = new ApiService();
