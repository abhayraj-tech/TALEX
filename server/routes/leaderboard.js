/**
 * TALEX Leaderboard & Student Performance API
 * Computes composite scores (0–1000), assigns rank tiers,
 * generates company recommendation scores, and identifies strengths/improvements.
 */
const express = require('express');
const { getCollection } = require('../config/db');

const router = express.Router();

// ===== BADGE TIER VALUES =====
const BADGE_TIERS = {
  bronze: 5,
  silver: 15,
  gold: 30,
  platinum: 50
};

// ===== RANK TIERS =====
const RANK_TIERS = [
  { min: 900, max: 1000, name: 'Grandmaster', emoji: '🏆' },
  { min: 750, max: 899,  name: 'Diamond',      emoji: '💎' },
  { min: 600, max: 749,  name: 'Platinum',     emoji: '🥇' },
  { min: 450, max: 599,  name: 'Gold',         emoji: '🥈' },
  { min: 300, max: 449,  name: 'Silver',       emoji: '🥉' },
  { min: 150, max: 299,  name: 'Bronze',       emoji: '🔵' },
  { min: 0,   max: 149,  name: 'Unranked',     emoji: '⚪' }
];

// ===== SCORING ENGINE =====

/**
 * 1. Problem Solving Power → 30% (max 300 pts)
 *    Weighted by difficulty: easy=1, medium=3, hard=7 + accuracy bonus
 */
function calcProblemSolving(ps) {
  if (!ps) return 0;
  const { difficulty_breakdown: d, accuracy_rate } = ps;
  const rawPoints = (d.easy * 1) + (d.medium * 3) + (d.hard * 7);
  const accuracyMultiplier = (accuracy_rate || 0) / 100;
  // Normalize: assume a max raw of ~1500 for top performers
  const normalized = Math.min((rawPoints * accuracyMultiplier) / 1200, 1);
  return Math.round(normalized * 300);
}

/**
 * 2. Test Performance → 25% (max 250 pts)
 *    Average % score across all tests, recency-weighted
 */
function calcTestPerformance(tests) {
  if (!tests || tests.length === 0) return 0;

  const now = new Date();
  let weightedSum = 0;
  let totalWeight = 0;

  // Sort by date ascending
  const sorted = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach((test, i) => {
    const daysSince = Math.max(1, (now - new Date(test.date)) / (1000 * 60 * 60 * 24));
    const recencyWeight = 1 + (i / sorted.length); // more recent = higher weight
    const pctScore = (test.score / test.max_score) * 100;
    weightedSum += pctScore * recencyWeight;
    totalWeight += recencyWeight;
  });

  const avgWeighted = weightedSum / totalWeight;
  return Math.round((avgWeighted / 100) * 250);
}

/**
 * 3. Consistency Score → 20% (max 200 pts)
 *    active_days/30 * 0.4 + current_streak/30 * 0.3 + longest_streak/60 * 0.3
 */
function calcConsistency(c) {
  if (!c) return 0;
  const activeDaysScore = Math.min(c.active_days_last_30 / 30, 1) * 0.4;
  const currentStreakScore = Math.min(c.current_streak_days / 30, 1) * 0.3;
  const longestStreakScore = Math.min(c.longest_streak_days / 60, 1) * 0.3;
  const total = activeDaysScore + currentStreakScore + longestStreakScore;
  return Math.round(total * 200);
}

/**
 * 4. Badge & Achievement Score → 10% (max 100 pts)
 *    Each badge: tier keyword → Bronze=5, Silver=15, Gold=30, Platinum=50
 */
function calcBadges(badges) {
  if (!badges || badges.length === 0) return 0;
  let total = 0;
  badges.forEach(badge => {
    const lower = badge.toLowerCase();
    if (lower.includes('platinum')) total += BADGE_TIERS.platinum;
    else if (lower.includes('gold')) total += BADGE_TIERS.gold;
    else if (lower.includes('silver')) total += BADGE_TIERS.silver;
    else total += BADGE_TIERS.bronze;
  });
  return Math.min(total, 100);
}

/**
 * 5. Community Contribution → 10% (max 100 pts)
 *    upvotes*2 + discussions*3 + help_given*5
 */
function calcCommunity(peer) {
  if (!peer) return 0;
  const raw = (peer.solutions_upvoted * 2) + (peer.discussions_started * 3) + (peer.help_given_count * 5);
  // Normalize: cap at a reasonable max (~1500)
  const normalized = Math.min(raw / 1500, 1);
  return Math.round(normalized * 100);
}

/**
 * 6. Improvement Momentum → 5% (max 50 pts)
 *    improvement_rate percentage → capped at 50
 */
function calcImprovement(rate) {
  if (!rate) return 0;
  return Math.min(Math.round(rate), 50);
}

/**
 * Compute the full evaluation for a student
 */
