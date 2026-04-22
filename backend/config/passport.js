const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User           = require('../models/User');

// ── Google OAuth ─────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
    {
        clientID:     process.env.GOOGLE_CLIENT_ID     || 'GOOGLE_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET',
        callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
                // Check if email already exists
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    user.googleId = profile.id;
                    if (!user.avatar && profile.photos[0]) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                } else {
                    user = await User.create({
                        name:     profile.displayName,
                        email:    profile.emails[0].value,
                        googleId: profile.id,
                        avatar:   profile.photos[0]?.value || '',
                        credits:  100
                    });
                }
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

// ── GitHub OAuth ─────────────────────────────────────────────────────────────
passport.use(new GitHubStrategy(
    {
        clientID:     process.env.GITHUB_CLIENT_ID     || 'GITHUB_CLIENT_ID',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'GITHUB_CLIENT_SECRET',
        callbackURL:  process.env.GITHUB_CALLBACK_URL  || 'http://localhost:5000/api/auth/github/callback',
        scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ githubId: profile.id });

            if (!user) {
                const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
                user = await User.findOne({ email });
                if (user) {
                    user.githubId = profile.id;
                    await user.save();
                } else {
                    user = await User.create({
                        name:     profile.displayName || profile.username,
                        email,
                        githubId: profile.id,
                        avatar:   profile.photos[0]?.value || '',
                        credits:  100
                    });
                }
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));
