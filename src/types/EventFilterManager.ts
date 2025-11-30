import { map, type PreinitializedMapStore } from "nanostores";
import { useStore } from "@nanostores/react";
import type { EventInfo } from "./EventTypes";

const FILTERS_STORAGE_KEY = "event-list-filters--";

/**
 * The private state of the event filter manager.
 */
const privateStores = new WeakMap<EventFilterManager, PreinitializedMapStore<EventFilterManagerReactState>>();

/**
 * State of the event filter manager that must trigger React reloads.
 */
interface EventFilterManagerReactState {

    /**
     * Include only events where the name or location includes this text.
     */
    searchText: string | undefined;

    /**
     * Include only events where the region id matches this value.
     */
    regionId: string | undefined;

    /**
     * Include only events where the district id matches this value.
     */
    districtId: string | undefined;

    /**
     * Include only events of this type.
     */
    typeFilter: "jbq" | "tbq" | undefined;
}

/**
 * Manager for event filters.
 */
export class EventFilterManager {

    private static readonly _instance: EventFilterManager = new EventFilterManager();

    /**
     * Private constructor for the EventFilterManager.
     */
    private constructor() {

        const initialFilters: EventFilterManagerReactState = EventFilterManager.isPersistenceSupported()
            ? EventFilterManager.parseSerializedState(localStorage.getItem(FILTERS_STORAGE_KEY))
            : {} as EventFilterManagerReactState;

        EventFilterManager.registerFilterChangeListener();

        privateStores.set(this, map(initialFilters));
    }

    /**
     * Include only events where the name or location includes this text.
     */
    public get searchText(): string | undefined {
        return this.getNanoState().get().searchText;
    }

    /**
     * Include only events where the name or location includes this text.
     */
    public set searchText(value: string | undefined) {
        this.getNanoState().setKey("searchText", value);
        this.saveState();
    }

    /**
     * Include only events where the region id matches this value.
     */
    public get regionId(): string | undefined {
        return this.getNanoState().get().regionId;
    }

    /**
     * Include only events where the district id matches this value.
     */
    public get districtId(): string | undefined {
        return this.getNanoState().get().districtId;
    }

    /**
     * Include only events where the type matches this value.
     */
    public get typeFilter(): "jbq" | "tbq" | undefined {
        return this.getNanoState().get().typeFilter;
    }

    /**
     * Include only events where the type matches this value.
     */
    public set typeFilter(value: "jbq" | "tbq" | undefined) {
        this.getNanoState().setKey("typeFilter", value);
        this.saveState();
    }

    /**
     * Uses the nano store for the auth manager to trigger re-renders.
     */
    public static useNanoStore(): EventFilterManager {
        useStore(EventFilterManager._instance.getNanoState());
        return EventFilterManager._instance;
    }

    /**
     * Update the region and district id filters.
     * 
     * @param regionId Include only events where the region id matches this value.
     * @param districtId Include only events where the district id matches this value.
     */
    public setRegionAndDistrictId(regionId: string | undefined, districtId: string | undefined): void {

        this.getNanoState().set({
            ...this.getNanoState().get(),
            regionId: regionId,
            districtId: districtId
        });

        this.saveState();
    }

    /**
     * Determines if the event should be included.
     * 
     * @param event Event to be filtered.
     * @returns Value indicating whether the event should be included.
     */
    public includeEvent(event: EventInfo): boolean {
        if (!event.isVisible) {
            return false;
        }

        const filters = this.getNanoState().get();

        if (filters.searchText) {
            const searchText = filters.searchText.toLocaleLowerCase();

            if (!event.name.toLocaleLowerCase().includes(searchText) &&
                !event.locationName?.toLocaleLowerCase().includes(searchText) &&
                !event.locationCity?.toLocaleLowerCase().includes(searchText)) {
                return false;
            }
        }

        switch (event.scope) {
            case "region":
                if (filters) {
                    if (filters.regionId && filters.regionId != event.regionId) {
                        return false; // Region-level events must match the selected region since the filter includes one.
                    }
                }
                break;
            case "district":
                if (filters) {
                    if (
                        (filters.regionId && filters.regionId != event.regionId) ||
                        (filters.districtId && filters.districtId != event.districtId)) {

                        // District-level events must match the selected district OR be part of the selected
                        // region.
                        return false;
                    }
                }
                break;
        }

        return true;
    }

    private static parseSerializedState(serialized: string | null): EventFilterManagerReactState {

        if (serialized) {
            const deserialized = JSON.parse(serialized) as EventFilterManagerReactState;
            if (deserialized) {
                return deserialized;
            }
        }

        return {} as EventFilterManagerReactState;
    }

    private saveState(): void {

        if (!EventFilterManager.isPersistenceSupported()) {
            return;
        }

        const serialized = JSON.stringify(this.getNanoState().get());
        localStorage.setItem(FILTERS_STORAGE_KEY, serialized);
    }

    private static registerFilterChangeListener(): void {
        if (!EventFilterManager.isPersistenceSupported()) {
            return;
        }

        // Add listener for changes to the profile in other tabs.
        window.addEventListener(
            "storage",
            (event: StorageEvent) => {
                if (event.key === FILTERS_STORAGE_KEY) {
                    console.log("Detected change to event filters in another tab.");
                    EventFilterManager._instance.getNanoState().set(
                        EventFilterManager.parseSerializedState(event.newValue));
                }
            });
    }

    private static isPersistenceSupported(): boolean {
        return typeof window === "undefined" || !window.localStorage
            ? false
            : true;
    }

    private getNanoState(): PreinitializedMapStore<EventFilterManagerReactState> {
        return privateStores.get(this)!;
    }
}
