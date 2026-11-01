import mongoose, { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function normalizePositiveMinutes(value: unknown) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number.');
  }
  return minutes;
}

function normalizeObjectId(value: unknown, fieldName: string) {
  const raw = String(value ?? '').trim();
  if (!raw || !isValidObjectId(raw)) {
    throw badRequest(`${fieldName} must be a valid ObjectId.`);
  }
  return new mongoose.Types.ObjectId(raw);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required.');
  }

  const candidate = input as Record<string, unknown>;
  const userId = normalizeObjectId(candidate.userId, 'userId');
  const teamId = normalizeObjectId(candidate.teamId, 'teamId');
  const user = await User.findById(userId);
  const team = await Team.findById(teamId);

  if (!user || !team) {
    throw badRequest('Referenced user and team must both exist.');
  }

  const type = typeof candidate.type === 'string' ? candidate.type.trim() : '';
  const minutes = normalizePositiveMinutes(candidate.minutes);

  if (!type) {
    throw badRequest('Activity type is required.');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required.');
  }

  const candidate = input as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const mascot = typeof candidate.mascot === 'string' ? candidate.mascot.trim() : '';

  if (!name || !mascot) {
    throw badRequest('Team name and mascot are required.');
  }

  const members = Array.isArray(candidate.members)
    ? candidate.members.map((member) => normalizeObjectId(member, 'members'))
    : [];

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: Number(entry.totalPoints),
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = decodeURIComponent(String(userEmail ?? '')).trim();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found.'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentType = recentActivities[0]?.type?.toLowerCase();
  const focus = (user.fitnessGoal || recentType || 'endurance').toString().trim();
  const workouts = await Workout.find().lean();

  const scored = workouts
    .map((workout) => {
      const workoutFocus = String(workout.focus ?? '').toLowerCase();
      const userFocus = focus.toLowerCase();
      const matchesFocus = workoutFocus === userFocus;
      const matchesRecentActivity = recentType ? workoutFocus === recentType : false;
      const score = matchesFocus || matchesRecentActivity ? 2 : 0;
      const reason = matchesFocus
        ? `${workout.title} matches your ${userFocus} goal and supports your recent ${recentType || 'activity'} pattern.`
        : `${workout.title} supports your ${recentType || userFocus} activity pattern and keeps your ${userFocus} goal on track.`;

      return { ...workout, _score: score, reason };
    })
    .filter((workout) => workout._score > 0)
    .sort((a, b) => Number(b._score) - Number(a._score));

  return scored.map(({ _score, ...workout }) => workout);
}

export { User };
