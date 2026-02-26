
import { Pool } from 'pg';

export enum AuditAction {
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
    PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

export class AuditLogger {
    constructor(private pool: Pool) { }

    async log(params: {
        action: AuditAction;
        user_id?: string | number;
        email?: string;
        details?: any;
        ip_address?: string;
        user_agent?: string;
    }) {
        try {
            await this.pool.query(
                'INSERT INTO audit_logs (user_id, email, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
                [
                    params.user_id?.toString(),
                    params.email,
                    params.action,
                    params.details ? JSON.stringify(params.details) : null,
                    params.ip_address,
                    params.user_agent,
                ]
            );
        } catch (err) {
            console.error('Audit Log Error:', err);
        }
    }
}