function evaluateStudent(student) {
  const problemSolving = calcProblemSolving(student.problem_solving);
  const testPerformance = calcTestPerformance(student.test_scores);
  const consistency = calcConsistency(student.consistency);
  const badges = calcBadges(student.badges);
  const community = calcCommunity(student.peer_interactions);
  const improvement = calcImprovement(student.improvement_rate);

  const compositeScore = problemSolving + testPerformance + consistency + badges + community + improvement;

  // Determine rank tier
  const tier = RANK_TIERS.find(t => compositeScore >= t.min && compositeScore <= t.max) || RANK_TIERS[RANK_TIERS.length - 1];

  // Company recommendation score (0–100)
  const techStrength = ((problemSolving / 300) * 0.5 + (testPerformance / 250) * 0.5) * 40;
  const reliability = (consistency / 200) * 25;
  const softSkills = (community / 100) * 20;
  const growth = (improvement / 50) * 15;
  const companyScore = Math.round(Math.min(techStrength + reliability + softSkills + growth, 100));

  // Recruiter pitch
  const recruiterPitch = generateRecruiterPitch(student, compositeScore, tier, companyScore);

  // Strengths & improvements
  const { strengths, improve } = identifyStrengthsAndImprovements(student, {
    problemSolving, testPerformance, consistency, badges, community, improvement
  });

  // Next badge suggestion
  const nextBadge = suggestNextBadge(student, { problemSolving, consistency, community });

  return {
    student_id: student.student_id || student._id,
    name: student.name,
    avatar: student.avatar,
    gradient: student.gradient,
    composite_score: compositeScore,
    rank_tier: tier.name,
    rank_emoji: tier.emoji,
    score_breakdown: {
      problem_solving: problemSolving,
      test_performance: testPerformance,
      consistency,
      badges,
      community,
      improvement
    },
    leaderboard_position_estimate: 'Top 0%', // calculated after sorting
    company_recommendation: {
      score: companyScore,
      recruiter_pitch: recruiterPitch
    },
    strengths,
    improve,
    next_badge_suggestion: nextBadge,
    raw_data: {
      problems_solved: student.problem_solving?.problems_solved || 0,
      accuracy_rate: student.problem_solving?.accuracy_rate || 0,
      active_days: student.consistency?.active_days_last_30 || 0,
      current_streak: student.consistency?.current_streak_days || 0,
      badges_count: student.badges?.length || 0,
      improvement_rate: student.improvement_rate || 0
    }
  };
}

function generateRecruiterPitch(student, score, tier, companyScore) {
  const name = student.name.split(' ')[0];
  if (companyScore >= 80) {
    return `${name} is an elite performer ranked ${tier.name} with a ${student.problem_solving?.accuracy_rate}% accuracy rate across ${student.problem_solving?.problems_solved}+ problems. Exceptional technical depth paired with strong community leadership makes them a top-tier hire.`;
  } else if (companyScore >= 60) {
    return `${name} demonstrates strong technical skills with consistent growth trajectory. ${student.consistency?.current_streak_days}-day active streak shows dedication. A reliable candidate ready for challenging roles.`;
  } else if (companyScore >= 40) {
    return `${name} is a growing talent with solid fundamentals and a ${student.improvement_rate}% improvement rate. Shows promising potential with room for rapid advancement in the right environment.`;
  } else {
    return `${name} is an early-stage learner actively building foundations. Recent ${student.improvement_rate}% improvement signals strong motivation. Consider for internship or junior development programs.`;
  }
}

