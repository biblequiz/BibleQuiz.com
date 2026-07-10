import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import {
    sharedGlobalStatusToast,
    sharedDirtyWindowState,
} from "../utils/SharedState";

const PROFILE_STORAGE_KEY = "auth-user-profile--";
const IMPERSONATION_STORAGE_KEY = "auth-impersonation--";
const MAX_DETAIL_LENGTH = 4000;
const GLOBAL_INIT_FLAG = "__bqGlobalNotificationManagerInitialized";
const SENSITIVE_QUERY_PARAM_NAMES = new Set([
    "access_token",
    "id_token",
    "refresh_token",
    "token",
    "code",
    "client_secret",
    "password",
    "key",
    "sig",
    "signature",
]);

interface SetupGlobalNotificationManagerOptions {
    packageVersion: string;
    appInsightsConnectionString: string;
}

interface AuthTelemetryContext {
    isAuthenticated: boolean;
    isImpersonating: boolean;
    permissionScopeSummary: string;
}

interface BrowserWindowState extends Window {
    isGlobalErrorHandlerExecuting?: boolean;
    [GLOBAL_INIT_FLAG]?: boolean;
}

interface ErrorWithHttpStatus {
    status?: number;
    statusCode?: number;
    response?: {
        status?: number;
    };
}

