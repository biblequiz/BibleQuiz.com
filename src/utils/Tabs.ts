/**
 * Checks if a tab is active.
 * @param tabId Id for the tab.
 * @returns Value indicating if the tab is active.
 */
export function isTabActive(tabId: string | null | undefined): boolean {
    if (!tabId) {
        return false;
    }
    
    const element = document.getElementById(tabId);
    if (element) {
        return element.classList.contains("tab-active");
    }

    return false;
}