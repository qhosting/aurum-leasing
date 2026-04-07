export var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditAction["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    AuditAction["PASSWORD_RESET_REQUEST"] = "PASSWORD_RESET_REQUEST";
    AuditAction["PASSWORD_RESET_SUCCESS"] = "PASSWORD_RESET_SUCCESS";
    AuditAction["UNAUTHORIZED_ACCESS"] = "UNAUTHORIZED_ACCESS";
})(AuditAction || (AuditAction = {}));
export class AuditLogger {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async log(params) {
        try {
            await this.pool.query('INSERT INTO audit_logs (user_id, email, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)', [
                params.user_id?.toString(),
                params.email,
                params.action,
                params.details ? JSON.stringify(params.details) : null,
                params.ip_address,
                params.user_agent,
            ]);
        }
        catch (err) {
            console.error('Audit Log Error:', err);
        }
    }
}
