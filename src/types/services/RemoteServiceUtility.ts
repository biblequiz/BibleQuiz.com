import { ParameterHelpers } from "../../utils/ParameterHelpers";
import type { AuthManager } from "../AuthManager";

/**
 * Endpoint in the service to use.
 */
export enum RemoteServiceUrlBase {

    /**
     * Registration service.
     */
    Registration,

    /**
     * Scores service.
     */
    Scores,
}

/**
 * Utility for interacting with remote services.
 */
export class RemoteServiceUtility {

    /**
     * Gets a single record.
     *
     * @param auth AuthManager to use if the request should be authenticated.
     * @param service Service defining the endpoint to execute.
     * @param path Path to the endpoint on the service.
     * @param id Id for the record.
     * @param additionalUrlParameters Additional URL parameters to be included in the request.
     */
    public static getSingle<T>(
        auth: AuthManager | null,
        service: RemoteServiceUrlBase,
        path: string,
        id: string,
        additionalUrlParameters?: URLSearchParams | null): Promise<T> {

        if (path.length > 0 && path[path.length - 1] !== "/") {
            path += `/${id}`;
        }
        else {
            path += id;
        }

        return this.executeHttpRequest<T>(
            auth,
            "GET",
            service,
            path,
            additionalUrlParameters);
    }

    /**
     * Gets a paginated result from the server.
     * 
     * @param auth AuthManager to use if the request should be authenticated.
     * @param service Service defining the endpoint to execute.
     * @param path Path to the endpoint on the service.
     * @param pageSize Size of the page to return.
     * @param pageNumber Page number for the result.
     * @param includeCount Indicates the count should be included in the response.
     * @param additionalUrlParameters Additional URL parameters to be included in the request.
     */
    public static getMany<T>(
        auth: AuthManager | null,
        service: RemoteServiceUrlBase,
        path: string,
        pageSize?: number,
        pageNumber?: number,
        includeCount?: boolean,
        additionalUrlParameters?: URLSearchParams | null): Promise<T> {

        const urlParameters: URLSearchParams = new URLSearchParams(additionalUrlParameters ?? undefined);
        if (null != pageSize) {
            urlParameters.set("pgsz", pageSize.toString());
        }

        if (null != pageNumber) {
            urlParameters.set("pg", pageNumber.toString());
        }

        if (includeCount) {
            urlParameters.set("count", "true");
        }

        return this.executeHttpRequest<T>(
            auth,
            "GET",
            service,
            path,
            urlParameters);
    }

