import { Request, Response, NextFunction } from 'express';

// List of inappropriate words/phrases to filter
const INAPPROPRIATE_WORDS = [
  'spam', 'scam', 'hack', 'virus', 'malware',
  // todo; add more, or pull list from internet
];

// List of suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /https?:\/\/[^\s]+/g, // URLs
  /@\w+/g, // Email-like patterns
  /\b\d{4,}\b/g, // Long number sequences (potential spam)
];

/**
 * Validate message content
 */
export const validateMessage = (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  if (content.length > 500) {
    return res.status(400).json({ error: 'Message is too long (max 500 characters)' });
  }

  if (content.length < 2) {
    return res.status(400).json({ error: 'Message is too short (min 2 characters)' });
  }

  next();
};

/**
 * Sanitize message content
 */
export const sanitizeMessage = (req: Request, res: Response, next: NextFunction) => {
  let { content } = req.body;

  // Basic HTML sanitization
  content = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

  // Check for inappropriate content
  const lowerContent = content.toLowerCase();
  const hasInappropriateContent = INAPPROPRIATE_WORDS.some(word => 
    lowerContent.includes(word.toLowerCase())
  );

  if (hasInappropriateContent) {
    return res.status(400).json({ 
      error: 'Message contains inappropriate content',
      sanitized: false 
    });
  }

  const hasSuspiciousPatterns = SUSPICIOUS_PATTERNS.some(pattern => 
    pattern.test(content)
  );

  if (hasSuspiciousPatterns) {
    return res.status(400).json({ 
      error: 'Message contains suspicious content (URLs, emails, etc.)',
      sanitized: false 
    });
  }

  // Additional content filtering
  content = content.replace(/\s+/g, ' ').trim();
  content = content.replace(/[!]{3,}/g, '!!!');
  content = content.replace(/[?]{3,}/g, '???');

  // Update the request body with sanitized content
  req.body.content = content;
  req.body.isModerated = false;

  next();
};
