const express = require('express');
const router = express.Router();

// Professional default badges data
const badgesData = [
  {
    id: 'badge-java-expert',
    title: 'Java Expert',
    description: 'Mastered advanced Java concepts including Spring Boot, Multithreading, and Microservices architecture.',
    icon: '☕',
    status: 'earned',
    rarity: 'Legendary',
    dateEarned: '2026-03-15'
  },
  {
    id: 'badge-python-master',
    title: 'Python Master',
    description: 'Demonstrated deep expertise in Python, Data Science workflows, and AI frameworks like TensorFlow and PyTorch.',
    icon: '🐍',
    status: 'earned',
    rarity: 'Epic',
    dateEarned: '2026-04-10'
  },
  {
    id: 'badge-ui-ux',
    title: 'UI/UX Pioneer',
    description: 'Created highly intuitive and stunning user interfaces applying modern glassmorphism and design systems.',
    icon: '🎨',
    status: 'earned',
    rarity: 'Rare',
    dateEarned: '2026-02-28'
  },
  {
    id: 'badge-react-virtuoso',
    title: 'React Virtuoso',
    description: 'Advanced proficiency in React, Next.js, Server Components, and state management.',
    icon: '⚛️',
    status: 'locked',
    rarity: 'Epic'
  },
  {
    id: 'badge-cloud-architect',
    title: 'Cloud Architect',
    description: 'Designed and deployed scalable, secure, and highly available systems on AWS and Azure.',
    icon: '☁️',
    status: 'locked',
    rarity: 'Legendary'
  },
  {
    id: 'badge-data-science',
    title: 'Data Science Guru',
    description: 'Processed large datasets and trained state-of-the-art predictive models.',
    icon: '📊',
    status: 'locked',
    rarity: 'Epic'
  }
];

// GET /api/badges
router.get('/', (req, res) => {
  try {
    // In a real app, you would fetch these from a database (e.g., MongoDB) based on the authenticated user.
    res.json({
      success: true,
      badges: badgesData
    });
  } catch (err) {
    console.error('Error fetching badges:', err);
    res.status(500).json({ success: false, message: 'Server error fetching badges' });
  }
});

module.exports = router;
