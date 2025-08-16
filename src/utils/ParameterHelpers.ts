/**
 * Helpers for interacting with parameters.
 */
export class ParameterHelpers {

    /**
     * Encodes HTML into plain text.
     * 
     * @param rawHtml HTML to be encoded.
     */
    public static htmlEncode(rawHtml: string | null): string {

        if (null == rawHtml) {
            return "";
        }

        let encodedHtml: string = rawHtml
            .replace("\t", "    ")
            .replace(" ", "&nbsp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace(/((\r\n)|\r|\n)/g, "<br />");

        return encodedHtml;
    }

    /**
     * Encodes value into URL format.
     * 
     * @param rawValue Value to be converted.
     */
    public static urlEncode(rawValue: string | null): string {

        if (null == rawValue) {
            return "";
        }

        return <string>((<any>window).escape(rawValue));
    }

    /**
     * Extracts a URL parameter.
     * 
     * @param name Name of the URL parameter.
     */
    public static getUrlParameter(name: string): string | null {

        let queryString = window.location.search;
        if (null == queryString || 0 == queryString.length) {
            return null;
        }

        let pattern: string = "[\\?&]" + name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]') + "=([^&#]*)";
        let results: string[] = new RegExp(pattern).exec(queryString);

        return null == results || 0 == results.length
            ? null
            : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
}