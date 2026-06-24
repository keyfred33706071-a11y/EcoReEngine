import { db, auth } from './firebase';
import { sanitize } from './sanitize';
import { IMGBB_KEY } from './env';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit, increment, serverTimestamp, Timestamp,
} from 'firebase/firestore';

export type UserRole = 'user' | 'mod' | 'admin' | 'owner' | 'institution';

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  components_salvaged: number;
  co2_saved_kg: number;
  tutorials_completed: number;
  projects_completed: number;
  high_score: number;
  games_played: number;
  streak_days: number;
  last_active_date: string;
  created_at: string;
  puzzle_total_recycled?: number;
  dictionary_views?: number;
  chat_count?: number;
  posts_count?: number;
  updated_at?: string;
  verified?: boolean;
  role?: UserRole;
  institution_name?: string;
  banned?: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  banned_by?: string | null;
  ban_expires?: string | null;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  type: 'project' | 'tip' | 'question' | 'achievement' | 'idea' | 'tutorial' | 'showcase' | 'debate';
  title: string;
  content: string;
  images: string[];
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: Timestamp;
  pinned?: boolean;
  hidden?: boolean;
  user?: UserProfile;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Timestamp;
  user?: UserProfile;
}

export function xpToLevel(xp: number): { level: number; currentXp: number; nextXp: number; progress: number } {
  const safeXp = Math.max(0, xp);
  const level = Math.max(1, Math.floor(Math.sqrt(safeXp / 100)) + 1);
  const currentXp = safeXp - 100 * (level - 1) ** 2;
  const nextXp = 100 * level ** 2 - 100 * (level - 1) ** 2;
  return { level, currentXp, nextXp, progress: nextXp > 0 ? Math.min(1, currentXp / nextXp) : 0 };
}