function identifyStrengthsAndImprovements(student, scores) {
  const strengths = [];
  const improve = [];

  // Analyze each dimension
  const dimensions = [
    { name: 'Problem Solving', score: scores.problemSolving, max: 300, data: () => `Solved ${student.problem_solving?.problems_solved} problems with ${student.problem_solving?.accuracy_rate}% accuracy, including ${student.problem_solving?.difficulty_breakdown?.hard} hard problems` },
    { name: 'Test Performance', score: scores.testPerformance, max: 250, data: () => { const avg = student.test_scores?.reduce((s, t) => s + (t.score/t.max_score)*100, 0) / (student.test_scores?.length || 1); return `Averaging ${avg.toFixed(0)}% across ${student.test_scores?.length} tests with strong recency trend`; } },
    { name: 'Consistency', score: scores.consistency, max: 200, data: () => `${student.consistency?.active_days_last_30}/30 active days with a ${student.consistency?.current_streak_days}-day current streak (longest: ${student.consistency?.longest_streak_days} days)` },
    { name: 'Badges', score: scores.badges, max: 100, data: () => `Earned ${student.badges?.length} badges including ${student.badges?.filter(b => b.toLowerCase().includes('platinum') || b.toLowerCase().includes('gold')).length} high-tier achievements` },
    { name: 'Community', score: scores.community, max: 100, data: () => `${student.peer_interactions?.solutions_upvoted} upvotes, ${student.peer_interactions?.help_given_count} help interactions, ${student.peer_interactions?.discussions_started} discussions started` },
    { name: 'Improvement', score: scores.improvement, max: 50, data: () => `${student.improvement_rate}% improvement rate over the last 30 days` }
  ];

  // Sort by normalized score (high to low)
  const sorted = dimensions.map(d => ({ ...d, pct: d.score / d.max })).sort((a, b) => b.pct - a.pct);

  // Top 3 strengths
  sorted.slice(0, 3).forEach(d => {
    strengths.push(`${d.name}: ${d.data()}`);
  });

  // Bottom 2 improvements
  sorted.slice(-2).forEach(d => {
    if (d.name === 'Problem Solving') improve.push(`Increase hard problem attempts — currently only ${student.problem_solving?.difficulty_breakdown?.hard} hard problems solved. Target 20% more this month.`);
    else if (d.name === 'Test Performance') improve.push(`Test scores averaging below potential — focus on timed practice tests to boost exam performance.`);
    else if (d.name === 'Consistency') improve.push(`Active only ${student.consistency?.active_days_last_30}/30 days — building a daily habit will significantly boost ranking.`);
    else if (d.name === 'Badges') improve.push(`Only ${student.badges?.length} badges earned — complete more skill challenges to unlock achievement badges.`);
    else if (d.name === 'Community') improve.push(`Community engagement is low — start answering peer questions and joining discussions to build visibility.`);
    else if (d.name === 'Improvement') improve.push(`Improvement momentum is plateauing — try new problem categories or higher difficulty tiers to reignite growth.`);
  });

  return { strengths: strengths.slice(0, 3), improve: improve.slice(0, 2) };
}

function suggestNextBadge(student, scores) {
  const badges = (student.badges || []).map(b => b.toLowerCase());

  if (scores.problemSolving >= 250 && !badges.some(b => b.includes('platinum') && b.includes('solver')))
    return 'Platinum Problem Solver — solve 50 more hard problems to unlock';
  if (scores.consistency >= 160 && !badges.some(b => b.includes('gold') && b.includes('streak')))
    return 'Gold Streak Master — maintain a 30-day streak to unlock';
  if (scores.community >= 70 && !badges.some(b => b.includes('gold') && b.includes('mentor')))
    return 'Gold Mentor — help 50 peers to unlock';
  if (scores.problemSolving >= 150 && !badges.some(b => b.includes('silver') && b.includes('solver')))
    return 'Silver Problem Solver — reach 200 problems solved to unlock';
  if (scores.consistency >= 80 && !badges.some(b => b.includes('silver') && b.includes('streak')))
    return 'Silver Streak Builder — maintain a 14-day streak to unlock';

  return 'Bronze Explorer — complete 5 more courses to unlock';
}


// ===== API ENDPOINTS =====

/**
 * GET /api/leaderboard
 * Returns all students sorted by composite score (full leaderboard)
 */
router.get('/', (req, res) => {
  try {
    const students = getCollection('student_performance');
    const allStudents = students.find();

    if (allStudents.length === 0) {
      return res.json({ success: true, data: [], message: 'No student performance data found' });
    }

    // Evaluate all students
    const evaluated = allStudents.map(s => evaluateStudent(s));

    // Sort by composite score descending
    evaluated.sort((a, b) => b.composite_score - a.composite_score);

    // Assign leaderboard positions
    evaluated.forEach((s, i) => {
      const pct = Math.max(1, Math.round(((i + 1) / evaluated.length) * 100));
      s.leaderboard_position_estimate = `Top ${pct}%`;
    });

    res.json({ success: true, data: evaluated });
  } catch (err) {
    console.error('[LEADERBOARD] Error:', err);
    res.status(500).json({ success: false, message: 'Server error computing leaderboard' });
  }
});

/**
 * GET /api/leaderboard/:studentId
 * Returns a single student's full evaluation
 */
router.get('/:studentId', (req, res) => {
  try {
    const students = getCollection('student_performance');
    const student = students.findOne({ student_id: req.params.studentId }) ||
                    students.findById(req.params.studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all students for position calculation
    const allStudents = students.find();
    const allEvaluated = allStudents.map(s => evaluateStudent(s));
    allEvaluated.sort((a, b) => b.composite_score - a.composite_score);

    const evaluation = evaluateStudent(student);
    const position = allEvaluated.findIndex(s => s.student_id === evaluation.student_id) + 1;
    const pct = Math.max(1, Math.round((position / allEvaluated.length) * 100));
    evaluation.leaderboard_position_estimate = `Top ${pct}%`;

    res.json({ success: true, data: evaluation });
  } catch (err) {
    console.error('[LEADERBOARD] Error:', err);
    res.status(500).json({ success: false, message: 'Server error evaluating student' });
  }
});

module.exports = router;