export function setupGlobalNotificationManager(options: SetupGlobalNotificationManagerOptions): void {
    const browserWindow = window as BrowserWindowState;
    if (browserWindow[GLOBAL_INIT_FLAG]) {
        return;
    }

    browserWindow[GLOBAL_INIT_FLAG] = true;

    const telemetryEnabled =
        !import.meta.env.DEV
        && typeof options.appInsightsConnectionString === "string"
        && options.appInsightsConnectionString.trim().length > 0;

    let telemetryClient: ApplicationInsights | null = null;
    if (telemetryEnabled) {
        try {
            telemetryClient = new ApplicationInsights({
                config: {
                    connectionString: options.appInsightsConnectionString.trim(),
                    samplingPercentage: 100,
                    disableExceptionTracking: true,
                    enableUnhandledPromiseRejectionTracking: false,
                    enableAutoRouteTracking: false,
                },
            });
            telemetryClient.loadAppInsights();
        } catch (error) {
            console.warn("Unable to initialize App Insights telemetry.", error);
            telemetryClient = null;
        }
    }

    const showGlobalToast = (title: string, message: string): void => {
        sharedGlobalStatusToast.set({
            type: "error",
            title,
            message,
        });
    };

    const beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
        if (sharedDirtyWindowState.get()) {
            event.preventDefault();
        }
    };

    const getBuildVersion = (): string => {
        const normalizedPackageVersion = (options.packageVersion ?? "").trim();
        if (normalizedPackageVersion.length > 0) {
            return normalizedPackageVersion;
        }

        return "unknown";
    };

    const redactValue = (value: string | null | undefined): string => {
        if (!value) {
            return "";
        }

        let redacted = value;
        redacted = redacted.replace(/(Bearer\s+)[^\s]+/gi, "$1<redacted>");
        redacted = redacted.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "<jwt-redacted>");
        redacted = redacted.replace(/(access_token|id_token|refresh_token|client_secret|password|code)=([^&\s]+)/gi, "$1=<redacted>");

        return redacted.length > MAX_DETAIL_LENGTH
            ? redacted.substring(0, MAX_DETAIL_LENGTH)
            : redacted;
    };

    const sanitizeUrl = (rawUrl: string | null | undefined): string => {
        if (!rawUrl) {
            return "";
        }

        try {
            const parsed = new URL(rawUrl, window.location.origin);
            const sanitizedParams = new URLSearchParams();

            parsed.searchParams.forEach((value, key) => {
                const normalizedKey = key.toLowerCase();
                if (SENSITIVE_QUERY_PARAM_NAMES.has(normalizedKey) || value.length > 200) {
                    sanitizedParams.set(key, "<redacted>");
                } else {
                    sanitizedParams.set(key, redactValue(value));
                }
            });

            const query = sanitizedParams.toString();
            return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ""}`;
        } catch {
            return redactValue(rawUrl);
        }
    };

    const resolvePermissionScopeSummary = (profile: Record<string, unknown> | null): string => {
        if (!profile) {
            return "none";
        }

        if (profile.organizationPermission) {
            return "organization";
        }

        const regionPermissions = profile.regionPermissions as Record<string, unknown> | null;
        if (regionPermissions && Object.keys(regionPermissions).length > 0) {
            return "region";
        }

        const districtPermissions = profile.districtPermissions as Record<string, unknown> | null;
        if (districtPermissions && Object.keys(districtPermissions).length > 0) {
            return "district";
        }

        const churchPermissions = profile.churchPermissions as unknown[] | null;
        if (Array.isArray(churchPermissions) && churchPermissions.length > 0) {
            return "church";
        }

        return "none";
    };

    const getAuthTelemetryContext = (): AuthTelemetryContext => {
        try {
            const serializedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
            const serializedImpersonation = window.localStorage.getItem(IMPERSONATION_STORAGE_KEY);

            if (!serializedProfile) {
                return {
                    isAuthenticated: false,
                    isImpersonating: !!serializedImpersonation,
                    permissionScopeSummary: "none",
                };
            }

            const profile = JSON.parse(serializedProfile) as Record<string, unknown>;
            return {
                isAuthenticated: !!profile.type && profile.type !== "NotConfigured",
                isImpersonating: !!serializedImpersonation,
                permissionScopeSummary: resolvePermissionScopeSummary(profile),
            };
        } catch {
            return {
                isAuthenticated: false,
                isImpersonating: false,
                permissionScopeSummary: "unknown",
            };
        }
    };

    const shouldIgnoreGlobalError = (
        message: string,
        fileName: string | null | undefined,
        lineNumber: number | null | undefined,
        columnNumber: number | null | undefined,
        error: Error | null | undefined,
        httpStatus?: number | null,
    ): boolean => {
        if (httpStatus !== null && httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
            return true;
        }

        if (message === "Script error." && !fileName
            && (lineNumber === null || lineNumber === undefined || lineNumber === 0)
            && (columnNumber === null || columnNumber === undefined || columnNumber === 0)
            && !error) {
            return true;
        }

        if (message === "Script error." || message === "ResizeObserver loop limit exceeded") {
            return true;
        }

        return false;
    };

    const readStatusValue = (value: unknown): number | null => {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string") {
            const parsed = Number.parseInt(value, 10);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }

        return null;
    };

    const extractHttpStatus = (value: unknown): number | null => {
        if (!value || typeof value !== "object") {
            return null;
        }

        const candidate = value as ErrorWithHttpStatus;
        const directStatus = readStatusValue(candidate.status);
        if (directStatus !== null) {
            return directStatus;
        }

        const statusCode = readStatusValue(candidate.statusCode);
        if (statusCode !== null) {
            return statusCode;
        }

        const responseStatus = readStatusValue(candidate.response?.status);
        if (responseStatus !== null) {
            return responseStatus;
        }

        return null;
    };

    const buildErrorDetails = (
        message: string,
        fileName?: string | null,
        lineNumber?: number | null,
        columnNumber?: number | null,
        error?: Error | null,
    ): string => {
        let details = `${redactValue(message)}\n\nWindow Location: ${sanitizeUrl(window.location.href)}\n\nBuild Version: ${getBuildVersion()}`;

        if (fileName) {
            details += `\n\nFile: ${sanitizeUrl(fileName)}`;
            if (lineNumber !== null && lineNumber !== undefined) {
                details += ` : ${lineNumber}`;
            }

            if (columnNumber !== null && columnNumber !== undefined) {
                details += ` (${columnNumber})`;
            }
        }

        if (error?.stack) {
            details += `\n\n${redactValue(error.stack)}`;
        }

        return details.length > MAX_DETAIL_LENGTH
            ? details.substring(0, MAX_DETAIL_LENGTH)
            : details;
    };

    const trackClientError = (
        eventType: "error" | "unhandledrejection",
        message: string,
        fileName?: string | null,
        lineNumber?: number | null,
        columnNumber?: number | null,
        error?: Error | null,
    ): void => {
        if (!telemetryClient) {
            return;
        }

        const authContext = getAuthTelemetryContext();

        try {
            telemetryClient.trackException({
                exception: error ?? new Error(redactValue(message)),
                properties: {
                    eventType,
                    message: redactValue(message),
                    details: buildErrorDetails(message, fileName, lineNumber, columnNumber, error),
                    pageUrl: sanitizeUrl(window.location.href),
                    buildVersion: getBuildVersion(),
                    isAuthenticated: `${authContext.isAuthenticated}`,
                    isImpersonating: `${authContext.isImpersonating}`,
                    permissionScopeSummary: authContext.permissionScopeSummary,
                },
            });
        } catch (trackingError) {
            console.warn("Unable to send App Insights exception telemetry.", trackingError);
        }
    };

    const unhandledExceptionHandler = (event: ErrorEvent): void => {
        if (browserWindow.isGlobalErrorHandlerExecuting) {
            return;
        }

        const httpStatus = extractHttpStatus(event.error);

        if (shouldIgnoreGlobalError(event.message, event.filename, event.lineno, event.colno, event.error, httpStatus)) {
            return;
        }

        browserWindow.isGlobalErrorHandlerExecuting = true;
        try {
            trackClientError("error", event.message, event.filename, event.lineno, event.colno, event.error);
            showGlobalToast("Unhandled Error", "An unexpected client-side error occurred.");
        } finally {
            browserWindow.isGlobalErrorHandlerExecuting = false;
        }
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent): void => {
        if (browserWindow.isGlobalErrorHandlerExecuting) {
            return;
        }

        let message = "Unknown error";
        let error: Error | null = null;
        const httpStatus = extractHttpStatus(event.reason);

        if (event.reason instanceof Error) {
            message = event.reason.message;
            error = event.reason;
        } else if (event.reason && typeof event.reason === "object" && "message" in event.reason) {
            message = String((event.reason as { message?: string }).message ?? "Unknown error");
        } else if (typeof event.reason === "string") {
            message = event.reason;
        } else if (event.reason !== null && event.reason !== undefined) {
            message = String(event.reason);
        }

        if (shouldIgnoreGlobalError(message, null, null, null, error, httpStatus)) {
            return;
        }

        browserWindow.isGlobalErrorHandlerExecuting = true;
        try {
            trackClientError("unhandledrejection", message, null, null, null, error);
            showGlobalToast("Unhandled Error", "An unexpected client-side error occurred.");
        } finally {
            browserWindow.isGlobalErrorHandlerExecuting = false;
        }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("error", unhandledExceptionHandler);
    window.addEventListener("unhandledrejection", unhandledRejectionHandler);
}