export function timeAgo(date: Timestamp | string | undefined): string {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'ahora';
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `hace ${days}d`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatCO2(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)} ton` : `${Math.round(kg)} kg`;
}

// ─── Auth ─────────────────────────────────────────────
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

// ─── User Profiles ────────────────────────────────────
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfile;
  if (data.banned && data.ban_expires) {
    const expires = new Date(data.ban_expires).getTime();
    if (expires < Date.now()) {
      await unbanUser(userId);
      data.banned = false;
      data.ban_reason = null;
      data.banned_at = null;
      data.banned_by = null;
      data.ban_expires = null;
    }
  }
  return data;
}

export async function createProfile(userId: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', userId), {
    id: userId,
    total_xp: 0,
    level: 1,
    components_salvaged: 0,
    co2_saved_kg: 0,
    tutorials_completed: 0,
    projects_completed: 0,
    high_score: 0,
    games_played: 0,
    streak_days: 0,
    last_active_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...data,
    full_name: data.full_name ? sanitize(data.full_name) : userId.slice(0, 8),
    bio: data.bio ? sanitize(data.bio) : undefined,
  });
}

export async function updateProfile(userId: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', userId), { ...data, updated_at: new Date().toISOString() });
}

export async function getLeaderboard(limitCount = 100) {
  const q = query(collection(db, 'users'), orderBy('total_xp', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
}

export async function getGameLeaderboard(limitCount = 100) {
  const q = query(collection(db, 'users'), orderBy('high_score', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile).filter(u => (u.games_played ?? 0) > 0);
}

// ─── Community Posts ──────────────────────────────────
export async function fetchPosts() {
  const q = query(collection(db, 'community_posts'), orderBy('created_at', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)).filter(p => !p.hidden);
}

export async function hidePost(postId: string): Promise<void> {
  await updateDoc(doc(db, 'community_posts', postId), { hidden: true });
}

export async function unhidePost(postId: string): Promise<void> {
  await updateDoc(doc(db, 'community_posts', postId), { hidden: false });
}

export async function fetchAllPosts(): Promise<CommunityPost[]> {
  const q = query(collection(db, 'community_posts'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost));
}

export async function createPost(data: Partial<CommunityPost>) {
  const docRef = await addDoc(collection(db, 'community_posts'), {
    ...data,
    likes_count: 0,
    comments_count: 0,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePostLikes(postId: string, delta: number) {
  await updateDoc(doc(db, 'community_posts', postId), {
    likes_count: increment(delta),
  });
}

// ─── Likes ─────────────────────────────────────────────
export async function fetchLikedPosts(userId: string): Promise<string[]> {
  const q = query(collection(db, 'post_likes'), where('user_id', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().post_id);
}

export async function addLike(userId: string, postId: string) {
  await setDoc(doc(db, 'post_likes', `${postId}_${userId}`), { user_id: userId, post_id: postId, created_at: serverTimestamp() });
}

export async function removeLike(userId: string, postId: string) {
  await deleteDoc(doc(db, 'post_likes', `${postId}_${userId}`));
}

// ─── Comments ─────────────────────────────────────────
export async function fetchComments(postId: string): Promise<CommunityComment[]> {
  const q = query(collection(db, 'community_comments'), where('post_id', '==', postId), orderBy('created_at', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityComment));
}

export async function addComment(data: Partial<CommunityComment>) {
  const docRef = await addDoc(collection(db, 'community_comments'), {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function incrementCommentCount(postId: string) {
  await updateDoc(doc(db, 'community_posts', postId), {
    comments_count: increment(1),
  });
}

// ─── Notifications (derived from comments on user's posts) ───
export async function fetchMyPostIds(userId: string): Promise<string[]> {
  const q = query(collection(db, 'community_posts'), where('user_id', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.id);
}

export async function fetchCommentsOnPosts(postIds: string[]): Promise<CommunityComment[]> {
  if (postIds.length === 0) return [];
  const q = query(collection(db, 'community_comments'), where('post_id', 'in', postIds), orderBy('created_at', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityComment));
}

// ─── Storage (images) via ImgBB ────────────────────────
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(file: File, path: string): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) throw new Error(`La imagen excede el límite de 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

  // Convert to base64
  const b64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || IMGBB_KEY;

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('image', b64);
  formData.append('name', path.replace(/\//g, '_'));

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Error al subir imagen a ImgBB');

  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Error en ImgBB');

  return data.data.url;
}

// ─── Tutorials ─────────────────────────────────────────
export async function fetchTutorials() {
  const q = query(collection(db, 'tutorials'), orderBy('order_index'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchTutorialProgress(userId: string) {
  const q = query(collection(db, 'tutorial_progress'), where('user_id', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function upsertTutorialProgress(data: any) {
  const docId = `${data.user_id}_${data.tutorial_id}`;
  await setDoc(doc(db, 'tutorial_progress', docId), { ...data, updated_at: serverTimestamp() }, { merge: true });
}

// ─── Projects ──────────────────────────────────────────
export async function fetchUserProjects(userId: string) {
  const q = query(collection(db, 'projects'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createUserProject(data: any) {
  const docRef = await addDoc(collection(db, 'projects'), { ...data, created_at: serverTimestamp() });
  return docRef.id;
}

export async function updateUserProject(projectId: string, data: any) {
  await updateDoc(doc(db, 'projects', projectId), { ...data, updated_at: serverTimestamp() });
}

export async function deleteUserProject(projectId: string) {
  await deleteDoc(doc(db, 'projects', projectId));
}

// ─── Components ────────────────────────────────────────
export async function fetchComponents() {
  const q = query(collection(db, 'components'), orderBy('category'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchUserComponents(userId: string) {
  const q = query(collection(db, 'user_components'), where('user_id', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addUserComponent(data: any) {
  await addDoc(collection(db, 'user_components'), { ...data, added_at: serverTimestamp() });
}

export async function removeUserComponent(docId: string) {
  await deleteDoc(doc(db, 'user_components', docId));
}

// ─── Achievements ──────────────────────────────────────
export async function fetchAchievements() {
  const q = query(collection(db, 'achievements'), orderBy('category'), orderBy('requirement_value'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchUserAchievements(userId: string): Promise<string[]> {
  const q = query(collection(db, 'user_achievements'), where('user_id', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().achievement_id);
}

// ─── Types ─────────────────────────────────────────────
export interface Component {
  id: string;
  name: string;
  category: string;
  description: string;
  typical_source: string;
  difficulty_level: number;
  image_url: string;
  properties: Record<string, string | number>;
  salvage_xp: number;
  co2_saved_g: number;
  created_at?: string;
}

export interface UserComponent {
  id: string;
  user_id: string;
  component_id: string;
  quantity: number;
  condition: string;
  source: string;
  notes: string;
  created_at?: string;
  component?: Component;
}

export interface DictionaryEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  function_desc: string;
  unit: string;
  common_source: string;
  image_url: string;
  color_class: string;
  created_at?: string;
}

export async function fetchDictionaryEntries() {
  const q = query(collection(db, 'dictionary'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DictionaryEntry));
}

export async function createDictionaryEntry(data: Omit<DictionaryEntry, 'id' | 'created_at'>) {
  const docRef = await addDoc(collection(db, 'dictionary'), { ...data, created_at: serverTimestamp() });
  return docRef.id;
}

export async function updateDictionaryEntry(id: string, data: Partial<DictionaryEntry>) {
  await updateDoc(doc(db, 'dictionary', id), data);
}

export async function deleteDictionaryEntry(id: string) {
  await deleteDoc(doc(db, 'dictionary', id));
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: number;
  duration_minutes: number;
  xp_reward: number;
  content: TutorialBlock[];
  required_components: string[];
  image_url: string;
  tags: string[];
  order_index: number;
  created_at?: string;
}

export interface TutorialBlock {
  type: 'text' | 'code' | 'warning' | 'tip' | 'image' | 'quiz';
  content: string;
  language?: string;
  options?: string[];
  answer?: number;
}

export interface TutorialProgress {
  id: string;
  user_id: string;
  tutorial_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  completed_at?: string | null;
  created_at?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: 'planning' | 'in_progress' | 'completed' | 'shared';
  difficulty_level: number;
  components_used: string[];
  steps: ProjectStep[];
  images: string[];
  xp_earned: number;
  is_public: boolean;
  likes_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStep {
  title: string;
  description: string;
  completed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  created_at?: string;
}

// ─── Helpers ────────────────────────────────────────────
export function difficultyLabel(level: number): string {
  const labels = ['', 'Principiante', 'Básico', 'Intermedio', 'Avanzado', 'Experto'];
  return labels[level] || 'Experto';
}

export function difficultyColor(level: number): string {
  return ['', 'text-emerald-400', 'text-teal-400', 'text-amber-400', 'text-orange-400', 'text-red-400'][level] ?? 'text-red-400';
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    basics: 'Fundamentos', circuits: 'Circuitos', robotics: 'Robótica',
    ewaste: 'E-waste', projects: 'Proyectos', general: 'General',
    resistor: 'Resistencia', capacitor: 'Capacitor', diode: 'Diodo',
    led: 'LED', transistor: 'Transistor', ic: 'Circuito Integrado',
    motor: 'Motor', sensor: 'Sensor', power: 'Fuente de Poder',
    cable: 'Cable', display: 'Pantalla', wireless: 'Inalámbrico',
  };
  return map[cat] ?? cat;
}
export async function verifyUser(userId: string) {
  await updateDoc(doc(db, 'users', userId), { verified: true });
}

export async function setUserVerified(userId: string, verified: boolean) {
  await updateDoc(doc(db, 'users', userId), { verified });
}

export async function setUserRole(userId: string, role: UserRole) {
  await updateDoc(doc(db, 'users', userId), { role });
  const changedBy = auth.currentUser?.uid || 'system';
  try {
    await addDoc(collection(db, 'admin_logs'), {
      action: 'role_change',
      admin_name: changedBy,
      details: `Usuario ${userId} cambió a rol ${role}`,
      created_at: new Date().toISOString(),
    });
  } catch {}
}

export async function deletePost(postId: string) {
  await deleteDoc(doc(db, 'community_posts', postId));
}

export async function deleteComment(commentId: string) {
  await deleteDoc(doc(db, 'community_comments', commentId));
}

export async function togglePostPinned(postId: string, pinned: boolean) {
  await updateDoc(doc(db, 'community_posts', postId), { pinned });
}

export async function searchUserById(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch { return null; }
}

export async function listAllUsers(max = 100): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), orderBy('total_xp', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
}

export async function awardXP(userId: string, xpAmount: number) {
  const prof = await fetchProfile(userId);
  if (prof) {
    const newTotal = (prof.total_xp ?? 0) + xpAmount;
    await updateDoc(doc(db, 'users', userId), {
      total_xp: newTotal,
      level: Math.max(1, Math.floor(Math.sqrt(newTotal / 100)) + 1),
    });
  } else {
    await createProfile(userId, { total_xp: xpAmount });
  }
}

export async function awardXPWithCounter(userId: string, xpAmount: number, counterField: keyof UserProfile) {
  const prof = await fetchProfile(userId);
  if (prof) {
    const newTotal = (prof.total_xp ?? 0) + xpAmount;
    await updateDoc(doc(db, 'users', userId), {
      total_xp: newTotal,
      level: Math.max(1, Math.floor(Math.sqrt(newTotal / 100)) + 1),
      [counterField]: increment(1),
    });
  } else {
    await createProfile(userId, { total_xp: xpAmount, [counterField]: 1 });
  }
}

// ─── Single Project fetch ──────────────────────────────
export async function fetchProject(projectId: string) {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── Admin Projects (curated by admins / institutions) ───
export interface AdminProject {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  materials: { name: string; source: string }[];
  tools: string[];
  steps: string[];
  tips: string[];
  created_by: string;
  institution_name?: string;
  difficulty?: string;
  created_at: Timestamp;
  updated_at?: Timestamp;
}

const cache = new Map<string, { data: any; expiry: number }>();

export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs = 60000): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiry > now) return cached.data as T;
  const data = await fetcher();
  cache.set(key, { data, expiry: now + ttlMs });
  return data;
}

export function invalidateCache(key: string) {
  cache.delete(key);
}

export async function fetchAdminProjects(): Promise<AdminProject[]> {
  return cachedFetch('admin_projects', async () => {
    const q = query(collection(db, 'admin_projects'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminProject));
  }, 30000);
}

export async function createAdminProject(data: Partial<AdminProject>) {
  const docRef = await addDoc(collection(db, 'admin_projects'), {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAdminProject(projectId: string, data: Partial<AdminProject>) {
  await updateDoc(doc(db, 'admin_projects', projectId), { ...data, updated_at: serverTimestamp() });
}

export async function deleteAdminProject(projectId: string) {
  await deleteDoc(doc(db, 'admin_projects', projectId));
}

// ─── Project Ratings ─────────────────────────────────────────
export async function fetchProjectRatings(projectId: string) {
  try {
    const ratingsSnap = await getDocs(collection(db, 'project_ratings', projectId, 'ratings'));
    let total = 0, count = 0, userRating = 0;
    ratingsSnap.forEach(d => {
      const r = d.data().rating;
      total += r; count++;
      if (d.id === auth.currentUser?.uid) userRating = r;
    });
    return { average: count > 0 ? total / count : 0, count, userRating };
  } catch { return { average: 0, count: 0, userRating: 0 }; }
}

export async function rateProject(projectId: string, userId: string, rating: number) {
  await setDoc(doc(db, 'project_ratings', projectId, 'ratings', userId), { rating, updated_at: serverTimestamp() }, { merge: true });
}

// ─── Project Comments ───────────────────────────────────────
export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: Timestamp;
}

export async function fetchProjectComments(projectId: string): Promise<ProjectComment[]> {
  try {
    const q = query(collection(db, 'project_comments'), where('project_id', '==', projectId));
    const snap = await getDocs(q);
    const comments = await Promise.all(snap.docs.map(async d => {
      const data = d.data() as ProjectComment;
      let user: UserProfile | null = null;
      try {
        const userSnap = await getDoc(doc(db, 'users', data.user_id));
        if (userSnap.exists()) user = userSnap.data() as UserProfile;
      } catch {}
      return { ...data, id: d.id, user };
    }));
    return comments.sort((a, b) => {
      const ta = a.created_at ? (a.created_at as any).toDate?.()?.getTime() || 0 : 0;
      const tb = b.created_at ? (b.created_at as any).toDate?.()?.getTime() || 0 : 0;
      return tb - ta;
    });
  } catch (e) { console.error('fetchProjectComments error:', e); return []; }
}

export async function addProjectComment(data: Partial<ProjectComment>) {
  try {
    await addDoc(collection(db, 'project_comments'), {
      ...data,
      created_at: serverTimestamp(),
    });
  } catch (e) { console.error('addProjectComment error:', e); }
}

export async function deleteProjectComment(commentId: string) {
  await deleteDoc(doc(db, 'project_comments', commentId));
}

// ─── Ban System ─────────────────────────────────────────
export async function banUser(userId: string, reason: string, bannedBy: string, expiresAt?: string | null) {
  await updateDoc(doc(db, 'users', userId), {
    banned: true,
    ban_reason: reason,
    banned_at: new Date().toISOString(),
    banned_by: bannedBy,
    ban_expires: expiresAt || null,
  });
}

export async function unbanUser(userId: string) {
  await updateDoc(doc(db, 'users', userId), {
    banned: false,
    ban_reason: null,
    banned_at: null,
    banned_by: null,
    ban_expires: null,
  });
}

// ─── Admin Chat ─────────────────────────────────────────
export interface AdminChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: Timestamp;
}

export async function sendAdminChatMessage(data: Partial<AdminChatMessage>) {
  const docRef = await addDoc(collection(db, 'admin_chat'), {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function fetchAdminChatMessages() {
  const q = query(collection(db, 'admin_chat'), orderBy('created_at', 'asc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminChatMessage));
}

// ─── Global Notifications ──────────────────────────────
export interface GlobalNotification {
  id: string;
  message: string;
  created_by: string;
  display_name: string;
  created_at: Timestamp;
}

export async function sendGlobalNotification(message: string, userId: string) {
  const docRef = await addDoc(collection(db, 'global_notifications'), {
    message,
    created_by: userId,
    display_name: 'EcoReEngine',
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function fetchGlobalNotifications() {
  const q = query(collection(db, 'global_notifications'), orderBy('created_at', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GlobalNotification));
}

export async function sendDirectNotification(userId: string, message: string): Promise<void> {
  await addDoc(collection(db, 'user_notifications'), {
    user_id: userId,
    message,
    type: 'direct',
    created_at: serverTimestamp(),
    read: false,
  });
}

export async function fetchGlobalNotificationsForUser() {
  const q = query(collection(db, 'global_notifications'), orderBy('created_at', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id, type: 'global', message: d.data().message,
    display_name: d.data().display_name || 'EcoReEngine',
    read: false, created_at: d.data().created_at,
  }));
}

// ─── Recycling Centers ─────────────────────────────────
export interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  schedule?: string;
  accepts: string[];
  lat: number;
  lng: number;
  type: 'centro' | 'punto' | 'tienda';
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export async function fetchRecyclingCenters(): Promise<RecyclingCenter[]> {
  const q = query(collection(db, 'recycling_centers'), orderBy('city'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RecyclingCenter));
}

export async function addRecyclingCenter(data: Omit<RecyclingCenter, 'id' | 'created_at' | 'updated_at'>) {
  const docRef = await addDoc(collection(db, 'recycling_centers'), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateRecyclingCenter(id: string, data: Partial<RecyclingCenter>) {
  await updateDoc(doc(db, 'recycling_centers', id), { ...data, updated_at: serverTimestamp() });
}

export async function deleteRecyclingCenter(id: string) {
  await deleteDoc(doc(db, 'recycling_centers', id));
}

export async function seedRecyclingCenters(): Promise<number> {
  const existing = await fetchRecyclingCenters();
  if (existing.length > 0) return 0;

  const centers = [
    { name: 'EcoCentro Caracas', address: 'Av. Libertador, Edif. Eco, Pb', city: 'Caracas', phone: '0212-555-0101', schedule: 'Lun-Sáb 8:00-17:00', accepts: ['electrónicos', 'baterías', 'pilas', 'celulares', 'computadoras'], lat: 10.4806, lng: -66.9036, type: 'centro' as const },
    { name: 'Punto Verde Miranda', address: 'CC Sambil, Nivel PB, Local 15', city: 'Caracas', phone: '0212-555-0202', schedule: 'Lun-Dom 10:00-20:00', accepts: ['pilas', 'baterías', 'celulares'], lat: 10.4964, lng: -66.8512, type: 'punto' as const },
    { name: 'ReciclaTech Valencia', address: 'Av. Bolívar Norte, Edif. Techno', city: 'Valencia', phone: '0241-555-0303', schedule: 'Lun-Vie 8:00-16:00', accepts: ['electrónicos', 'computadoras', 'impresoras', 'cables'], lat: 10.1621, lng: -68.0084, type: 'centro' as const },
    { name: 'EcoPunto Barquisimeto', address: 'Carrera 19 con Calle 28', city: 'Barquisimeto', phone: '0251-555-0404', schedule: 'Lun-Sáb 9:00-17:00', accepts: ['pilas', 'baterías', 'celulares', 'cargadores'], lat: 10.0679, lng: -69.3461, type: 'punto' as const },
    { name: 'Centro de Acopio Maracaibo', address: 'Av. 5 de Julio, Edif. Verde', city: 'Maracaibo', phone: '0261-555-0505', schedule: 'Lun-Vie 8:00-15:00', accepts: ['electrónicos', 'baterías', 'pilas', 'neveras', 'aires'], lat: 10.6548, lng: -71.6516, type: 'centro' as const },
    { name: 'Residuos Electrónicos Maturín', address: 'Av. Principal, CC Monagas', city: 'Maturín', phone: '0291-555-0606', schedule: 'Lun-Vie 9:00-16:00', accepts: ['electrónicos', 'computadoras', 'pilas'], lat: 9.7469, lng: -63.1769, type: 'centro' as const },
    { name: 'EcoTienda Barcelona', address: 'Av. Pedro María Freites, Local 7', city: 'Barcelona', phone: '0281-555-0707', schedule: 'Lun-Sáb 9:00-18:00', accepts: ['celulares', 'baterías', 'cargadores', 'accesorios'], lat: 10.1347, lng: -64.6856, type: 'tienda' as const },
    { name: 'Punto Ecológico Mérida', address: 'Av. 4, Edif. Solar', city: 'Mérida', phone: '0274-555-0808', schedule: 'Lun-Vie 8:00-17:00', accepts: ['pilas', 'baterías', 'electrónicos pequeños'], lat: 8.5925, lng: -71.1433, type: 'punto' as const },
    { name: 'Recicla Centro San Cristóbal', address: 'Av. España, Centro Comercial', city: 'San Cristóbal', phone: '0276-555-0909', schedule: 'Lun-Sáb 9:00-17:00', accepts: ['electrónicos', 'computadoras', 'impresoras'], lat: 7.7703, lng: -72.2266, type: 'centro' as const },
    { name: 'EcoPunto Puerto La Cruz', address: 'Av. Municipal, Local 3', city: 'Puerto La Cruz', phone: '0281-555-1010', schedule: 'Lun-Sáb 8:00-16:00', accepts: ['pilas', 'baterías', 'celulares'], lat: 10.2056, lng: -64.6285, type: 'punto' as const },
    { name: 'Centro de Reciclaje Ciudad Guayana', address: 'Av. Guayana, Zona Industrial', city: 'Ciudad Guayana', phone: '0286-555-1111', schedule: 'Lun-Vie 8:00-15:00', accepts: ['electrónicos', 'baterías', 'pilas', 'metales'], lat: 8.3454, lng: -62.6785, type: 'centro' as const },
    { name: 'EcoTienda Cumaná', address: 'Av. Universidad, Local 22', city: 'Cumaná', phone: '0293-555-1212', schedule: 'Lun-Sáb 9:00-18:00', accepts: ['celulares', 'baterías', 'cargadores'], lat: 10.4534, lng: -64.1726, type: 'tienda' as const },
    { name: 'Punto Verde Los Teques', address: 'Av. Bermúdez, Edif. Municipal', city: 'Los Teques', phone: '0212-555-1313', schedule: 'Lun-Vie 8:00-16:00', accepts: ['pilas', 'baterías', 'electrónicos pequeños'], lat: 10.3422, lng: -67.0398, type: 'punto' as const },
    { name: 'Recicla Falcón Coro', address: 'Calle Zamora, Edif. Ambiental', city: 'Coro', phone: '0268-555-1414', schedule: 'Lun-Vie 9:00-17:00', accepts: ['electrónicos', 'baterías', 'pilas'], lat: 11.4043, lng: -69.6806, type: 'centro' as const },
  ];

  let count = 0;
  for (const c of centers) {
    await addRecyclingCenter(c);
    count++;
  }
  return count;
}

// ─── App Post in Community (EcoReEngine official) ──────
export async function createAppPost(title: string, content: string, type: CommunityPost['type'], images: string[] = []) {
  const docRef = await addDoc(collection(db, 'community_posts'), {
    user_id: 'app_ecoreengine',
    type,
    title,
    content,
    images,
    tags: ['oficial'],
    likes_count: 0,
    comments_count: 0,
    pinned: true,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Unique Usernames ─────────────────────────────────
export async function checkUsernameTaken(username: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'usernames', username.toLowerCase().trim()));
    return snap.exists();
  } catch { return false; }
}

export async function reserveUsername(username: string, userId: string): Promise<boolean> {
  try {
    await setDoc(doc(db, 'usernames', username.toLowerCase().trim()), { user_id: userId, created_at: serverTimestamp() });
    return true;
  } catch { return false; }
}

export async function releaseUsername(username: string) {
  try { await deleteDoc(doc(db, 'usernames', username.toLowerCase().trim())); } catch {}
}

export async function setProfileWithUsername(userId: string, fullName: string, oldName?: string): Promise<{ ok: boolean; error?: string }> {
  const name = fullName.trim();
  if (name.length < 2) return { ok: false, error: 'El nombre debe tener al menos 2 caracteres' };
  const taken = await checkUsernameTaken(name);
  if (taken) return { ok: false, error: 'Ese nombre ya está en uso' };
  if (oldName && oldName.toLowerCase().trim() !== name.toLowerCase()) await releaseUsername(oldName);
  const reserved = await reserveUsername(name, userId);
  if (!reserved) return { ok: false, error: 'Error al reservar nombre' };
  await updateProfile(userId, { full_name: name });
  return { ok: true };
}

// ─── App Config (announcements, settings) ──────────────
export interface AppConfig {
  announcement: string;
  announcement_enabled: boolean;
  updated_at: string;
  updated_by: string;
  max_posts_per_day?: number;
  max_xp_per_hour?: number;
  max_comment_length?: number;
}

export async function fetchAppConfig(): Promise<AppConfig | null> {
  try {
    const snap = await getDoc(doc(db, 'app_config', 'global'));
    return snap.exists() ? (snap.data() as AppConfig) : null;
  } catch { return null; }
}

export async function setAppAnnouncement(text: string, enabled: boolean, userId: string) {
  await setDoc(doc(db, 'app_config', 'global'), {
    announcement: text,
    announcement_enabled: enabled,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }, { merge: true });
}

export async function updateAppConfig(config: Partial<AppConfig>): Promise<void> {
  await setDoc(doc(db, 'app_config', 'global'), config, { merge: true });
}

// ─── App Update (OTA) ────────────────────────────────
export interface AppUpdate {
  version: string;
  apk_url: string;
  changelog: string;
  force_update: boolean;
  updated_at: string;
  updated_by: string;
}

export async function fetchAppUpdate(): Promise<AppUpdate | null> {
  try {
    const snap = await getDoc(doc(db, 'app_config', 'update'));
    return snap.exists() ? (snap.data() as AppUpdate) : null;
  } catch { return null; }
}

export async function setAppUpdate(data: Partial<AppUpdate>, userId: string) {
  await setDoc(doc(db, 'app_config', 'update'), {
    ...data,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }, { merge: true });
}

// ─── Badge System ─────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  color: string;
  created_by: string;
  created_at: string;
}

export async function createBadge(data: Omit<Badge, 'id' | 'created_at'>) {
  const ref = await addDoc(collection(db, 'badges'), {
    ...data,
    created_at: new Date().toISOString(),
  });
  return ref.id;
}

export async function fetchBadges(): Promise<Badge[]> {
  const snap = await getDocs(query(collection(db, 'badges'), orderBy('created_at', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Badge));
}

export async function deleteBadge(badgeId: string) {
  await deleteDoc(doc(db, 'badges', badgeId));
}

export async function assignBadgeToUser(userId: string, badgeId: string) {
  await setDoc(doc(db, 'users', userId, 'badges', badgeId), {
    badge_id: badgeId,
    assigned_at: new Date().toISOString(),
  });
}

export async function removeBadgeFromUser(userId: string, badgeId: string) {
  await deleteDoc(doc(db, 'users', userId, 'badges', badgeId));
}

export async function fetchUserBadges(userId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'badges'));
  return snap.docs.map(d => d.data().badge_id);
}

export async function awardMassXP(xpAmount: number, _reason: string) {
  const users = await listAllUsers(500);
  let count = 0;
  for (const u of users) {
    try {
      await awardXP(u.id, xpAmount);
      count++;
    } catch {}
  }
  return count;
}

// ─── Admin Achievement Management ────────────────────────
export async function createAdminAchievement(data: { name: string; description: string; icon: string; created_by: string }) {
  const ref = await addDoc(collection(db, 'achievements'), {
    ...data,
    category: 'custom',
    requirement_value: 0,
    created_at: new Date().toISOString(),
  });
  return ref.id;
}

export async function deleteAdminAchievement(achievementId: string) {
  await deleteDoc(doc(db, 'achievements', achievementId));
}

export async function assignAchievementManually(userId: string, achievementId: string) {
  await addDoc(collection(db, 'user_achievements'), {
    user_id: userId,
    achievement_id: achievementId,
    assigned_by: 'admin',
    unlocked_at: new Date().toISOString(),
  });
}

// ─── Admin Audit Log ──────────────────────────────────────
export interface AdminLog {
  id: string;
  action: string;
  admin_id: string;
  admin_name: string;
  details: string;
  created_at: string;
}

export async function addAdminLog(action: string, adminName: string, details: string) {
  await addDoc(collection(db, 'admin_logs'), {
    action,
    admin_name: adminName,
    details,
    created_at: new Date().toISOString(),
  });
}

export async function fetchAdminLogs(limitCount = 50): Promise<AdminLog[]> {
  const snap = await getDocs(query(collection(db, 'admin_logs'), orderBy('created_at', 'desc'), limit(limitCount)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminLog));
}

export async function fetchClientErrors(): Promise<any[]> {
  const q = query(collection(db, 'client_errors'), orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function awardTutorialXp(userId: string, _tutorialId: string): Promise<void> {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    tutorials_completed: increment(1),
    total_xp: increment(50),
  });
}

// ─── Reset User Data ──────────────────────────────────────
export async function resetUserGameData(userId: string) {
  await updateDoc(doc(db, 'users', userId), {
    total_xp: 0,
    level: 1,
    high_score: 0,
    games_played: 0,
  });
}

// ─── Bulk Verify Users ────────────────────────────────────
export async function verifyAllUnverifiedUsers(): Promise<number> {
  const users = await listAllUsers(500);
  let count = 0;
  for (const u of users) {
    if (!u.verified) {
      try {
        await setUserVerified(u.id, true);
        count++;
      } catch {}
    }
  }
  return count;
}

const DAILY_CONTENT_COLLECTION = 'daily_content';

// ─── Daily Content ────────────────────────────────────────
export async function fetchDailyContent(date: string): Promise<{ content: string } | null> {
  const ref = doc(db, DAILY_CONTENT_COLLECTION, date);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { content: snap.data().content || '' };
}

export async function generateDailyContent(date: string): Promise<string> {
  const tips = [
    'Una placa base contiene oro, plata y cobre. ¡Reciclar 1 tonelada de placas base rinde más oro que 10 toneladas de mineral!',
    'Los LEDs pueden durar hasta 50,000 horas. Antes de tirar un aparato, recupera sus LEDs para proyectos.',
    'Los capacitores electrolíticos se encuentran en casi toda fuente de poder. Úsalos en filtros de voltaje.',
    'Los motores paso a paso de impresoras viejas son perfectos para proyectos robóticos.',
    'Reciclar un millón de laptops ahorra la energía equivalente a la que usan 3,657 hogares en un año.',
    'El estaño de las soldaduras viejas se puede refundir y reutilizar para nuevos proyectos.',
    'Un cable USB dañado aún sirve: sus hilos internos de cobre son útiles para prototipos.',
    'Los transformadores de cargadores rotos contienen bobinas de cobre valiosas.',
    'Los interruptores de teclados viejos (switches mecánicos) son ideales para proyectos de control.',
    'No tires CDs viejos: reflectan luz y pueden usarse como sensores ópticos caseros.',
    'Los parlantes de equipos de sonido rotos contienen imanes de neodimio muy potentes.',
    'Las baterías de laptops inservibles aún pueden tener celdas funcionales para proyectos de bajo consumo.',
    'Un ventilador de PC viejo puede convertirse en un generador eólico de baja potencia.',
    'El plástico ABS de las carcasas de electrodomésticos se puede triturar y reutilizar con acetona.',
    'Los relés de electrodomésticos viejos son excelentes para proyectos de automatización.',
    'Los sensores infrarrojos de controles remotos rotos funcionan para detectar obstáculos en robots.',
    'El cobre de los cables de parlantes es de alta pureza, ideal para bobinas y antenas.',
    'Las tarjetas de módem PCI contienen transformadores de aislamiento útiles.',
    'Los disipadores de calor de placas base viejas son perfectos para proyectos con transistores de potencia.',
    'Una impresora 3D puede fabricar carcasas usando filamento reciclado de botellas PET.',
    'Cada año generamos 50 millones de toneladas de e-waste. Solo el 20% se recicla formalmente.',
    'Recuperar componentes de e-waste reduce la minería: se necesitan 10 kg de mineral para 1 gramo de oro.',
    'El vidrio de tubos de rayos catódicos (CRT) contiene plomo. No lo tires a la basura común.',
    'Las pilas botón contienen mercurio. Deben llevarse a puntos de reciclaje especializados.',
    'Un cargador de celular roto puede donar su transformador, capacitor y puente rectificador.',
    'Los resortes de electrodomésticos viejos son de acero templado y sirven como herramientas.',
    'Los potenciómetros de equipos de audio rotos sirven para controles de velocidad en motores.',
    'El panel trasero de un monitor LCD contiene inversores de voltaje útiles para proyectos.',
    'Los diodos Zener encontrados en fuentes de poder sirven como reguladores de voltaje.',
    'Los conectores RJ45 de cables de red dañados pueden reutilizarse para proyectos IoT.',
    'Los microswitches de ratones viejos son perfectos para prototipos de electrónica.',
    'Las cámaras de teléfonos rotos contienen sensores CMOS que pueden reutilizarse.',
    'El motor vibrador de un celular viejo es un excelente actuador para robots pequeños.',
    'Las tiras de cobre de las placas de prototipo se pueden limpiar y reutilizar.',
    'Los fusibles de electrodomésticos viejos pueden probarse y reutilizarse si están enteros.',
    'Reciclar aluminio ahorra 95% de la energía necesaria para producirlo desde cero.',
    'Un horno microondas roto contiene un transformador de alta tensión muy peligroso. No lo manipules sin conocimiento.',
    'Los coolers de PC viejos tienen motores brushless que pueden controlarse con un driver.',
    'Las resistencias de carbón se encuentran en toda placa y sirven para limitar corriente en LEDs.',
    'El mercurio de un termómetro roto es extremadamente tóxico. No lo toques y ventila el área.',
  ];

  const dayOfYear = (() => {
    const d = new Date(date + 'T12:00:00');
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d.getTime() - start.getTime()) / 86400000);
  })();

  const content = tips[dayOfYear % tips.length];
  await setDoc(doc(db, DAILY_CONTENT_COLLECTION, date), { content, generated_at: serverTimestamp() });
  return content;
}

// ─── Project Images (for static projects) ────────────────
export async function fetchProjectImage(projectId: number): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'project_images', `static_${projectId}`));
    return snap.exists() ? snap.data().image_url || null : null;
  } catch { return null; }
}

export async function saveProjectImage(projectId: number, imageUrl: string) {
  await setDoc(doc(db, 'project_images', `static_${projectId}`), { image_url: imageUrl, updated_at: serverTimestamp() });
}

export async function deleteProjectImage(projectId: number) {
  await deleteDoc(doc(db, 'project_images', `static_${projectId}`));
}

