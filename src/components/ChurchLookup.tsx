import React, { useState, type ReactEventHandler } from 'react';
import { useStore } from '@nanostores/react';
import FontAwesomeIcon from './FontAwesomeIcon';
import { ChurchesService, ChurchResultFilter } from '../types/services/ChurchesService.ts';
import { sharedAuthManager } from '../utils/SharedState.ts';

export interface SelectedChurch {
  id: string;
  displayName: string;
}

interface Props {
  required?: boolean;
  readOnly?: boolean;
  currentChurch?: SelectedChurch | null;
}

enum ChurchLookupState {
  Initialized,
  Querying,
  Displaying
}

export default function ChurchLookup({ required, readOnly, currentChurch }: Props) {

  const authManager = useStore(sharedAuthManager);

  const [searchText, setSearchText] = useState(currentChurch?.displayName || "");
  const [lookupState, setLookupState] = useState<ChurchLookupState>(ChurchLookupState.Initialized);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState(currentChurch || null);
  const [isChurchDialogOpen, setIsChurchDialogOpen] = useState(false);
  const [churchResults, setChurchResults] = useState([]);

  function handleClick(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      startSearch();
    }
  }

  async function startSearch(): Promise<void> {

    setLookupState(ChurchLookupState.Querying);

    const token = await authManager.getLatestAccessToken();
    const churchService = new ChurchesService(token);
    churchService.getChurches(
      (churches, pageCount) => {
        setIsLoadingResults(false);
        if (churches.length > 0) {
          setSelectedChurch({
            id: churches[0].Id,
            displayName: `${churches[0].Name}, ${churches[0].PhysicalAddress.City}, ${churches[0].PhysicalAddress.State}`
          });

          setIsChurchDialogOpen(false);
        } else {
          alert("No churches found matching your search criteria.");
        }
      },
      (error) => {
        setIsLoadingResults(false);
        alert("Error retrieving churches: " + error);
      },
      10, // Page size
      0, // Page number
      searchText,
      null, // Region ID
      null, // District ID
      ChurchResultFilter.All); // List All churches.
  }

  /*
      <Dialog isOpen={isChurchDialogOpen} width="max-w-full">
        <h3 className="font-bold text-lg mb-4">Select a Church</h3>
        <div className="grid grid-cols-1">
          <div className="w-full flex">
            <input
              type="text"
              name="churchName"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={handleClick}
              placeholder="Search by name or location"
              className="input input-bordered w-full"
              tabIndex={0}
              disabled={isLoadingResults}
              required
            />
            <button
              type="button"
              className="btn btn-primary ml-2"
              disabled={!searchText || searchText.length === 0 || isLoadingResults}
              onClick={e => startSearch()}
            >
              <FontAwesomeIcon icon="fas faSearch" />
            </button>
          </div>
          <div className="text-xs mt-2">
            <p>You can search with the following (in whole or part):</p>
            <ul className="list-disc pl-5">
              <li>
                <i>Church Name</i> (e.g. Cedar Park)
              </li>
              <li>
                <i>City, State</i> (e.g. Seattle, WA)
              </li>
              <li>
                <i>Church Name, City, State</i> (e.g. Cedar Park, Seattle, WA)
              </li>
              <li>
                <i>Church Name, Street Address, City, State</i> (e.g. Cedar Park, 123 Any Street, Seattle, WA)
              </li>
            </ul>
          </div>
        </div>
      </Dialog>*/

  return (
    <>
      <div className="relative flex gap-2">
        <input
          type="text"
          className="input input-bordered grow"
          placeholder="Name or location"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          required={required ?? false}
          readOnly={lookupState === ChurchLookupState.Querying || (readOnly ?? false)}
        />
        {!readOnly && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => startSearch()}
            disabled={lookupState === ChurchLookupState.Querying}
          >
            <FontAwesomeIcon icon="fas faSearch" />
            Search
          </button>)}
      </div>
      {!readOnly && (
        <span className="text-xs">
          Enter <b>Name</b> (e.g., "Cedar Park"), <b>City & State</b> (e.g., "Seattle, WA"), or <b>both</b> (e.g., "Cedar Park, Bothell, WA"), and then click <b>Search</b>.
        </span>)}
      {lookupState !== ChurchLookupState.Initialized && (
        <fieldset className="fieldset border-base-300 rounded-box w-full border p-4 relative flex gap-2 mt-2">
          <legend className="fieldset-legend">Church Search Results</legend>
          {lookupState === ChurchLookupState.Querying && (
            <>
              <span className="loading loading-spinner loading-sm"></span>&nbsp;
              <span className="text-sm">
                Searching ...
              </span>
            </>)}
          {lookupState === ChurchLookupState.Displaying && (
            <div className="w-full">
              {churchResults.length}
            </div>)}
        </fieldset>
      )}
    </>);
}