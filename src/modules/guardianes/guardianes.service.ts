import { AppDataSource } from '../../ormconfig';
import { GuardianesEvent } from '../../entities/GuardianesEvent';

const repo = () => AppDataSource.getRepository(GuardianesEvent);

export class GuardianesService {
  async storeEvent(body: {
    id: string;
    type: string;
    timestamp: number;
    playerId: string;
    data?: Record<string, any>;
  }) {
    const event = repo().create({
      eventId: body.id,
      type: body.type,
      timestamp: body.timestamp ?? Date.now(),
      playerId: body.playerId,
      data: body.data ?? {},
    });
    return repo().save(event);
  }

  async getStats() {
    const events = await repo().find({ order: { timestamp: 'ASC' } });

    // Unique players
    const playerIds = new Set(events.map(e => e.playerId));

    // Age distribution
    const ageDist: Record<number, number> = {};
    const registrations = events.filter(e => e.type === 'registration');
    for (const e of registrations) {
      const age = e.data?.age ?? 10;
      ageDist[age] = (ageDist[age] || 0) + 1;
    }

    // Chapter funnel
    const chapterStarts: Record<string, number> = {};
    const chapterCompletes: Record<string, number> = {};
    for (const e of events) {
      if (e.type === 'chapter_start') {
        const ch = e.data?.chapterId;
        if (ch) chapterStarts[ch] = (chapterStarts[ch] || 0) + 1;
      }
      if (e.type === 'chapter_complete') {
        const ch = e.data?.chapterId;
        if (ch) chapterCompletes[ch] = (chapterCompletes[ch] || 0) + 1;
      }
    }

    // Mission stats
    const missionAttempts: Record<string, number> = {};
    const missionCompletes: Record<string, number> = {};
    const missionRetries: Record<string, number> = {};
    for (const e of events) {
      const mid = e.data?.missionId;
      if (!mid) continue;
      if (e.type === 'mission_start') missionAttempts[mid] = (missionAttempts[mid] || 0) + 1;
      if (e.type === 'mission_complete') missionCompletes[mid] = (missionCompletes[mid] || 0) + 1;
      if (e.type === 'mission_retry') missionRetries[mid] = (missionRetries[mid] || 0) + 1;
    }

    // Avatar choices
    const avatarChoices: Record<string, number> = {};
    for (const e of registrations) {
      const avatar = e.data?.avatarCharacterId ?? 'lila';
      avatarChoices[avatar] = (avatarChoices[avatar] || 0) + 1;
    }

    // Sessions per day (last 30 days)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sessionsPerDay: Record<string, number> = {};
    for (const e of events.filter(e => e.type === 'session_start' && e.timestamp > thirtyDaysAgo)) {
      const day = new Date(e.timestamp).toISOString().slice(0, 10);
      sessionsPerDay[day] = (sessionsPerDay[day] || 0) + 1;
    }

    // Retention
    const playerDays = new Map<string, Set<string>>();
    for (const e of events) {
      if (!playerDays.has(e.playerId)) playerDays.set(e.playerId, new Set());
      playerDays.get(e.playerId)!.add(new Date(e.timestamp).toISOString().slice(0, 10));
    }
    let returnedPlayers = 0;
    for (const [, days] of playerDays) {
      if (days.size > 1) returnedPlayers++;
    }
    const retentionRate = playerIds.size > 0 ? Math.round((returnedPlayers / playerIds.size) * 100) : 0;

    // Game completers
    const allChapterIds = ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6'];
    let gameCompleters = 0;
    for (const pid of playerIds) {
      const completed = new Set(
        events.filter(e => e.playerId === pid && e.type === 'chapter_complete').map(e => e.data?.chapterId),
      );
      if (allChapterIds.every(ch => completed.has(ch))) gameCompleters++;
    }

    // Device distribution
    const sessionStarts = events.filter(e => e.type === 'session_start');
    let mobileCount = 0;
    let desktopCount = 0;
    for (const e of sessionStarts) {
      if (e.data?.isMobile) mobileCount++; else desktopCount++;
    }

    // Error rate by age
    const errorsByAge: Record<number, { retries: number; attempts: number }> = {};
    for (const e of events) {
      const age = e.data?.age;
      if (!age) continue;
      if (!errorsByAge[age]) errorsByAge[age] = { retries: 0, attempts: 0 };
      if (e.type === 'mission_retry') errorsByAge[age].retries++;
      if (e.type === 'mission_start') errorsByAge[age].attempts++;
    }

    // Hours distribution
    const hourDist: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourDist[h] = 0;
    for (const e of sessionStarts) {
      const hour = new Date(e.timestamp).getHours();
      hourDist[hour]++;
    }

    // Drop-off
    const dropOff: Record<string, number> = {};
    for (const pid of playerIds) {
      const playerEvents = events.filter(e => e.playerId === pid);
      const completedChapters = new Set(
        playerEvents.filter(e => e.type === 'chapter_complete').map(e => e.data?.chapterId),
      );
      const startedChapters = playerEvents
        .filter(e => e.type === 'chapter_start')
        .map(e => e.data?.chapterId);
      const lastStarted = startedChapters[startedChapters.length - 1];
      if (lastStarted && !completedChapters.has(lastStarted)) {
        dropOff[lastStarted] = (dropOff[lastStarted] || 0) + 1;
      }
    }

    // Funnel
    const playersWithMission = new Set(events.filter(e => e.type === 'mission_complete').map(e => e.playerId));
    const playersWithChapter = new Set(events.filter(e => e.type === 'chapter_complete').map(e => e.playerId));
    const funnel = {
      registered: playerIds.size,
      firstMission: playersWithMission.size,
      firstChapter: playersWithChapter.size,
      allChapters: gameCompleters,
    };

    // Average progress
    let totalProgress = 0;
    for (const pid of playerIds) {
      const completed = new Set(
        events.filter(e => e.playerId === pid && e.type === 'chapter_complete').map(e => e.data?.chapterId),
      );
      totalProgress += completed.size;
    }
    const avgProgressPct = playerIds.size > 0 ? Math.round((totalProgress / playerIds.size / 7) * 100) : 0;

    return {
      totalPlayers: playerIds.size,
      totalEvents: events.length,
      ageDist,
      chapterStarts,
      chapterCompletes,
      missionAttempts,
      missionCompletes,
      missionRetries,
      avatarChoices,
      sessionsPerDay,
      retentionRate,
      gameCompleters,
      mobileCount,
      desktopCount,
      errorsByAge,
      hourDist,
      dropOff,
      funnel,
      avgProgressPct,
    };
  }

  async getEvents(limit = 500) {
    return repo().find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
