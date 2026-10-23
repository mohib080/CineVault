import { Request, Response, NextFunction } from 'express';

export type VisibilityType = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';

export interface ProtectedResource {
  id?: number;
  user_id: number;
  visibility: VisibilityType;
  share_token?: string | null;
  [key: string]: any;
}

/**
 * Pure policy evaluation function:
 * - PUBLIC: Anyone can access
 * - UNLISTED: Requester must be the resource owner OR provide matching query token
 * - PRIVATE: Requester must be the resource owner
 */
export function canAccessResource(
  resource: ProtectedResource,
  reqUser?: { id: number },
  tokenQuery?: string | string[]
): boolean {
  if (resource.visibility === 'PUBLIC') {
    return true;
  }

  const queryToken = Array.isArray(tokenQuery) ? tokenQuery[0] : tokenQuery;

  if (resource.visibility === 'UNLISTED') {
    const isOwner = Boolean(reqUser && reqUser.id === resource.user_id);
    const hasValidToken = Boolean(
      queryToken && resource.share_token && queryToken === resource.share_token
    );
    return isOwner || hasValidToken;
  }

  if (resource.visibility === 'PRIVATE') {
    return Boolean(reqUser && reqUser.id === resource.user_id);
  }

  return false;
}

/**
 * Express middleware helper to enforce resource visibility access.
 * Returns 403 Forbidden (or 404 Not Found if configured) when unauthorized.
 */
export function enforceResourceAccess(
  resource: ProtectedResource,
  req: Request,
  res: Response,
  resourceName = 'Resource'
): boolean {
  const allowed = canAccessResource(
    resource,
    (req as any).user,
    req.query.token as string
  );

  if (!allowed) {
    if (resource.visibility === 'PRIVATE') {
      res.status(403).json({
        error: 'Forbidden',
        message: `${resourceName} is private and only accessible by its owner.`
      });
    } else if (resource.visibility === 'UNLISTED') {
      res.status(403).json({
        error: 'Forbidden',
        message: `${resourceName} is unlisted. A valid secret share token is required.`
      });
    } else {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied to this ${resourceName.toLowerCase()}.`
      });
    }
    return false;
  }

  return true;
}
