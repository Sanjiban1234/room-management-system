import { db } from '@/lib/firebase';
import { headers } from 'next/headers';

/**
 * Safely extracts the client IP address from the request headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const xForwardedFor = headersList.get('x-forwarded-for');
    if (xForwardedFor) {
      // x-forwarded-for can be a comma-separated list. Take the first one (original client).
      const ip = xForwardedFor.split(',')[0].trim();
      if (ip) return ip;
    }
    const xRealIp = headersList.get('x-real-ip');
    if (xRealIp) return xRealIp.trim();
    
    return '127.0.0.1';
  } catch (error) {
    console.warn('Failed to retrieve client IP from headers, falling back to localhost:', error);
    return '127.0.0.1';
  }
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Checks if a specific action by a specific identifier is within the rate limit.
 * Uses a Firestore transaction to ensure atomic updates and safe parallel execution.
 * Fails open if Firebase is not properly initialized or operational.
 * 
 * @param action Name of the action (e.g. 'booking', 'login')
 * @param identifier Unique identifier for the client (e.g. IP address or email)
 * @param limit Maximum allowed points within the window
 * @param windowMs Duration of the sliding/fixed window in milliseconds
 */
export async function checkRateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const fallbackResult = { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };

  // Fail-open check: make sure Firestore is initialized and db object is fully operational
  try {
    if (!db || typeof db.collection !== 'function') {
      console.warn(`[RateLimiter] Firestore is not initialized or accessible. Action: ${action}, Identifier: ${identifier}. Failing open.`);
      return fallbackResult;
    }
  } catch (error) {
    console.warn(`[RateLimiter] Error checking Firestore db instance availability. Action: ${action}, Identifier: ${identifier}. Failing open. Details:`, error);
    return fallbackResult;
  }

  // Sanitize the identifier to be a safe document ID
  const sanitizedIdentifier = identifier.replace(/[^a-zA-Z0-9-_]/g, '_');
  const docId = `ratelimit_${action}_${sanitizedIdentifier}`;
  const docRef = db.collection('rateLimits').doc(docId);

  try {
    const result = await db.runTransaction(async (transaction: any) => {
      const doc = await transaction.get(docRef);
      const now = Date.now();

      if (!doc.exists) {
        const resetTime = now + windowMs;
        transaction.set(docRef, {
          points: 1,
          resetTime,
          updatedAt: new Date(now).toISOString()
        });
        return { allowed: true, remaining: limit - 1, resetTime };
      }

      const data = doc.data();
      const resetTime = data.resetTime || (now + windowMs);
      const points = data.points || 0;

      if (now > resetTime) {
        // Current window expired, reset points and duration
        const newResetTime = now + windowMs;
        transaction.set(docRef, {
          points: 1,
          resetTime: newResetTime,
          updatedAt: new Date(now).toISOString()
        });
        return { allowed: true, remaining: limit - 1, resetTime: newResetTime };
      }

      if (points >= limit) {
        // Limit exceeded
        return { allowed: false, remaining: 0, resetTime };
      }

      // Within limits, increment points
      const newPoints = points + 1;
      transaction.update(docRef, {
        points: newPoints,
        updatedAt: new Date(now).toISOString()
      });
      return { allowed: true, remaining: limit - newPoints, resetTime };
    });

    return result;
  } catch (error) {
    console.error(`[RateLimiter] Transaction failed for action: ${action}, identifier: ${identifier}. Error:`, error);
    // Fail-open to avoid locking out legitimate users in case of database errors
    return fallbackResult;
  }
}
