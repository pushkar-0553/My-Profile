import rateLimit from 'express-rate-limit';

// General API rate limiter: 120 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter: 10 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2FA verification rate limiter: 5 attempts per 15 minutes to prevent brute forcing
export const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many 2FA verification attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form limiter: allow up to 60 submissions per 15 minutes with graceful validation
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'You have submitted too many contact messages. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});
