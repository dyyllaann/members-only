// 40 synthetic posts for validating the trending pipeline end to end
// (design doc Section 8) without writing to a database. Three planted
// patterns, plus one-off noise:
//   - "midterm": 8 posts, plain text, all within the last 20 hours
//   - #careerfair: 6 posts, hashtag, spread over 4 days (announced event)
//   - "coffee": 12 posts, plain text, all 5-6 days old (a burst that faded)
// Relative to a fixed NOW so results are deterministic.

const NOW = new Date('2026-09-24T12:00:00Z');
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000);

const midterm = [
  'Studying for the midterm all night',
  'Is the midterm cumulative?',
  'Midterm study group at Odegaard',
  'That midterm was rough',
  'Anyone have the midterm practice exam?',
  'Midterm curve rumors are wild',
  'Pulled an all nighter for this midterm',
  'Midterm grades posted yet?',
].map((message, i) => ({ message, hashtags: [], timestamp: hoursAgo(2 + i * 2) }));

const careerFair = [
  'Allen School fair next week, bring resumes #careerfair',
  'Which companies are coming? #careerfair',
  'Resume review before the fair #careerfair',
  'Dress code for the fair? #careerfair',
  'Got an interview from the fair #careerfair',
  'Fair was packed today #careerfair',
].map((message, i) => ({ message, hashtags: ['careerfair'], timestamp: hoursAgo(96 - i * 16) }));

const coffee = [
  'Best coffee near the Ave?', 'Coffee at Cafe Allegro is elite', 'Need coffee badly',
  'Free coffee in the HUB', 'Coffee line is insane', 'Iced coffee season is over',
  'Coffee recommendations please', 'Third coffee of the day', 'Coffee shop studying hits different',
  'Who wants coffee', 'Coffee spilled on my laptop', 'Coffee and code',
].map((message, i) => ({ message, hashtags: [], timestamp: hoursAgo(120 + i * 2) }));

const noise = [
  'Lost my umbrella somewhere', 'Husky stadium looked amazing', 'Parking tickets are a scam',
  'Rainy walk to class', 'Found a cat near Suzzallo', 'Library printer broken again',
  'Bus was late twice', 'Pizza night with roommates', 'Laundry machines all taken',
  'Sunset from the quad', 'New ramen spot opened', 'Gym is packed',
  'Bike got a flat', 'Fire alarm at 3am',
].map((message, i) => ({ message, hashtags: [], timestamp: hoursAgo(1 + i * 11) }));

module.exports = { NOW, posts: [...midterm, ...careerFair, ...coffee, ...noise] };