    /**
     * Executes an HTTP request.
     * 
     * @param auth AuthManager to use if the request should be authenticated.
     * @param method HTTP method.
     * @param service Service defining the endpoint to execute.
     * @param path Path to the endpoint on the service.
     * @param urlParameters URL parameters to be included in the request.
     * @param data Data (if any) to submit.
     */
    public static executeHttpRequest<T>(
        auth: AuthManager | null,
        method: string,
        service: RemoteServiceUrlBase,
        path: string,
        urlParameters?: URLSearchParams | null,
        data?: any): Promise<T> {

        return new Promise<T>(async (resolve, reject) => {
            this.executeHttpRequestCore(
                auth,
                method,
                service,
                path,
                urlParameters,
                data)
                .then(async response => {
                    // This is a successful response, but it may not have a body (depending on the method).
                    if (response.body) {
                        try {
                            resolve(await response.json() as T);
                        }
                        catch (error) {
                            reject({
                                message: "Failed to parse response body: " + (error as Error).message,
                            } as RemoteServiceError);
                            return;
                        }
                    }
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Executes an HTTP request without a response body.
     * 
     * @param auth AuthManager to use if the request should be authenticated.
     * @param method HTTP method.
     * @param service Service defining the endpoint to execute.
     * @param path Path to the endpoint on the service.
     * @param urlParameters URL parameters to be included in the request.
     * @param data Data (if any) to submit.
     */
    public static executeHttpRequestWithoutResponse(
        auth: AuthManager | null,
        method: string,
        service: RemoteServiceUrlBase,
        path: string,
        urlParameters?: URLSearchParams | null,
        data?: any): Promise<void> {

        return new Promise<void>(async (resolve, reject) => {
            this.executeHttpRequestCore(
                auth,
                method,
                service,
                path,
                urlParameters,
                data)
                .then(response => resolve())
                .catch(error => reject(error));
        });
    }

    /**
     * Downloads a file from an HTTP request.
     * 
     * @param auth AuthManager to use if the request should be authenticated.
     * @param method HTTP method.
     * @param service Service defining the endpoint to execute.
     * @param path Path to the endpoint on the service.
     * @param urlParameters URL parameters to be included in the request.
     * @param suggestedFileName Suggested file name for the downloaded file.
     * @param data Data (if any) to submit.
     */
    public static downloadFromHttpRequest(
        auth: AuthManager | null,
        method: string,
        service: RemoteServiceUrlBase,
        path: string,
        urlParameters?: URLSearchParams | null,
        suggestedFileName?: string,
        data?: any): Promise<void> {

        return new Promise<void>(async (resolve, reject) => {
            this.executeHttpRequestCore(
                auth,
                method,
                service,
                path,
                urlParameters,
                data)
                .then(response => {
                    response.blob()
                        .then(blob => {

                            const fileName = suggestedFileName ??
                                RemoteServiceUtility.getFileNameFromContentDisposition(
                                    response.headers.get("Content-Disposition"));

                            const downloadUrl = window.URL.createObjectURL(blob);
                            try {
                                // Create temporary link and trigger download
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = fileName || 'download';
                                link.target = "_blank";

                                document.body.appendChild(link);
                                try {
                                    link.click();
                                }
                                finally {
                                    document.body.removeChild(link);
                                }
                            } finally {
                                window.URL.revokeObjectURL(downloadUrl);
                            }

                            resolve();
                        })
                        .catch(reject);
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Builds the URL parameters without null or empty values.
     * @param params Parameters to be included in the URL.
     */
    public static getFilteredUrlParameters(
        params: Record<string, any | null>): URLSearchParams {

        const result = new URLSearchParams();

        for (const key in params) {
            const value = params[key];
            if (value !== null && value !== undefined && (value.length === undefined || value.length > 0)) {
                result.set(key, value);
            }
        }
        return result;
    }

    /**
     * Builds the URL for the specified service, path, and URL parameters.
     * @param service Service defining the endpoint to execute.
     * @param path Path to the endpoint on the service.
     * @param urlParameters URL parameters to be included in the request.
     * @returns The fully constructed URL.
     */
    private static buildUrl(
        service: RemoteServiceUrlBase,
        path: string,
        urlParameters: URLSearchParams | null | undefined): string {

        // Build the base URL.
        let baseUrl: string;
        switch (service) {
            case RemoteServiceUrlBase.Registration:
                baseUrl = "https://registration.biblequiz.com";
                break;
            case RemoteServiceUrlBase.Scores:
                baseUrl = "https://scores.biblequiz.com";
                break;
            default:
                throw new Error(`Unsupported service: ${RemoteServiceUrlBase[service]}`);
        }

        const resolvedUrl = new URL(path, baseUrl);

        if (urlParameters) {
            resolvedUrl.search = urlParameters.toString();
        }

        return resolvedUrl.toString();
    }

    private static executeHttpRequestCore(
        auth: AuthManager | null,
        method: string,
        service: RemoteServiceUrlBase,
        path: string,
        urlParameters?: URLSearchParams | null,
        data?: any): Promise<Response> {

        const url = this.buildUrl(service, path, urlParameters);

        return new Promise<Response>(async (resolve, reject) => {

            // Retrieve the latest access token and setup the request.
            const fetchOptions: RequestInit = {
                method,
                headers: {},
            };

            let accessToken: string | null;
            if (auth) {
                try {
                    accessToken = await auth.getLatestAccessToken();
                } catch (error: any) {
                    console.log("Failed to get the latest access token: " + error?.message || error);
                    reject({
                        message: "You are no longer signed in. Please sign-in again.",
                    } as RemoteServiceError);
                    return;
                }

                if (accessToken && accessToken.length > 0) {
                    (fetchOptions.headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
                }
            }

            if (data) {
                (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
                fetchOptions.body = JSON.stringify(data);
            }

            fetch(url, fetchOptions)
                .then(async response => {

                    // If the response isn't okay, it is possible it contains an error message.
                    if (!response.ok) {

                        // Attempt to read the data as JSON.
                        let errorDetails: ApiError | null;
                        try {
                            errorDetails = await response.json();
                        } catch {
                            errorDetails = null;
                        }

                        // Attempt to convert to the standardized type.
                        let message = "An unknown error occurred.";
                        let mitigationCode: RemoteServiceMitigationCode | undefined = undefined;
                        if (errorDetails) {
                            if (errorDetails.Message) {
                                message = errorDetails.Message;
                            }

                            if (errorDetails.IsTransient) {
                                message += " Please try again as this may be a transient issue.";
                            }

                            if (errorDetails.Details) {
                                message += "<br />&nbsp;<br />" + errorDetails.Details;
                            } else if (errorDetails.ExceptionMessage) {
                                message += `<br />&nbsp;<br />[${ParameterHelpers.htmlEncode(errorDetails.ExceptionType)}] ${ParameterHelpers.htmlEncode(errorDetails.ExceptionMessage)}<br />${ParameterHelpers.htmlEncode(errorDetails.StackTrace || "")}`;
                            }

                            if (errorDetails.MitigationCode) {
                                mitigationCode = RemoteServiceMitigationCode[errorDetails.MitigationCode as keyof typeof RemoteServiceMitigationCode];
                            }
                        }

                        reject({
                            message,
                            statusCode: response.status,
                            mitigationCode,
                        } as RemoteServiceError);
                        return;
                    }

                    // This is a successful response, but it may not have a body (depending on the method).
                    resolve(response);
                })
                .catch(error => {
                    reject({
                        message: "Unable to execute request. Check to make sure you have an internet connection and try again."
                    } as RemoteServiceError);
                });
        });
    }

    private static getFileNameFromContentDisposition(contentDisposition: string | null): string | null {
        if (!contentDisposition) {
            return null;
        }

        // Try RFC 6266 format first: filename*=UTF-8''encoded-filename
        const rfc6266Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (rfc6266Match) {
            try {
                return decodeURIComponent(rfc6266Match[1]);
            } catch {
                // Fall through to other methods if decoding fails
            }
        }

        // Try quoted filename: filename="filename.ext"
        const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (quotedMatch) {
            return quotedMatch[1];
        }

        // Try unquoted filename: filename=filename.ext
        const unquotedMatch = contentDisposition.match(/filename=([^;]+)/i);
        if (unquotedMatch) {
            return unquotedMatch[1].trim();
        }

        return null;
    }
}

/**
 * Describes an error returned from the remote service.
 */
export interface RemoteServiceError {

    /**
     * Message for the error.
     */
    message: string;

    /**
     * Status code for the error, if any.
     */
    statusCode?: number;

    /**
     * Mitigation code for the error, if any.
     */
    mitigationCode?: RemoteServiceMitigationCode;
}

/**
 * Describes an error returned from the server.
 */
interface ApiError {

    /**
     * Message for the error.
     */
    Message: string | null;

    /**
     * Value indicating whether this is a transient error.
     */
    IsTransient: boolean;

    /**
     * Additional details about the error.
     */
    Details: string | null;

    /**
     * Code for the mitigation to this issue.
     */
    MitigationCode: string | null;

    /**
     * Message of the exception on the server.
     */
    ExceptionMessage: string | null;

    /**
     * Type of the exception on the server.
     */
    ExceptionType: string | null;

    /**
     * Stack Trace on the server.
     */
    StackTrace: string | null;
}

/**
 * Mitigation codes for Api Errors
 */
export enum RemoteServiceMitigationCode {

    /**
     * No special mitigation.
     */
    None = "",

    /**
     * Sign-up failed but a birthdate would help disambiguate.
     */
    SignUpBirthdate = "SignUpBirthdate",

    /**
     * Sign-up failed because the account already exists and the password should be reset.
     */
    SignUpResetPassword = "SignUpResetPassword",

    /**
     * Redirects to the sign-up page.
     */
    RedirectToSignUp = "RedirectSignUp",

    /**
     * Requests a copy of the waiver.
     */
    RequestWaiverCopy = "RequestWaiverCopy",

    /**
     * EZScore must fully reload the database due to backend configuration changes.
     */
    FullyLoadDatabase = "FullyLoadDatabase",

    /**
     * EZScore cannot download or upload dates because the scoring dates are out-of-range.
     */
    UpdateDatabaseDates = "UpdateScoringDatabaseDates",

    /**
     * EZScore cannot download because no meets are active.
     */
    ActivateMeets = "ActivateMeets",
}

/**
 * Page returned from a call to a paginated API
 */
export interface RemoteServicePage<T> {

    /**
     * Items on the page.
     */
    Items: T[];

    /**
     * Link (if any) to the next page.
     */
    NextPage: URL | null;

    /**
     * Total number of pages.
     */
    PageCount: number | null;
}

/**
 * Base interface for models from this service.
 */
export abstract class RemoteServiceModelBase<TId> {

    /**
     * ID for this model.
     */
    Id!: TId | null;
}