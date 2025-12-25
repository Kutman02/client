/**
 * Извлекает YouTube video ID из URL
 * @param url - URL YouTube видео
 * @returns YouTube video ID или исходный URL если не удалось извлечь
 */
export function getYouTubeID(url: string | null | undefined): string | null {
  if (!url) return null;
  
  /**
   * Регулярное выражение охватывает:
   * 1. youtube.com/watch?v=ID
   * 2. youtu.be/ID
   * 3. youtube.com/embed/ID
   * 4. youtube.com/v/ID
   */
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  // YouTube ID всегда состоит из 11 символов
  return (match && match[2]?.length === 11) ? match[2] : url;
}