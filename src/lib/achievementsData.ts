import { Achievement } from './firestore';

function iconPath(name: string): string {
  const clean = name.replace(/^[^\s]+\s/, '').replace(/ /g, '_');
  return `/logro/${clean}-removebg-preview.png`;
}

export const ACHIEVEMENTS_DATA: Omit<Achievement, 'id'>[] = [
  { name: '🌱 Reciclador Novato', description: 'Alcanza 20 puntos en una partida', category: 'eco', requirement_type: 'puzzle_score', requirement_value: 20, xp_reward: 15, icon: iconPath('🌱 Reciclador Novato') },
  { name: '♻️ Recolector Incansable', description: 'Recicla 100 residuos en total', category: 'eco', requirement_type: 'puzzle_total_recycled', requirement_value: 100, xp_reward: 50, icon: iconPath('♻️ Recolector Incansable') },
  { name: '🧹 Maestro del Reciclaje', description: 'Consigue 500 puntos en una partida', category: 'eco', requirement_type: 'puzzle_score', requirement_value: 500, xp_reward: 100, icon: iconPath('🧹 Maestro del Reciclaje') },
  { name: '🏆 Leyenda del Puzzle', description: 'Consigue 1000 puntos en una partida', category: 'eco', requirement_type: 'puzzle_score', requirement_value: 1000, xp_reward: 250, icon: iconPath('🏆 Leyenda del Puzzle') },
  { name: '🎯 Primer Proyecto', description: 'Completa tu primer proyecto del laboratorio', category: 'building', requirement_type: 'projects_completed', requirement_value: 1, xp_reward: 30, icon: iconPath('🎯 Primer Proyecto') },
  { name: '🔧 Mánager de Taller', description: 'Completa 5 proyectos', category: 'building', requirement_type: 'projects_completed', requirement_value: 5, xp_reward: 75, icon: iconPath('🔧 Mánager de Taller') },
  { name: '⚡ Ingeniero Electro', description: 'Completa 10 proyectos', category: 'building', requirement_type: 'projects_completed', requirement_value: 10, xp_reward: 150, icon: iconPath('⚡ Ingeniero Electro') },
  { name: '📖 Explorador del Diccionario', description: 'Revisa 10 componentes en el diccionario', category: 'learning', requirement_type: 'dictionary_views', requirement_value: 10, xp_reward: 20, icon: iconPath('📖 Explorador del Diccionario') },
  { name: '🧠 Sabio Electrónico', description: 'Revisa 30 componentes en el diccionario', category: 'learning', requirement_type: 'dictionary_views', requirement_value: 30, xp_reward: 60, icon: iconPath('🧠 Sabio Electrónico') },
  { name: '🔥 Racha de Fuego', description: 'Juega 3 días seguidos', category: 'general', requirement_type: 'streak_days', requirement_value: 3, xp_reward: 40, icon: iconPath('🔥 Racha de Fuego') },
  { name: '📅 Semana Verde', description: 'Juega 7 días seguidos', category: 'general', requirement_type: 'streak_days', requirement_value: 7, xp_reward: 100, icon: iconPath('📅 Semana Verde') },
  { name: '🗣️ Primer Chat', description: 'Hazle una pregunta a EcoBot', category: 'learning', requirement_type: 'chat_count', requirement_value: 1, xp_reward: 15, icon: iconPath('🗣️ Primer Chat') },
  { name: '💬 Curioso', description: 'Hazle 10 preguntas a EcoBot', category: 'learning', requirement_type: 'chat_count', requirement_value: 10, xp_reward: 50, icon: iconPath('💬 Curioso') },
  { name: '👥 Social', description: 'Publica algo en la comunidad', category: 'community', requirement_type: 'posts_count', requirement_value: 1, xp_reward: 25, icon: iconPath('👥 Social') },
  { name: '📣 Influencer Verde', description: 'Publica 5 cosas en la comunidad', category: 'community', requirement_type: 'posts_count', requirement_value: 5, xp_reward: 75, icon: iconPath('📣 Influencer Verde') },
  { name: '🏅 Sube de Nivel', description: 'Alcanza el nivel 5', category: 'general', requirement_type: 'level', requirement_value: 5, xp_reward: 40, icon: iconPath('🏅 Sube de Nivel') },
  { name: '💎 Veterano', description: 'Alcanza el nivel 10', category: 'general', requirement_type: 'level', requirement_value: 10, xp_reward: 150, icon: iconPath('💎 Veterano') },
  { name: '🎮 Gamer Reciclador', description: 'Juega 10 partidas del puzzle', category: 'eco', requirement_type: 'puzzle_games', requirement_value: 10, xp_reward: 30, icon: iconPath('🎮 Gamer Reciclador') },
  { name: '🃏 Vicio Saludable', description: 'Juega 50 partidas del puzzle', category: 'eco', requirement_type: 'puzzle_games', requirement_value: 50, xp_reward: 100, icon: iconPath('🃏 Vicio Saludable') },
  { name: '🌟 EcoReEngine Master', description: 'Completa todos los hitos del coach (50, 100, 300, 500, 1000)', category: 'general', requirement_type: 'all_milestones', requirement_value: 1, xp_reward: 500, icon: iconPath('🌟 EcoReEngine Master') },
];
